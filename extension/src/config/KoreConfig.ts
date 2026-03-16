/**
 * KoreConfig — Reads project settings from Kore.toml.
 *
 * The Kore.toml file is REQUIRED for the extension to activate Kore features.
 * Without it, the extension only exposes the `kore.initProject` command.
 *
 * Falls back to VS Code settings for any values not specified in Kore.toml.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { logInfo, logWarn, logError, logDebug } from '../Logger';

// ─── Minimal TOML parser ─────────────────────────────────────────────────────

interface TomlSection {
  [key: string]: string | number | boolean;
}

interface TomlDocument {
  [section: string]: TomlSection;
}

function parseToml(content: string): TomlDocument {
  const result: TomlDocument = {};
  let currentSection = '_root';
  result[currentSection] = {};

  const lines = content.split('\n');
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum].trim();

    if (!line || line.startsWith('#')) continue;

    const sectionMatch = line.match(/^\[([a-zA-Z_][\w.-]*)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!result[currentSection]) result[currentSection] = {};
      continue;
    }

    const kvMatch = line.match(/^([a-zA-Z_][\w]*)\s*=\s*(.+)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    let raw = kvMatch[2].trim();

    // Strip inline comments (only outside strings)
    if (!raw.startsWith('"') && !raw.startsWith("'")) {
      const commentIdx = raw.indexOf('#');
      if (commentIdx > 0) raw = raw.substring(0, commentIdx).trim();
    } else {
      // For quoted strings, find the closing quote first, then check for comments
      const quote = raw[0];
      const closeIdx = raw.indexOf(quote, 1);
      if (closeIdx > 0) {
        const afterQuote = raw.substring(closeIdx + 1).trim();
        if (afterQuote.startsWith('#') || afterQuote === '') {
          raw = raw.substring(0, closeIdx + 1);
        }
      }
    }

    let value: string | number | boolean;

    if ((raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))) {
      value = raw.slice(1, -1);
    } else if (raw === 'true') {
      value = true;
    } else if (raw === 'false') {
      value = false;
    } else if (!isNaN(Number(raw)) && raw !== '') {
      value = Number(raw);
    } else {
      value = raw;
    }

    result[currentSection][key] = value;
  }

  return result;
}

// ─── Config interface ────────────────────────────────────────────────────────

export interface KoreProjectConfig {
  paths: {
    services: string;
    controllers: string;
    types: string;
    shared: string;
  };
  require: {
    kore: string;
    types: string;
  };
  options: {
    autoTemplate: boolean;
    diagnostics: boolean;
    snippets: boolean;
    generateTypes: boolean;
    prefix: string;
    debug: boolean;
  };
}

const DEFAULTS: KoreProjectConfig = {
  paths: {
    services: 'src/server/services',
    controllers: 'src/client/controllers',
    types: 'src/shared/Kore/Types.luau',
    shared: 'src/shared',
  },
  require: {
    kore: 'game.ReplicatedStorage.Shared.Packages.kore',
    types: '',
  },
  options: {
    autoTemplate: true,
    diagnostics: true,
    snippets: true,
    generateTypes: true,
    prefix: '!',
    debug: false,
  },
};

// ─── Kore.toml reader ────────────────────────────────────────────────────────

interface PathResolverLike {
  resolveSegments(fsPath: string): string[];
}

let cachedConfig: KoreProjectConfig | null = null;
let tomlWatcher: vscode.FileSystemWatcher | null = null;
let configListeners: Array<(config: KoreProjectConfig) => void> = [];
let pathResolverRef: PathResolverLike | null = null;

export function setPathResolver(resolver: PathResolverLike): void {
  pathResolverRef = resolver;
}

function tomlPath(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  return path.join(folders[0].uri.fsPath, 'Kore.toml');
}

export function koreTomlExists(): boolean {
  const p = tomlPath();
  return p !== null && fs.existsSync(p);
}

function readTomlConfig(): KoreProjectConfig | null {
  const p = tomlPath();
  if (!p || !fs.existsSync(p)) return null;

  try {
    const raw = fs.readFileSync(p, 'utf-8');
    const doc = parseToml(raw);

    const pathsSection = doc['paths'] ?? {};
    const requireSection = doc['require'] ?? {};
    const optionsSection = doc['options'] ?? {};

    // Resolve option keys that may have been placed under the wrong section.
    // Checks [options] first, then falls back to other sections with a warning.
    const OPTION_KEYS = new Set(['autoTemplate', 'diagnostics', 'snippets', 'generateTypes', 'prefix', 'debug']);
    function resolveOption(key: string): string | number | boolean | undefined {
      if (optionsSection[key] !== undefined) return optionsSection[key];
      for (const [sectionName, section] of Object.entries(doc)) {
        if (sectionName === 'options') continue;
        if (section[key] !== undefined && OPTION_KEYS.has(key)) {
          const label = sectionName === '_root' ? 'root level' : `[${sectionName}]`;
          logWarn(`Kore.toml: '${key}' found at ${label} — move it to [options]`);
          return section[key];
        }
      }
      return undefined;
    }

    const resolved = {
      autoTemplate: resolveOption('autoTemplate'),
      diagnostics: resolveOption('diagnostics'),
      snippets: resolveOption('snippets'),
      generateTypes: resolveOption('generateTypes'),
      prefix: resolveOption('prefix'),
      debug: resolveOption('debug'),
    };

    return {
      paths: {
        services: String(pathsSection['services'] ?? DEFAULTS.paths.services),
        controllers: String(pathsSection['controllers'] ?? DEFAULTS.paths.controllers),
        types: String(pathsSection['types'] ?? DEFAULTS.paths.types),
        shared: String(pathsSection['shared'] ?? DEFAULTS.paths.shared),
      },
      require: {
        kore: String(requireSection['kore'] ?? DEFAULTS.require.kore),
        types: String(requireSection['types'] ?? DEFAULTS.require.types),
      },
      options: {
        autoTemplate: resolved.autoTemplate !== undefined
          ? Boolean(resolved.autoTemplate)
          : DEFAULTS.options.autoTemplate,
        diagnostics: resolved.diagnostics !== undefined
          ? Boolean(resolved.diagnostics)
          : DEFAULTS.options.diagnostics,
        snippets: resolved.snippets !== undefined
          ? Boolean(resolved.snippets)
          : DEFAULTS.options.snippets,
        generateTypes: resolved.generateTypes !== undefined
          ? Boolean(resolved.generateTypes)
          : DEFAULTS.options.generateTypes,
        prefix: resolved.prefix !== undefined
          ? String(resolved.prefix)
          : DEFAULTS.options.prefix,
        debug: resolved.debug !== undefined
          ? Boolean(resolved.debug)
          : DEFAULTS.options.debug,
      },
    };
  } catch (err) {
    logError('Failed to parse Kore.toml', err);
    return null;
  }
}

/**
 * Get the current project config. Reads from Kore.toml (cached), with fallback to
 * VS Code settings for anything missing.
 */
