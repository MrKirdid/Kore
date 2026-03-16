/**
 * LuauAST — Lightweight regex/pattern-based AST walking utilities for Luau files.
 * Used as first-pass structural scan before deeper analysis.
 */

export interface LuauTableField {
  key: string;
  value: string;
  line: number;
}

export interface LuauParam {
  name: string;
  type: string;
}

export interface LuauFunction {
  name: string;
  params: LuauParam[];
  body: string;
  line: number;
  hasReturn: boolean;
  returnType: string | null;
}

/**
 * Extract the Name field from a returned table.
 */
export function extractName(source: string): string | null {
  const match = source.match(/Name\s*=\s*["']([^"']+)["']/);
  return match ? match[1] : null;
}

/**
 * Extract Dependencies array from a returned table.
 */
export function extractDependencies(source: string): string[] {
  const match = source.match(/Dependencies\s*=\s*\{([^}]*)\}/);
  if (!match) return [];

  const deps: string[] = [];
  const entries = match[1].matchAll(/["']([^"']+)["']/g);
  for (const entry of entries) {
    deps.push(entry[1]);
  }
  return deps;
}

/**
 * Extract all top-level functions from a table literal or module-level colon/dot definitions.
 *
 * When `excludeRange` is provided (start/end character indices), matches whose
 * start falls inside that range are skipped — this lets callers exclude the
 * Client table so its functions don't leak into top-level results.
 */
function parseParams(paramsStr: string): LuauParam[] {
  if (!paramsStr.trim()) return [];
  return paramsStr.split(',').map(p => {
    const trimmed = p.trim();
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx >= 0) {
      return { name: trimmed.substring(0, colonIdx).trim(), type: trimmed.substring(colonIdx + 1).trim() };
    }
    return { name: trimmed, type: 'any' };
  }).filter(p => p.name.length > 0);
}

function extractReturnType(source: string, afterIndex: number): string | null {
  const rest = source.substring(afterIndex);
  const rtMatch = rest.match(/^\s*:\s*(\S[^\n]*?)\s*(?:\n|$)/);
  return rtMatch ? rtMatch[1].trim() : null;
}

export function extractFunctions(source: string, excludeRange?: { start: number; end: number }): LuauFunction[] {
  const functions: LuauFunction[] = [];

  // Pattern 1: Table-inline: Name = function(params)
  const pattern1 = /(\w+)\s*=\s*function\s*\(([^)]*)\)/g;
  let match;

  while ((match = pattern1.exec(source)) !== null) {
    if (excludeRange && match.index >= excludeRange.start && match.index < excludeRange.end) continue;

    const name = match[1];
    const params = parseParams(match[2]);
    const afterParen = match.index + match[0].length;
    const declaredReturn = extractReturnType(source, afterParen);

    const bodyStart = declaredReturn ? source.indexOf('\n', afterParen) + 1 : afterParen;
    const bodyEnd = findMatchingEnd(source, afterParen);
    const body = source.substring(bodyStart, bodyEnd);
    const hasReturn = /\breturn\b/.test(body);
    const returnType = declaredReturn || (hasReturn ? 'any' : null);

    const line = source.substring(0, match.index).split('\n').length;

    functions.push({ name, params, body, line, hasReturn, returnType });
  }

  // Pattern 2: Colon syntax: function VarName:MethodName(params)
  const pattern2 = /function\s+\w+:(\w+)\s*\(([^)]*)\)/g;

  while ((match = pattern2.exec(source)) !== null) {
    if (excludeRange && match.index >= excludeRange.start && match.index < excludeRange.end) continue;

    const name = match[1];
    const params = parseParams(match[2]);
    const afterParen = match.index + match[0].length;
    const declaredReturn = extractReturnType(source, afterParen);

    const bodyStart = declaredReturn ? source.indexOf('\n', afterParen) + 1 : afterParen;
    const bodyEnd = findMatchingEnd(source, afterParen);
    const body = source.substring(bodyStart, bodyEnd);
    const hasReturn = /\breturn\b/.test(body);
    const returnType = declaredReturn || (hasReturn ? 'any' : null);

    const line = source.substring(0, match.index).split('\n').length;

    // Colon syntax has implicit self, no need to add it
    functions.push({ name, params, body, line, hasReturn, returnType });
  }

  // Pattern 3: Dot syntax: function VarName.MethodName(self, ...params)
  const pattern3 = /function\s+\w+\.(\w+)\s*\(([^)]*)\)/g;

  while ((match = pattern3.exec(source)) !== null) {
    if (excludeRange && match.index >= excludeRange.start && match.index < excludeRange.end) continue;

    const name = match[1];
    // Skip if this looks like VarName.Client.MethodName (handled separately)
    const fullMatch = source.substring(Math.max(0, match.index - 20), match.index + match[0].length);
    if (/\.Client\./.test(fullMatch)) continue;

    const params = parseParams(match[2]);
    const afterParen = match.index + match[0].length;
    const declaredReturn = extractReturnType(source, afterParen);

    const bodyStart = declaredReturn ? source.indexOf('\n', afterParen) + 1 : afterParen;
    const bodyEnd = findMatchingEnd(source, afterParen);
    const body = source.substring(bodyStart, bodyEnd);
    const hasReturn = /\breturn\b/.test(body);
    const returnType = declaredReturn || (hasReturn ? 'any' : null);

    const line = source.substring(0, match.index).split('\n').length;

    functions.push({ name, params, body, line, hasReturn, returnType });
  }

  return functions;
}

