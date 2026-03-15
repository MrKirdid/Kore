/**
 * LuauAST — Lightweight regex/pattern-based AST walking utilities for Luau files.
 * Used as first-pass structural scan before deeper analysis.
 */

export interface LuauTableField {
  key: string;
  value: string;
  line: number;
}

export interface LuauFunction {
  name: string;
  params: string[];
  body: string;
  line: number;
  hasReturn: boolean;
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
 * Extract all top-level functions from a table literal.
 */
export function extractFunctions(source: string): LuauFunction[] {
  const functions: LuauFunction[] = [];
  const pattern = /(\w+)\s*=\s*function\s*\(([^)]*)\)/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const name = match[1];
    const paramsStr = match[2];
    const params = paramsStr
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Check if this function has a return statement (simple heuristic)
    const bodyStart = match.index + match[0].length;
    const bodyEnd = findMatchingEnd(source, bodyStart);
    const body = source.substring(bodyStart, bodyEnd);
    const hasReturn = /\breturn\b/.test(body);

    const line = source.substring(0, match.index).split('\n').length;

    functions.push({ name, params, body, line, hasReturn });
  }

  return functions;
}

/**
 * Extract the Client table content.
 */
export function extractClientTable(source: string): string | null {
  const match = source.match(/Client\s*=\s*\{/);
  if (!match || match.index === undefined) return null;

  const start = match.index + match[0].length;
  const end = findMatchingBrace(source, start - 1);
  if (end === -1) return null;

  return source.substring(start, end);
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