export function getConfig(): KoreProjectConfig {
  if (cachedConfig) return cachedConfig;

  const tomlConfig = readTomlConfig();
  if (tomlConfig) {
    cachedConfig = tomlConfig;
    return tomlConfig;
  }

  // Fallback: build from VS Code settings
  const vs = vscode.workspace.getConfiguration('kore');
  cachedConfig = {
    paths: {
      services: vs.get<string>('servicesPath', DEFAULTS.paths.services),
      controllers: vs.get<string>('controllersPath', DEFAULTS.paths.controllers),
      types: vs.get<string>('typesOutputPath', DEFAULTS.paths.types),
      shared: vs.get<string>('sharedPath', DEFAULTS.paths.shared),
    },
    require: {
      kore: vs.get<string>('koreRequirePath', DEFAULTS.require.kore),
      types: vs.get<string>('typesRequirePath', DEFAULTS.require.types),
    },
    options: {
      autoTemplate: vs.get<boolean>('autoTemplate', DEFAULTS.options.autoTemplate),
      diagnostics: vs.get<boolean>('enableDiagnostics', DEFAULTS.options.diagnostics),
      snippets: vs.get<boolean>('enableSnippets', DEFAULTS.options.snippets),
      generateTypes: vs.get<boolean>('generateTypes', DEFAULTS.options.generateTypes),
      prefix: vs.get<string>('triggerPrefix', DEFAULTS.options.prefix),
      debug: vs.get<boolean>('debug', DEFAULTS.options.debug),
    },
  };
  return cachedConfig;
}