/**
 * Extract the Client table content.
 * Prefers external assignment (`VarName.Client = {`) over inline (`Client = {` inside
 * CreateService). This is critical because auto-templates may include an empty inline
 * `Client = {}` placeholder — the external assignment is the one with actual methods.
 *
 * When multiple matches exist, picks the one with the most content (largest range).
 */
export function extractClientTable(source: string): { content: string; start: number; end: number } | null {
  // Collect all candidate matches
  const candidates: { content: string; start: number; end: number; external: boolean }[] = [];

  // Pattern 1: External assignment — VarName.Client = {
  const externalPattern = /\w+\.Client\s*=\s*\{/g;
  let m;
  while ((m = externalPattern.exec(source)) !== null) {
    const braceIndex = source.indexOf('{', m.index);
    if (braceIndex === -1) continue;
    const end = findMatchingBrace(source, braceIndex);
    if (end === -1) continue;
    candidates.push({
      content: source.substring(braceIndex + 1, end),
      start: braceIndex,
      end: end + 1,
      external: true,
    });
  }

  // Pattern 2: Inline — Client = { (inside a table literal)
  const inlinePattern = /(?:^|[\s,])Client\s*=\s*\{/gm;
  while ((m = inlinePattern.exec(source)) !== null) {
    const braceIndex = source.indexOf('{', m.index);
    if (braceIndex === -1) continue;
    const end = findMatchingBrace(source, braceIndex);
    if (end === -1) continue;
    // Skip if this overlaps an already-found external match
    const overlaps = candidates.some(c => c.external && braceIndex >= c.start && braceIndex < c.end);
    if (overlaps) continue;
    candidates.push({
      content: source.substring(braceIndex + 1, end),
      start: braceIndex,
      end: end + 1,
      external: false,
    });
  }

  if (candidates.length === 0) return null;

  // Prefer external assignments; among those, pick the largest
  const externals = candidates.filter(c => c.external);
  if (externals.length > 0) {
    externals.sort((a, b) => b.content.length - a.content.length);
    return externals[0];
  }

  // Fallback to inline, pick the largest
  candidates.sort((a, b) => b.content.length - a.content.length);
  return candidates[0];
}

/**
 * Extract Kore.NetEvent keys from Client table.
 */
export function extractNetEvents(clientSource: string): string[] {
  const events: string[] = [];
  const pattern = /(\w+)\s*=\s*Kore\.NetEvent/g;
  let match;

  while ((match = pattern.exec(clientSource)) !== null) {
    events.push(match[1]);
  }

  return events;
}

/**
 * Extract Middleware keys from Client table.
 */
export function extractMiddleware(clientSource: string): { name: string; hasInbound: boolean; hasOutbound: boolean }[] {
  const result: { name: string; hasInbound: boolean; hasOutbound: boolean }[] = [];
  const mwMatch = clientSource.match(/Middleware\s*=\s*\{/);
  if (!mwMatch || mwMatch.index === undefined) return result;

  const start = mwMatch.index + mwMatch[0].length;
  const end = findMatchingBrace(clientSource, start - 1);
  if (end === -1) return result;

  const mwContent = clientSource.substring(start, end);
  const entryPattern = /(\w+)\s*=\s*\{([^}]*)\}/g;
  let match;

  while ((match = entryPattern.exec(mwContent)) !== null) {
    result.push({
      name: match[1],
      hasInbound: /Inbound/.test(match[2]),
      hasOutbound: /Outbound/.test(match[2]),
    });
  }

  return result;
}

/**
 * Extract RateLimit keys from Client table.
 */
export function extractRateLimits(clientSource: string): { name: string; maxCalls: number; perSeconds: number }[] {
  const result: { name: string; maxCalls: number; perSeconds: number }[] = [];
  const rlMatch = clientSource.match(/RateLimit\s*=\s*\{/);
  if (!rlMatch || rlMatch.index === undefined) return result;

  const start = rlMatch.index + rlMatch[0].length;
  const end = findMatchingBrace(clientSource, start - 1);
  if (end === -1) return result;

  const rlContent = clientSource.substring(start, end);
  const entryPattern = /(\w+)\s*=\s*\{\s*MaxCalls\s*=\s*(\d+)\s*,\s*PerSeconds\s*=\s*(\d+)\s*\}/g;
  let match;

  while ((match = entryPattern.exec(rlContent)) !== null) {
    result.push({
      name: match[1],
      maxCalls: parseInt(match[2], 10),
      perSeconds: parseInt(match[3], 10),
    });
  }

  return result;
}

/**
 * Check if Client.Batching = true.
 */
export function extractBatching(clientSource: string): boolean {
  return /Batching\s*=\s*true/.test(clientSource);
}

/**
 * Find matching closing brace for an opening brace.
 */
function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Find matching 'end' for a function start.
 */
function findMatchingEnd(source: string, startIndex: number): number {
  let depth = 1;
  const keywords = /\b(function|if|for|while|repeat|do)\b|\bend\b/g;
  keywords.lastIndex = startIndex;
  let match;

  while ((match = keywords.exec(source)) !== null) {
    if (match[0] === 'end') {
      depth--;
      if (depth === 0) return match.index;
    } else {
      depth++;
    }
  }

  return source.length;
}