/**
 * Get the Types require expression.
 *
 * Priority:
 *   1. Explicit `require.types` from Kore.toml / VS Code settings
 *   2. Resolved from `paths.types` via Rojo project tree (PathResolver)
 *   3. Derived from `require.kore`:
 *      - Instance path: `game.X.Y.kore` → `game.X.Y.kore.Types`
 *      - Quoted alias: `"@Packages/kore"` → `"@Packages/kore/Types"`
 *      - Unquoted alias: `@Packages/kore` → `"@Packages/kore/Types"`
 */
export function getTypesRequirePath(): string {
  const cfg = getConfig();

  // 1. Explicit types require path
  if (cfg.require.types) {
    return cfg.require.types;
  }

  // 2. Resolve from paths.types via Rojo project tree
  if (pathResolverRef) {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      const absTypesPath = path.join(folders[0].uri.fsPath, cfg.paths.types);
      const segments = pathResolverRef.resolveSegments(absTypesPath);
      if (segments.length > 0) {
        return `game.${segments.join('.')}`;
      }
    }
  }

  // 3. Fall back: derive from kore path
  const korePath = cfg.require.kore;

  if (korePath.startsWith('"') || korePath.startsWith("'")) {
    // Quoted string-style: "@Packages/kore" → "@Packages/kore/Types"
    const quote = korePath[0];
    const inner = korePath.slice(1, -1);
    return `${quote}${inner}/Types${quote}`;
  }

  if (korePath.startsWith('@') || korePath.includes('/')) {
    // Unquoted alias: @Packages/kore → "@Packages/kore/Types"
    return `"${korePath}/Types"`;
  }

  // Instance-style: game.X.Y.kore → game.X.Y.kore.Types
  return `${korePath}.Types`;
}

export function invalidateCache(): void {
  cachedConfig = null;
}

export function onConfigChanged(listener: (config: KoreProjectConfig) => void): void {
  configListeners.push(listener);
}

export function startWatching(context: vscode.ExtensionContext): void {
  if (tomlWatcher) return;

  tomlWatcher = vscode.workspace.createFileSystemWatcher('**/Kore.toml');

  const handleChange = () => {
    invalidateCache();
    const config = getConfig();
    logInfo('Kore.toml changed — config reloaded');
    for (const listener of configListeners) {
      listener(config);
    }
  };

  context.subscriptions.push(tomlWatcher);
  context.subscriptions.push(tomlWatcher.onDidChange(handleChange));
  context.subscriptions.push(tomlWatcher.onDidCreate(handleChange));
  context.subscriptions.push(tomlWatcher.onDidDelete(() => {
    invalidateCache();
    logWarn('Kore.toml deleted — Kore features disabled');
  }));
}

// ─── Kore.toml scaffolding ───────────────────────────────────────────────────

const KORE_TOML_TEMPLATE = `\
# Kore.toml — Project configuration for the Kore framework extension
# https://github.com/mrkirdid/kore

[paths]
# Directory containing service modules (relative to workspace root)
services = "src/server/services"
# Directory containing controller modules
controllers = "src/client/controllers"
# Output path for the auto-generated Types.luau
types = "src/shared/Kore/Types.luau"
# Shared code directory (for module indexing)
shared = "src/shared"

[require]
# Luau require expression for the Kore module (inserted into generated code)
# Supports instance paths: game.ReplicatedStorage.Packages.kore
# Supports string aliases: "@Packages/kore"
kore = "game.ReplicatedStorage.Shared.Packages.kore"
# Types require expression (auto-derived from kore path if omitted)
# types = "game.ReplicatedStorage.Shared.Packages.kore.Types"

[options]
# Auto-populate new .luau files with service/controller boilerplate
autoTemplate = true
# Enable Kore diagnostics (name mismatches, unknown deps, etc.)
diagnostics = true
# Enable Kore snippets and prefix commands
snippets = true
# Auto-generate and update Types.luau on service/controller changes
generateTypes = true
# Prefix character for quick-insert commands
prefix = "!"
# Enable debug logging in the Kore output channel
# debug = false
`;

/**
 * Create a Kore.toml in the workspace root. Tries to detect the project layout
 * from Rojo project files to set sensible defaults.
 */
export async function createKoreToml(): Promise<boolean> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage('Kore: No workspace folder open.');
    return false;
  }

  const root = folders[0].uri.fsPath;
  const dest = path.join(root, 'Kore.toml');

  if (fs.existsSync(dest)) {
    vscode.window.showWarningMessage('Kore: Kore.toml already exists.');
    return false;
  }

  let template = KORE_TOML_TEMPLATE;

  // Try to detect project layout from Rojo project files
  const detected = detectProjectLayout(root);
  if (detected) {
    if (detected.servicesPath) {
      template = template.replace(
        'services = "src/server/services"',
        `services = "${detected.servicesPath}"`,
      );
    }
    if (detected.controllersPath) {
      template = template.replace(
        'controllers = "src/client/controllers"',
        `controllers = "${detected.controllersPath}"`,
      );
    }
    if (detected.korePath) {
      template = template.replace(
        'kore = "game.ReplicatedStorage.Shared.Packages.kore"',
        `kore = "${detected.korePath}"`,
      );
    }
  }

  fs.writeFileSync(dest, template, 'utf-8');
  logInfo(`Created Kore.toml at ${dest}`);

  const doc = await vscode.workspace.openTextDocument(dest);
  await vscode.window.showTextDocument(doc);
  return true;
}

interface DetectedLayout {
  servicesPath?: string;
  controllersPath?: string;
  korePath?: string;
}

function detectProjectLayout(root: string): DetectedLayout | null {
  // Look for dev.project.json first, then default.project.json
  for (const filename of ['dev.project.json', 'default.project.json']) {
    const projPath = path.join(root, filename);
    if (!fs.existsSync(projPath)) continue;

    try {
      const proj = JSON.parse(fs.readFileSync(projPath, 'utf-8'));
      return detectFromRojoTree(root, proj.tree ?? {});
    } catch {
      continue;
    }
  }

  // Fallback: check common directory structures
  const common: DetectedLayout = {};
  if (fs.existsSync(path.join(root, 'src/server/services'))) {
    common.servicesPath = 'src/server/services';
  } else if (fs.existsSync(path.join(root, 'src/ServerScriptService'))) {
    common.servicesPath = 'src/ServerScriptService';
  }
  if (fs.existsSync(path.join(root, 'src/client/controllers'))) {
    common.controllersPath = 'src/client/controllers';
  } else if (fs.existsSync(path.join(root, 'src/StarterPlayerScripts'))) {
    common.controllersPath = 'src/StarterPlayerScripts';
  }
  return Object.keys(common).length > 0 ? common : null;
}

function detectFromRojoTree(root: string, tree: Record<string, unknown>): DetectedLayout | null {
  const result: DetectedLayout = {};

  // Walk the Rojo tree looking for $path entries
  function walk(node: Record<string, unknown>, instancePath: string[]): void {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      if (typeof value !== 'object' || value === null) continue;

      const child = value as Record<string, unknown>;
      const childPath = [...instancePath, key];
      const fsPath = child['$path'] as string | undefined;

      if (fsPath) {
        const fullFsPath = path.join(root, fsPath);
        // Check if this directory contains service/controller files
        if (fs.existsSync(fullFsPath) && fs.statSync(fullFsPath).isDirectory()) {
          const normPath = fsPath.replace(/\\/g, '/');
          if (/servi/i.test(key) || /servi/i.test(fsPath)) {
            result.servicesPath = normPath;
          }
          if (/control/i.test(key) || /control/i.test(fsPath)) {
            result.controllersPath = normPath;
          }
        }

        // Detect Kore package location
        if (/^kore$/i.test(key)) {
          const gamePath = 'game.' + childPath.join('.');
          result.korePath = gamePath;
        }
      }

      walk(child, childPath);
    }
  }

  walk(tree, []);
  return Object.keys(result).length > 0 ? result : null;
}
