/**
 * CompletionProvider — Kore autocomplete.
 *
 * Prefix commands (triggered by '!' at line start):
 *   !getservice    → pick a service, inserts: local X = Kore.GetService("X")
 *   !getcontroller → pick a controller, inserts: local X = Kore.GetController("X")
 *   !service       → service preset (CreateService + Client + Init/Start)
 *   !controller    → controller preset (CreateController + Init/Start)
 *   !preset        → auto-detect service/controller based on folder location
 *   !require       → module require path
 *   !kore          → insert Kore require
 *
 * Inline completions (triggered by '.', '"', "'"):
 *   Kore.            → top-level API completions
 *   Kore.Timer.      → sub-module completions (Timer, Log, Data, etc.)
 *   Kore.Util.Table. → deep sub-module completions
 *   GetService("     → service name picker
 *   GetController("  → controller name picker
 *   ServiceVar.      → member completions on service/controller variables
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { serviceRegistry, ServiceInfo } from '../registry/ServiceRegistry';
import { controllerRegistry, ControllerInfo } from '../registry/ControllerRegistry';
import { ModuleIndexer } from '../require/ModuleIndexer';
import { FuzzyMatcher } from '../fuzzy/FuzzyMatcher';
import { getConfig, getTypesRequirePath } from '../config/KoreConfig';
import { logDebug } from '../Logger';

// ─── helpers ─────────────────────────────────────────────────────────────────

interface KoreVarBinding {
  varName: string;
  kind: 'service' | 'controller';
  targetName: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Kore API catalogue ──────────────────────────────────────────────────────

interface KoreApiEntry {
  label: string;
  detail: string;
  documentation: string;
  insertText: string;
  kind: vscode.CompletionItemKind;
}

const KORE_APIS: KoreApiEntry[] = [
  { label: 'CreateService', detail: '<T>(table: T & {Name}) → T & ServiceFields', documentation: 'Create and register a service with injected Janitor/Log. Preferred method for full IntelliSense.', insertText: 'CreateService({\n\tName = "$1",\n})', kind: vscode.CompletionItemKind.Method },
  { label: 'CreateController', detail: '<T>(table: T & {Name}) → T & ControllerFields', documentation: 'Create and register a controller with injected Janitor/Log (client only). Preferred method for full IntelliSense.', insertText: 'CreateController({\n\tName = "$1",\n})', kind: vscode.CompletionItemKind.Method },
  { label: 'GetService', detail: '(name: string) → Service', documentation: 'Retrieve a registered service by name. Server returns real instance, client returns network proxy.', insertText: 'GetService("$1")', kind: vscode.CompletionItemKind.Method },
  { label: 'GetController', detail: '(name: string) → Controller', documentation: 'Retrieve a registered controller by name (client only).', insertText: 'GetController("$1")', kind: vscode.CompletionItemKind.Method },
  { label: 'Configure', detail: '(config: KoreConfig) → ()', documentation: 'Configure Kore settings before Start(). Options: Debug, Destroy ("shutdown"|"dynamic"), Log.', insertText: 'Configure({\n\t$1\n})', kind: vscode.CompletionItemKind.Method },
  { label: 'Start', detail: '() → Promise', documentation: 'Boot Kore framework. Returns Promise that resolves when all Init/Start phases complete.', insertText: 'Start()', kind: vscode.CompletionItemKind.Method },
  { label: 'AddService', detail: '(serviceTable) → ()', documentation: 'Manually register a pre-made service. Legacy — prefer CreateService.', insertText: 'AddService($1)', kind: vscode.CompletionItemKind.Method },
  { label: 'AddController', detail: '(controllerTable) → ()', documentation: 'Manually register a pre-made controller. Legacy — prefer CreateController.', insertText: 'AddController($1)', kind: vscode.CompletionItemKind.Method },
  { label: 'DestroyService', detail: '(name: string) → ()', documentation: 'Dynamically destroy a service. Requires Destroy = "dynamic" config.', insertText: 'DestroyService("$1")', kind: vscode.CompletionItemKind.Method },
  { label: 'DestroyController', detail: '(name: string) → ()', documentation: 'Dynamically destroy a controller. Requires Destroy = "dynamic" config.', insertText: 'DestroyController("$1")', kind: vscode.CompletionItemKind.Method },
  { label: 'NetEvent', detail: 'Symbol', documentation: 'Sentinel value for declaring server→client event remotes in Client tables.', insertText: 'NetEvent', kind: vscode.CompletionItemKind.Constant },
  { label: 'Signal', detail: 'SignalModule', documentation: 'Lightweight signal library. Call .new(config?) to create.', insertText: 'Signal', kind: vscode.CompletionItemKind.Module },
  { label: 'Promise', detail: 'PromiseLib', documentation: 'Re-export of evaera/promise.', insertText: 'Promise', kind: vscode.CompletionItemKind.Module },
  { label: 'Log', detail: 'LogModule', documentation: 'Structured tagged logger with levels: Debug, Info, Warn, Error.', insertText: 'Log', kind: vscode.CompletionItemKind.Module },
  { label: 'Timer', detail: 'TimerModule', documentation: 'Debounce, Throttle, Delay, Every, Heartbeat/Stepped/RenderStepped wrappers.', insertText: 'Timer', kind: vscode.CompletionItemKind.Module },
  { label: 'Tween', detail: 'TweenModule', documentation: 'Builder-pattern tween. Chain :Property(), :Duration(), :Easing(), :Play() → Promise.', insertText: 'Tween', kind: vscode.CompletionItemKind.Module },
  { label: 'Curve', detail: 'CurveModule', documentation: 'Keyframe curve sampler with linear and Catmull-Rom interpolation.', insertText: 'Curve', kind: vscode.CompletionItemKind.Module },
  { label: 'Data', detail: 'DataModule', documentation: 'ProfileStore bridge (server only). Configure, Load, Get, Save, Release.', insertText: 'Data', kind: vscode.CompletionItemKind.Module },
  { label: 'Thread', detail: 'ThreadModule', documentation: 'Weave wrapper for parallel Luau. Pool(count, script), Kernel(actor).', insertText: 'Thread', kind: vscode.CompletionItemKind.Module },
  { label: 'Mock', detail: 'MockModule', documentation: 'Test isolation. Mock.Service(def), Mock.Controller(def) — no Kore.Start() needed.', insertText: 'Mock', kind: vscode.CompletionItemKind.Module },
  { label: 'Janitor', detail: 'JanitorModule', documentation: 'Cleanup management. Auto-injected into every service/controller.', insertText: 'Janitor', kind: vscode.CompletionItemKind.Module },
  { label: 'Fusion', detail: 'FusionLib', documentation: 'Re-export of elttob/fusion.', insertText: 'Fusion', kind: vscode.CompletionItemKind.Module },
  { label: 'Util', detail: '{ Table, String, Math }', documentation: 'Utility sub-modules for table, string, and math operations.', insertText: 'Util', kind: vscode.CompletionItemKind.Module },
  { label: 'Net', detail: 'NetModule', documentation: 'Remote networking layer. Middleware, RateLimit, Compression, Batcher.', insertText: 'Net', kind: vscode.CompletionItemKind.Module },
  { label: 'Symbol', detail: '(name) → Symbol', documentation: 'Create/retrieve a unique interned sentinel value.', insertText: 'Symbol("$1")', kind: vscode.CompletionItemKind.Function },
  { label: 'Types', detail: 'TypesModule', documentation: 'Auto-generated type definitions.', insertText: 'Types', kind: vscode.CompletionItemKind.Module },
];

// ─── Sub-module API catalogues ───────────────────────────────────────────────

const KORE_SUBMODULE_APIS: Record<string, KoreApiEntry[]> = {
  Signal: [
    { label: 'new', detail: '(config?) → Signal', documentation: 'Create a new signal.\n\nOptional config:\n```lua\n{ Network = true, Owner = "Server"|"Client"|"Both", RateLimit = { MaxCalls, PerSeconds } }\n```', insertText: 'new(${1})', kind: vscode.CompletionItemKind.Method },
  ],
  Timer: [
    { label: 'Debounce', detail: '(fn, seconds) → (...) → ()', documentation: 'Create a debounced wrapper. Waits `seconds` after the last call before firing.', insertText: 'Debounce(${1:fn}, ${2:1})', kind: vscode.CompletionItemKind.Function },
    { label: 'Throttle', detail: '(fn, seconds) → (...) → ()', documentation: 'Create a throttled wrapper. Fires at most once per `seconds`.', insertText: 'Throttle(${1:fn}, ${2:1})', kind: vscode.CompletionItemKind.Function },
    { label: 'Delay', detail: '(seconds, fn) → CancelFn', documentation: 'Fire `fn` once after `seconds` delay. Returns a cancel function.', insertText: 'Delay(${1:1}, ${2:fn})', kind: vscode.CompletionItemKind.Function },
    { label: 'Every', detail: '(seconds, fn) → CancelFn', documentation: 'Fire `fn` repeatedly every `seconds`. Returns a cancel function.', insertText: 'Every(${1:1}, ${2:fn})', kind: vscode.CompletionItemKind.Function },
    { label: 'Heartbeat', detail: '(fn: (dt) → ()) → RBXScriptConnection', documentation: 'Connect to RunService.Heartbeat.', insertText: 'Heartbeat(${1:fn})', kind: vscode.CompletionItemKind.Function },
    { label: 'Stepped', detail: '(fn: (time, dt) → ()) → RBXScriptConnection', documentation: 'Connect to RunService.Stepped.', insertText: 'Stepped(${1:fn})', kind: vscode.CompletionItemKind.Function },
    { label: 'RenderStepped', detail: '(fn: (dt) → ()) → RBXScriptConnection?', documentation: 'Connect to RunService.RenderStepped (client only).', insertText: 'RenderStepped(${1:fn})', kind: vscode.CompletionItemKind.Function },
  ],
  Tween: [
    { label: 'new', detail: '(instance: Instance) → TweenBuilder', documentation: 'Create a builder-pattern tween.\n\nChain `:Property()`, `:Duration()`, `:Easing()`, `:Play()` → Promise.', insertText: 'new(${1:instance})', kind: vscode.CompletionItemKind.Method },
  ],
  Curve: [
    { label: 'new', detail: '(keyframes: {{t, v}}) → CurveInstance', documentation: 'Create a keyframe curve.\n\nCall `:Sample(t)` for linear or `:SampleSmooth(t)` for Catmull-Rom.', insertText: 'new({\n\t{ t = ${1:0}, v = ${2:0} },\n\t{ t = ${3:1}, v = ${4:1} },\n})', kind: vscode.CompletionItemKind.Method },
  ],
  Log: [
    { label: 'Tagged', detail: '(tag: string) → TaggedLogger', documentation: 'Create a tagged logger. Returns `{ Debug, Info, Warn, Error }` auto-tagged.', insertText: 'Tagged("${1}")', kind: vscode.CompletionItemKind.Function },
    { label: 'Debug', detail: '(tag, message, ...) → ()', documentation: 'Log debug message (only if min level ≤ Debug).', insertText: 'Debug("${1:tag}", "${2:message}")', kind: vscode.CompletionItemKind.Function },
    { label: 'Info', detail: '(tag, message, ...) → ()', documentation: 'Log info message.', insertText: 'Info("${1:tag}", "${2:message}")', kind: vscode.CompletionItemKind.Function },
    { label: 'Warn', detail: '(tag, message, ...) → ()', documentation: 'Log warning message.', insertText: 'Warn("${1:tag}", "${2:message}")', kind: vscode.CompletionItemKind.Function },
    { label: 'Error', detail: '(tag, message, ...) → ()', documentation: 'Log error message and throw.', insertText: 'Error("${1:tag}", "${2:message}")', kind: vscode.CompletionItemKind.Function },
    { label: 'ErrorNoThrow', detail: '(tag, message, ...) → ()', documentation: 'Log error without throwing.', insertText: 'ErrorNoThrow("${1:tag}", "${2:message}")', kind: vscode.CompletionItemKind.Function },
    { label: 'SetMinLevel', detail: '(level: LogLevel) → ()', documentation: 'Set minimum log level. Levels: "Debug", "Info", "Warn", "Error".', insertText: 'SetMinLevel("${1|Debug,Info,Warn,Error|}")', kind: vscode.CompletionItemKind.Function },
    { label: 'EnableDebug', detail: '() → ()', documentation: 'Enable debug logging.', insertText: 'EnableDebug()', kind: vscode.CompletionItemKind.Function },
  ],
  Data: [
    { label: 'Configure', detail: '(config: DataConfig) → ()', documentation: 'Configure DataStore name and default template.', insertText: 'Configure({\n\tStoreName = "${1:PlayerData}",\n\tTemplate = {\n\t\t${2}\n\t},\n})', kind: vscode.CompletionItemKind.Function },
    { label: 'Load', detail: '(player: Player) → Promise<Profile>', documentation: 'Load or create a player profile. Returns Promise.', insertText: 'Load(${1:player})', kind: vscode.CompletionItemKind.Function },
    { label: 'Get', detail: '(player: Player) → Profile?', documentation: 'Get loaded profile, or nil if not yet loaded.', insertText: 'Get(${1:player})', kind: vscode.CompletionItemKind.Function },
    { label: 'OnLoaded', detail: '(player, fn) → ()', documentation: 'Callback when player profile finishes loading.', insertText: 'OnLoaded(${1:player}, function(profile)\n\t${2}\nend)', kind: vscode.CompletionItemKind.Function },
    { label: 'Save', detail: '(player: Player) → Promise', documentation: 'Force-save player profile.', insertText: 'Save(${1:player})', kind: vscode.CompletionItemKind.Function },
    { label: 'Release', detail: '(player: Player) → ()', documentation: 'Release profile session and clean up.', insertText: 'Release(${1:player})', kind: vscode.CompletionItemKind.Function },
  ],
  Thread: [
    { label: 'Pool', detail: '(count, workerScript) → ThreadPool', documentation: 'Create a parallel worker pool with `count` actors.\n\nCall `:Dispatch(task, count)` → Promise or `:DispatchDetached(task, count)`.', insertText: 'Pool(${1:16}, ${2:workerScript})', kind: vscode.CompletionItemKind.Function },
    { label: 'Kernel', detail: '(actor: Actor) → ThreadKernel', documentation: 'Register task handlers on a worker Actor.\n\nChain `:On("task", handler)` then `:Ready()`.', insertText: 'Kernel(${1:actor})', kind: vscode.CompletionItemKind.Function },
  ],
  Mock: [
    { label: 'Service', detail: '(definition) → MockHandle', documentation: 'Create a mock service for testing without Kore.Start().', insertText: 'Service(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'Controller', detail: '(definition) → MockHandle', documentation: 'Create a mock controller for testing.', insertText: 'Controller(${1})', kind: vscode.CompletionItemKind.Function },
  ],
  Janitor: [
    { label: 'new', detail: '() → Janitor', documentation: 'Create a new Janitor for tracking cleanup tasks.\n\nUse `:Add(task, method?)`, `:Cleanup()`, `:Destroy()`.', insertText: 'new()', kind: vscode.CompletionItemKind.Method },
  ],
  Util: [
    { label: 'Table', detail: 'TableUtils', documentation: 'Table utilities: deepCopy, merge, filter, map, find, flatten, etc.', insertText: 'Table', kind: vscode.CompletionItemKind.Module },
    { label: 'String', detail: 'StringUtils', documentation: 'String utilities: trim, split, capitalize, camelize, slugify, etc.', insertText: 'String', kind: vscode.CompletionItemKind.Module },
    { label: 'Math', detail: 'MathUtils', documentation: 'Math utilities: lerp, clamp, round, snap, bezier, damp, etc.', insertText: 'Math', kind: vscode.CompletionItemKind.Module },
  ],
  Net: [
    { label: 'SetCompression', detail: '(config) → ()', documentation: 'Set compression strategy: "None", "Auto", "Aggressive", or custom config.', insertText: 'SetCompression("${1|None,Auto,Aggressive|}")', kind: vscode.CompletionItemKind.Function },
  ],
  'Util.Table': [
    { label: 'deepCopy', detail: '(t: T) → T', documentation: 'Deep copy a table recursively.', insertText: 'deepCopy(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'shallowCopy', detail: '(t: T) → T', documentation: 'Shallow copy a table (one level).', insertText: 'shallowCopy(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'merge', detail: '(...tables) → table', documentation: 'Merge multiple tables. Later keys overwrite.', insertText: 'merge(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'keys', detail: '(t) → {K}', documentation: 'Get all keys of a table.', insertText: 'keys(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'values', detail: '(t) → {V}', documentation: 'Get all values of a table.', insertText: 'values(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'filter', detail: '(t, predicate) → {[K]: V}', documentation: 'Filter table entries by predicate.', insertText: 'filter(${1}, function(${2:value, key})\n\treturn ${3}\nend)', kind: vscode.CompletionItemKind.Function },
    { label: 'map', detail: '(t, transform) → {[K]: R}', documentation: 'Transform table values.', insertText: 'map(${1}, function(${2:value, key})\n\treturn ${3}\nend)', kind: vscode.CompletionItemKind.Function },
    { label: 'find', detail: '(t, predicate) → (V?, K?)', documentation: 'Find first matching entry.', insertText: 'find(${1}, function(${2:value, key})\n\treturn ${3}\nend)', kind: vscode.CompletionItemKind.Function },
    { label: 'flatten', detail: '(t, depth?) → {T}', documentation: 'Flatten nested arrays.', insertText: 'flatten(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'shuffle', detail: '(t) → {T}', documentation: 'Randomly shuffle array (Fisher-Yates).', insertText: 'shuffle(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'count', detail: '(t) → number', documentation: 'Count entries (including non-integer keys).', insertText: 'count(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'freeze', detail: '(t) → T', documentation: 'Deep freeze a table (immutable).', insertText: 'freeze(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'diff', detail: '(a, b) → {added, removed, changed}', documentation: 'Compute differences between two tables.', insertText: 'diff(${1}, ${2})', kind: vscode.CompletionItemKind.Function },
  ],
  'Util.String': [
    { label: 'trim', detail: '(s) → string', documentation: 'Trim whitespace from both ends.', insertText: 'trim(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'split', detail: '(s, sep) → {string}', documentation: 'Split string by separator.', insertText: 'split(${1}, "${2}")', kind: vscode.CompletionItemKind.Function },
    { label: 'startsWith', detail: '(s, prefix) → boolean', documentation: 'Check if string starts with prefix.', insertText: 'startsWith(${1}, "${2}")', kind: vscode.CompletionItemKind.Function },
    { label: 'endsWith', detail: '(s, suffix) → boolean', documentation: 'Check if string ends with suffix.', insertText: 'endsWith(${1}, "${2}")', kind: vscode.CompletionItemKind.Function },
    { label: 'capitalize', detail: '(s) → string', documentation: 'Capitalize first letter.', insertText: 'capitalize(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'truncate', detail: '(s, maxLen, suffix?) → string', documentation: 'Truncate with optional suffix.', insertText: 'truncate(${1}, ${2:50})', kind: vscode.CompletionItemKind.Function },
    { label: 'padStart', detail: '(s, len, char?) → string', documentation: 'Pad start to target length.', insertText: 'padStart(${1}, ${2:10})', kind: vscode.CompletionItemKind.Function },
    { label: 'padEnd', detail: '(s, len, char?) → string', documentation: 'Pad end to target length.', insertText: 'padEnd(${1}, ${2:10})', kind: vscode.CompletionItemKind.Function },
    { label: 'camelize', detail: '(s) → string', documentation: '"my-var" → "myVar"', insertText: 'camelize(${1})', kind: vscode.CompletionItemKind.Function },
    { label: 'slugify', detail: '(s) → string', documentation: '"My String" → "my-string"', insertText: 'slugify(${1})', kind: vscode.CompletionItemKind.Function },
  ],
  'Util.Math': [
    { label: 'lerp', detail: '(a, b, t) → number', documentation: 'Linear interpolation.', insertText: 'lerp(${1:a}, ${2:b}, ${3:t})', kind: vscode.CompletionItemKind.Function },
    { label: 'clamp', detail: '(value, min, max) → number', documentation: 'Clamp value between min and max.', insertText: 'clamp(${1:value}, ${2:min}, ${3:max})', kind: vscode.CompletionItemKind.Function },
    { label: 'round', detail: '(value, decimals?) → number', documentation: 'Round to decimal places.', insertText: 'round(${1:value}, ${2:0})', kind: vscode.CompletionItemKind.Function },
    { label: 'map', detail: '(value, inMin, inMax, outMin, outMax) → number', documentation: 'Map value from one range to another.', insertText: 'map(${1:value}, ${2:0}, ${3:1}, ${4:0}, ${5:100})', kind: vscode.CompletionItemKind.Function },
    { label: 'snap', detail: '(value, step) → number', documentation: 'Snap to nearest step.', insertText: 'snap(${1:value}, ${2:step})', kind: vscode.CompletionItemKind.Function },
    { label: 'sign', detail: '(value) → number', documentation: 'Sign: 1, -1, or 0.', insertText: 'sign(${1:value})', kind: vscode.CompletionItemKind.Function },
    { label: 'randomRange', detail: '(min, max) → number', documentation: 'Random float in range.', insertText: 'randomRange(${1:min}, ${2:max})', kind: vscode.CompletionItemKind.Function },
    { label: 'approach', detail: '(current, target, step) → number', documentation: 'Move current toward target by step.', insertText: 'approach(${1:current}, ${2:target}, ${3:step})', kind: vscode.CompletionItemKind.Function },
    { label: 'damp', detail: '(a, b, smoothing, dt) → number', documentation: 'Frame-rate independent exponential smoothing.', insertText: 'damp(${1:a}, ${2:b}, ${3:smoothing}, ${4:dt})', kind: vscode.CompletionItemKind.Function },
    { label: 'bezier', detail: '(t, p0, p1, p2, p3) → number', documentation: 'Cubic Bézier evaluation.', insertText: 'bezier(${1:t}, ${2:p0}, ${3:p1}, ${4:p2}, ${5:p3})', kind: vscode.CompletionItemKind.Function },
  ],
};

const KORE_SUBMODULE_NAMES = new Set(Object.keys(KORE_SUBMODULE_APIS).filter(k => !k.includes('.')));

// ─── provider ────────────────────────────────────────────────────────────────

/** Check whether luau-lsp extension is active — re-checks each time since extensions can activate later. */
function isLuauLspActive(): boolean {
  const ext = vscode.extensions.getExtension('JohnnyMorganz.luau-lsp');
  return ext !== undefined && ext.isActive;
}

export class CompletionProvider implements vscode.CompletionItemProvider {
  constructor(private moduleIndexer: ModuleIndexer) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ): vscode.CompletionItem[] | vscode.CompletionList | undefined {
    const lineText = document.lineAt(position).text;
    const textBefore = lineText.substring(0, position.character);

    // ── Path 1: Prefix commands (always — LSP can't do this) ──
    const prefixResult = this.tryPrefixCommands(document, position, textBefore);
    if (prefixResult) return prefixResult;

    // ── Path 2: Service/controller name strings (always — LSP can't pick names) ──
    const stringResult = this.tryServiceControllerString(position, textBefore);
    if (stringResult) return stringResult;

    // ── Paths 3–5: Type-based completions — skip when Luau LSP handles them ──
    if (!isLuauLspActive()) {
      // Path 3: Kore.SubModule. — sub-module dot-access
      const submoduleResult = this.trySubmoduleDotAccess(position, textBefore);
      if (submoduleResult) return submoduleResult;

      // Path 4: Kore. — top-level API dot-access
      const koreDotResult = this.tryKoreDotAccess(position, textBefore);
      if (koreDotResult) return koreDotResult;

      // Path 5: Variable.member completions
      const memberResult = this.tryMemberAccess(document, position, textBefore);
      if (memberResult) return memberResult;
    }

    return undefined;
  }

  // ===========================================================================
  // Path 1 — Prefix commands (!getservice, !service, !controller, etc.)
  // ===========================================================================

  private tryPrefixCommands(
    document: vscode.TextDocument,
    position: vscode.Position,
    textBefore: string,
  ): vscode.CompletionList | undefined {
    const cfg = getConfig();
    const prefix = cfg.options.prefix;

    const prefixRegex = new RegExp(`^(\\s*)${escapeRegex(prefix)}(\\S*)$`);
    const match = prefixRegex.exec(textBefore);
    if (!match) return undefined;

    const ws = match[1];
    const typed = match[2].toLowerCase();
    const fullRange = new vscode.Range(
      new vscode.Position(position.line, ws.length),
      position,
    );

    const items: vscode.CompletionItem[] = [];

    if (this.cmdMatch('getservice', typed)) {
      this.addGetServiceItems(items, document, fullRange, prefix, typed);
    }

    if (this.cmdMatch('getcontroller', typed)) {
      this.addGetControllerItems(items, document, fullRange, prefix, typed);
    }

    // !service — dedicated service preset (don't trigger on "getservice")
    if (cfg.options.snippets && this.cmdMatch('service', typed) && !typed.startsWith('gets')) {
      this.addServicePreset(items, document, fullRange, prefix);
    }

    // !controller — dedicated controller preset (don't trigger on "getcontroller")
    if (cfg.options.snippets && this.cmdMatch('controller', typed) && !typed.startsWith('getc')) {
      this.addControllerPreset(items, document, fullRange, prefix);
    }

    // !preset — auto-detect based on folder
    if (cfg.options.snippets && this.cmdMatch('preset', typed)) {
      this.addAutoPreset(items, document, fullRange, prefix);
    }

    if (this.cmdMatch('kore', typed) && !typed.startsWith('gets') && !typed.startsWith('getc')) {
      this.addKoreRequireItem(items, document, fullRange, prefix);
    }

    if (this.cmdMatch('require', typed) && !typed.startsWith('gets') && !typed.startsWith('getc')) {
      this.addRequireItems(items, document, position, fullRange, prefix, typed);
    }

    if (items.length === 0) return undefined;
    return new vscode.CompletionList(items, false);
  }

  private cmdMatch(command: string, typed: string): boolean {
    if (!typed) return true;
    return command.startsWith(typed) || typed.startsWith(command);
  }

  private addGetServiceItems(
    items: vscode.CompletionItem[],
    document: vscode.TextDocument,
    fullRange: vscode.Range,
    prefix: string,
    typed: string,
  ): void {
    const names = serviceRegistry.getAllNames();
    const isServer = this.classifyFile(document.uri.fsPath) === 'service';
    if (names.length > 0) {
      const filtered = typed.length > 'getservice'.length
        ? this.fuzzyMatch(names, typed.slice('getservice'.length).trim())
        : names;

      for (let i = 0; i < filtered.length; i++) {
        const name = filtered[i];
        const typeName = isServer ? name : `${name}Client`;
        const item = new vscode.CompletionItem(
          `${prefix}getservice → ${name}`,
          vscode.CompletionItemKind.Interface,
        );
        item.insertText = `local ${name} = Kore.GetService("${name}") :: Types.${typeName}`;
        item.range = fullRange;
        item.detail = 'Kore Service';
        item.sortText = `\x00a_${String(i).padStart(5, '0')}`;
        item.filterText = `${prefix}getservice ${name}`;
        if (i === 0) item.preselect = true;

        const info = serviceRegistry.get(name);
        if (info) item.documentation = this.buildServiceDoc(info);

        const edits = this.ensureRequires(document);
        if (edits.length > 0) item.additionalTextEdits = edits;
        items.push(item);
      }
    } else {
      const item = new vscode.CompletionItem(`${prefix}getservice`, vscode.CompletionItemKind.Interface);
      item.insertText = new vscode.SnippetString(`local \${1:Service} = Kore.GetService("\${1:Service}")`);
      item.range = fullRange;
      item.detail = 'Kore GetService (no services discovered)';
      item.filterText = `${prefix}getservice`;
      item.sortText = '\x00a';
      const edits = this.ensureRequires(document);
      if (edits.length > 0) item.additionalTextEdits = edits;
      items.push(item);
    }
  }

  private addGetControllerItems(
    items: vscode.CompletionItem[],
    document: vscode.TextDocument,
    fullRange: vscode.Range,
    prefix: string,
    typed: string,
  ): void {
    const names = controllerRegistry.getAllNames();
    if (names.length > 0) {
      const filtered = typed.length > 'getcontroller'.length
        ? this.fuzzyMatch(names, typed.slice('getcontroller'.length).trim())
        : names;

      for (let i = 0; i < filtered.length; i++) {
        const name = filtered[i];
        const item = new vscode.CompletionItem(
          `${prefix}getcontroller → ${name}`,
          vscode.CompletionItemKind.Class,
        );
        item.insertText = `local ${name} = Kore.GetController("${name}") :: Types.${name}`;
        item.range = fullRange;
        item.detail = 'Kore Controller';
        item.sortText = `\x00b_${String(i).padStart(5, '0')}`;
        item.filterText = `${prefix}getcontroller ${name}`;
        if (i === 0) item.preselect = true;

        const info = controllerRegistry.get(name);
        if (info) item.documentation = this.buildControllerDoc(info);

        const edits = this.ensureRequires(document);
        if (edits.length > 0) item.additionalTextEdits = edits;
        items.push(item);
      }
    } else {
      const item = new vscode.CompletionItem(`${prefix}getcontroller`, vscode.CompletionItemKind.Class);
      item.insertText = new vscode.SnippetString(`local \${1:Controller} = Kore.GetController("\${1:Controller}")`);
      item.range = fullRange;
      item.detail = 'Kore GetController (no controllers discovered)';
      item.filterText = `${prefix}getcontroller`;
      item.sortText = '\x00b';
      const edits = this.ensureRequires(document);
      if (edits.length > 0) item.additionalTextEdits = edits;
      items.push(item);
    }
  }

  private addServicePreset(
    items: vscode.CompletionItem[],
    document: vscode.TextDocument,
    fullRange: vscode.Range,
    prefix: string,
  ): void {
    const fileName = path.basename(document.uri.fsPath, '.luau');
    const item = new vscode.CompletionItem(`${prefix}service — Service preset`, vscode.CompletionItemKind.Snippet);
    item.insertText = new vscode.SnippetString(
      `local \${1:${fileName}} = Kore.CreateService({\n` +
      `\tName = "\${1:${fileName}}",\n` +
      `})\n\n` +
      `\${1:${fileName}}.Client = {\n` +
      `\t\${2:-- Remote methods and Kore.NetEvent declarations}\n` +
      `}\n\n` +
      `function \${1:${fileName}}:Init(ctx)\n` +
      `\t\${3:-- Sync init (no yielding)}\n` +
      `end\n\n` +
      `function \${1:${fileName}}:Start(ctx)\n` +
      `\t\${0:-- Async start (yielding OK)}\n` +
      `end\n\n` +
      `return \${1:${fileName}}`,
    );
    item.range = fullRange;
    item.detail = 'Full Kore service with Client table, Init, Start';
    item.filterText = `${prefix}service`;
    item.sortText = '\x00c_svc';
    item.documentation = new vscode.MarkdownString(
      'Creates a full service:\n' +
      '- `Kore.CreateService` with auto-injected Janitor/Log\n' +
      '- External Client table for remote methods & events\n' +
      '- Init(ctx) / Start(ctx) lifecycle with context\n\n' +
      'Kore + Types requires auto-inserted at top.',
    );
    const edits = this.ensureRequires(document);
    if (edits.length > 0) item.additionalTextEdits = edits;
    items.push(item);
  }

  private addControllerPreset(
    items: vscode.CompletionItem[],
    document: vscode.TextDocument,
    fullRange: vscode.Range,
    prefix: string,
  ): void {
    const fileName = path.basename(document.uri.fsPath, '.luau');
    const item = new vscode.CompletionItem(`${prefix}controller — Controller preset`, vscode.CompletionItemKind.Snippet);
    item.insertText = new vscode.SnippetString(
      `local \${1:${fileName}} = Kore.CreateController({\n` +
      `\tName = "\${1:${fileName}}",\n` +
      `})\n\n` +
      `function \${1:${fileName}}:Init(ctx)\n` +
      `\t\${2:-- Sync init (no yielding)}\n` +
      `end\n\n` +
      `function \${1:${fileName}}:Start(ctx)\n` +
      `\t\${0:-- Async start (yielding OK)}\n` +
      `end\n\n` +
      `return \${1:${fileName}}`,
    );
    item.range = fullRange;
    item.detail = 'Kore controller with Init, Start';
    item.filterText = `${prefix}controller`;
    item.sortText = '\x00c_ctrl';
    item.documentation = new vscode.MarkdownString(
      'Creates a controller:\n' +
      '- `Kore.CreateController` with auto-injected Janitor/Log\n' +
      '- Init(ctx) / Start(ctx) lifecycle with context\n\n' +
      'Kore + Types requires auto-inserted at top.',
    );
    const edits = this.ensureRequires(document);
    if (edits.length > 0) item.additionalTextEdits = edits;
    items.push(item);
  }

  private addAutoPreset(
    items: vscode.CompletionItem[],
    document: vscode.TextDocument,
    fullRange: vscode.Range,
    prefix: string,
  ): void {
    const fileType = this.classifyFile(document.uri.fsPath);

    if (fileType === 'service') {
      this.addServicePreset(items, document, fullRange, prefix);
    } else if (fileType === 'controller') {
      this.addControllerPreset(items, document, fullRange, prefix);
    } else {
      // Unknown folder — show both
      const fileName = path.basename(document.uri.fsPath, '.luau');

      const svcItem = new vscode.CompletionItem(`${prefix}preset — Service`, vscode.CompletionItemKind.Snippet);
      svcItem.insertText = new vscode.SnippetString(
        `local \${1:${fileName}} = Kore.CreateService({\n` +
        `\tName = "\${1:${fileName}}",\n` +
        `})\n\n` +
        `\${1:${fileName}}.Client = {\n` +
        `\t\${2:-- Remote methods and Kore.NetEvent declarations}\n` +
        `}\n\n` +
        `function \${1:${fileName}}:Init(ctx)\n` +
        `\t\${3:-- Sync init (no yielding)}\n` +
        `end\n\n` +
        `function \${1:${fileName}}:Start(ctx)\n` +
        `\t\${0:-- Async start (yielding OK)}\n` +
        `end\n\n` +
        `return \${1:${fileName}}`,
      );
      svcItem.range = fullRange;
      svcItem.detail = 'Full Kore service boilerplate';
      svcItem.filterText = `${prefix}preset service`;
      svcItem.sortText = '\x00d_svc';
      const svcEdits = this.ensureRequires(document);
      if (svcEdits.length > 0) svcItem.additionalTextEdits = svcEdits;
      items.push(svcItem);

      const ctrlItem = new vscode.CompletionItem(`${prefix}preset — Controller`, vscode.CompletionItemKind.Snippet);
      ctrlItem.insertText = new vscode.SnippetString(
        `local \${1:${fileName}} = Kore.CreateController({\n` +
        `\tName = "\${1:${fileName}}",\n` +
        `})\n\n` +
        `function \${1:${fileName}}:Init(ctx)\n` +
        `\t\${2:-- Sync init (no yielding)}\n` +
        `end\n\n` +
        `function \${1:${fileName}}:Start(ctx)\n` +
        `\t\${0:-- Async start (yielding OK)}\n` +
        `end\n\n` +
        `return \${1:${fileName}}`,
      );
      ctrlItem.range = fullRange;
      ctrlItem.detail = 'Kore controller boilerplate';
      ctrlItem.filterText = `${prefix}preset controller`;
      ctrlItem.sortText = '\x00d_ctrl';
      const ctrlEdits = this.ensureRequires(document);
      if (ctrlEdits.length > 0) ctrlItem.additionalTextEdits = ctrlEdits;
      items.push(ctrlItem);
    }
  }

  private addKoreRequireItem(
    items: vscode.CompletionItem[],
    document: vscode.TextDocument,
    fullRange: vscode.Range,
    prefix: string,
  ): void {
    const hasKore = this.documentHasKoreRequire(document);
    const item = new vscode.CompletionItem(
      hasKore ? `${prefix}kore (already required)` : `${prefix}kore — require`,
      vscode.CompletionItemKind.Module,
    );
    item.insertText = '';
    item.range = fullRange;
    item.filterText = `${prefix}kore`;
    item.sortText = '\x00z';

    if (hasKore) {
      item.detail = 'Kore is already required in this file';
    } else {
      item.detail = 'Insert Kore + Types requires at top';
      item.additionalTextEdits = this.ensureRequires(document);
    }
    items.push(item);
  }

  private addRequireItems(
    items: vscode.CompletionItem[],
    document: vscode.TextDocument,
    position: vscode.Position,
    fullRange: vscode.Range,
    prefix: string,
    typed: string,
  ): void {
    const modules = this.moduleIndexer.getModules();
    if (modules.length === 0) return;

    const query = typed.length > 'require'.length ? typed.slice('require'.length).trim() : '';
    const cfg = getConfig();
    const maxSuggestions = vscode.workspace.getConfiguration('kore').get<number>('requireCompletion.maxSuggestions', 25);
    const useDeepest = vscode.workspace.getConfiguration('kore').get<boolean>('requireCompletion.useDeepestVariable', true);
    const autoInsertGetService = vscode.workspace.getConfiguration('kore').get<boolean>('requireCompletion.autoInsertGetService', true);

    // Filter modules by query
    let matchedModules = modules;
    if (query) {
      const lowerQuery = query.toLowerCase();
      matchedModules = modules.filter(m => m.name.toLowerCase().includes(lowerQuery));
      if (matchedModules.length === 0) {
        // Fuzzy fallback
        const allNames = modules.map(m => m.name);
        const fuzzyNames = this.fuzzyMatch(allNames, query);
        const nameSet = new Set(fuzzyNames);
        matchedModules = modules.filter(m => nameSet.has(m.name));
      }
    }

    // Limit results
    matchedModules = matchedModules.slice(0, maxSuggestions);

    for (let i = 0; i < matchedModules.length; i++) {
      const mod = matchedModules[i];
      // Build require expression
      let requireExpr: string;
      if (useDeepest) {
        // Find if any GetService/variable binding covers a prefix of the instance path
        const segments = mod.instanceSegments;
        let bestVar: { varName: string; depth: number } | null = null;

        const limit = Math.min(document.lineCount, 80);
        for (let line = 0; line < limit; line++) {
          const text = document.lineAt(line).text;
          // Match: local X = game:GetService("Y")
          const gsMatch = text.match(/local\s+(\w+)\s*=\s*game:GetService\(\s*["'](\w+)["']\s*\)/);
          if (gsMatch) {
            const varName = gsMatch[1];
            const serviceName = gsMatch[2];
            // Check if this service is in our instance path
            const idx = segments.indexOf(serviceName);
            if (idx >= 0 && (bestVar === null || idx + 1 > bestVar.depth)) {
              bestVar = { varName, depth: idx + 1 };
            }
          }
        }

        if (bestVar && bestVar.depth < segments.length) {
          requireExpr = bestVar.varName + '.' + segments.slice(bestVar.depth).join('.');
        } else {
          requireExpr = mod.instancePath;
        }
      } else {
        requireExpr = mod.instancePath;
      }

      const item = new vscode.CompletionItem(
        `${prefix}require → ${mod.name}`,
        mod.isWallyPackage ? vscode.CompletionItemKind.Module : vscode.CompletionItemKind.File,
      );
      item.insertText = `local ${mod.name} = require(${requireExpr})`;
      item.range = fullRange;
      item.detail = mod.isWallyPackage ? `Wally: ${mod.name}` : mod.relativePath.replace(/\\/g, '/');
      item.sortText = `\x00r_${String(i).padStart(5, '0')}`;
      item.filterText = `${prefix}require ${mod.name}`;
      if (i === 0) item.preselect = true;

      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**${mod.name}**\n\n`);
      md.appendCodeblock(`local ${mod.name} = require(${requireExpr})`, 'lua');
      md.appendMarkdown(`\n\nPath: \`${mod.instancePath}\``);
      if (mod.isWallyPackage) md.appendMarkdown('\n\n*Wally package*');
      item.documentation = md;

      // If we need to insert a GetService, add additional edits
      if (autoInsertGetService && requireExpr === mod.instancePath && mod.instanceSegments.length >= 2) {
        const serviceName = mod.instanceSegments[0];
        const hasGetService = this.documentHasGetService(document, serviceName);
        if (!hasGetService) {
          const insertPos = this.findRequireInsertPosition(document);
          item.additionalTextEdits = [
            vscode.TextEdit.insert(
              new vscode.Position(insertPos, 0),
              `local ${serviceName} = game:GetService("${serviceName}")\n`,
            ),
          ];
          // Update insert text to use the variable
          item.insertText = `local ${mod.name} = require(${serviceName}.${mod.instanceSegments.slice(1).join('.')})`;
        }
      }

      items.push(item);
    }
  }

  private documentHasGetService(document: vscode.TextDocument, serviceName: string): boolean {
    const limit = Math.min(document.lineCount, 80);
    const pattern = new RegExp(`local\\s+\\w+\\s*=\\s*game:GetService\\(\\s*["']${escapeRegex(serviceName)}["']\\s*\\)`);
    for (let i = 0; i < limit; i++) {
      if (pattern.test(document.lineAt(i).text)) return true;
    }
    return false;
  }

  private classifyFile(filePath: string): 'service' | 'controller' | null {
    const cfg = getConfig();
    const servicesPath = cfg.paths.services;
    const controllersPath = cfg.paths.controllers;
    const norm = filePath.replace(/\\/g, '/');
    if (norm.includes(`/${servicesPath}/`) || norm.endsWith(`/${servicesPath}`)) return 'service';
    if (norm.includes(`/${controllersPath}/`) || norm.endsWith(`/${controllersPath}`)) return 'controller';
    return null;
  }

  // ===========================================================================
  // Path 2 — Service/controller name inside string literal
  // ===========================================================================

  private tryServiceControllerString(
    position: vscode.Position,
    textBefore: string,
  ): vscode.CompletionList | undefined {
    const svcMatch = textBefore.match(/GetService\s*\(\s*["']([^"']*)$/);
    if (svcMatch) {
      return this.buildNameList(svcMatch[1], serviceRegistry.getAllNames(), serviceRegistry, 'Service', position);
    }

    const ctrlMatch = textBefore.match(/GetController\s*\(\s*["']([^"']*)$/);
    if (ctrlMatch) {
      return this.buildNameList(ctrlMatch[1], controllerRegistry.getAllNames(), controllerRegistry, 'Controller', position);
    }
    return undefined;
  }

  private buildNameList(
    partial: string,
    allNames: string[],
    registry: { get(name: string): ServiceInfo | ControllerInfo | undefined },
    tag: string,
    position: vscode.Position,
  ): vscode.CompletionList {
    const matched = this.fuzzyMatch(allNames, partial);
    const items: vscode.CompletionItem[] = [];
    const replaceStart = new vscode.Position(position.line, position.character - partial.length);
    const replaceRange = new vscode.Range(replaceStart, position);

    for (let i = 0; i < matched.length; i++) {
      const name = matched[i];
      const info = registry.get(name);
      const item = new vscode.CompletionItem(
        name,
        tag === 'Service' ? vscode.CompletionItemKind.Interface : vscode.CompletionItemKind.Class,
      );
      item.insertText = name;
      item.range = replaceRange;
      item.detail = `Kore ${tag}`;
      item.sortText = `\x00${String(i).padStart(5, '0')}`;
      if (i === 0) item.preselect = true;

      if (info) {
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**${name}** (${tag})\n\n`);
        if ('clientMethods' in info) {
          const svc = info as ServiceInfo;
          if (svc.clientMethods.length > 0) {
            md.appendMarkdown('**Client methods:**\n');
            for (const m of svc.clientMethods) md.appendMarkdown(`- \`${m.name}(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')})\`\n`);
          }
          if (svc.netEvents.length > 0) {
            md.appendMarkdown('\n**Events:**\n');
            for (const e of svc.netEvents) md.appendMarkdown(`- \`${e.name}\`\n`);
          }
        } else {
          const ctrl = info as ControllerInfo;
          if (ctrl.methods.length > 0) {
            md.appendMarkdown('**Methods:**\n');
            for (const m of ctrl.methods) md.appendMarkdown(`- \`${m.name}(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')})\`\n`);
          }
        }
        item.documentation = md;
      }

      items.push(item);
    }
    return new vscode.CompletionList(items, false);
  }

  // ===========================================================================
  // Path 3 — Kore.SubModule. and Kore.Util.Table. (sub-module completions)
  // ===========================================================================

  private trySubmoduleDotAccess(
    position: vscode.Position,
    textBefore: string,
  ): vscode.CompletionList | undefined {
    // Deep: Kore.Util.Table.X
    const deepMatch = textBefore.match(/\bKore\.(\w+)\.(\w+)\.(\w*)$/);
    if (deepMatch) {
      const key = `${deepMatch[1]}.${deepMatch[2]}`;
      const apis = KORE_SUBMODULE_APIS[key];
      if (apis) {
        return this.buildApiList(apis, deepMatch[3], position);
      }
    }

    // First-level: Kore.Timer.X
    const subMatch = textBefore.match(/\bKore\.(\w+)\.(\w*)$/);
    if (subMatch && KORE_SUBMODULE_NAMES.has(subMatch[1])) {
      const apis = KORE_SUBMODULE_APIS[subMatch[1]];
      if (apis) {
        return this.buildApiList(apis, subMatch[2], position);
      }
    }

    return undefined;
  }

  private buildApiList(
    apis: KoreApiEntry[],
    partialRaw: string,
    position: vscode.Position,
  ): vscode.CompletionList {
    const partial = partialRaw.toLowerCase();
    const replaceStart = new vscode.Position(position.line, position.character - partialRaw.length);
    const replaceRange = new vscode.Range(replaceStart, position);

    const filtered = partial
      ? apis.filter(a => a.label.toLowerCase().startsWith(partial) || a.label.toLowerCase().includes(partial))
      : apis;

    const items: vscode.CompletionItem[] = [];
    for (let i = 0; i < filtered.length; i++) {
      const api = filtered[i];
      const item = new vscode.CompletionItem(api.label, api.kind);
      item.insertText = api.insertText.includes('$')
        ? new vscode.SnippetString(api.insertText)
        : api.insertText;
      item.detail = api.detail;
      item.documentation = new vscode.MarkdownString(api.documentation);
      item.range = replaceRange;
      item.sortText = `\x00${String(i).padStart(5, '0')}`;
      if (i === 0) item.preselect = true;
      items.push(item);
    }
    return new vscode.CompletionList(items, false);
  }

  // ===========================================================================
  // Path 4 — Kore. dot-access (top-level API)
  // ===========================================================================

  private tryKoreDotAccess(
    position: vscode.Position,
    textBefore: string,
  ): vscode.CompletionList | undefined {
    const dotMatch = textBefore.match(/\bKore\.(\w*)$/);
    if (!dotMatch) return undefined;
    return this.buildApiList(KORE_APIS, dotMatch[1], position);
  }

  // ===========================================================================
  // Path 5 — Member access on service/controller variables
  // ===========================================================================

  private tryMemberAccess(
    document: vscode.TextDocument,
    position: vscode.Position,
    textBefore: string,
  ): vscode.CompletionList | undefined {
    const dotMatch = textBefore.match(/\b(\w+)\.(\w*)$/);
    if (!dotMatch) return undefined;

    const varName = dotMatch[1];
    if (varName === 'Kore') return undefined;

    const partial = dotMatch[2].toLowerCase();
    const binding = this.findKoreBinding(document, position.line, varName);
    if (!binding) return undefined;

    const replaceStart = new vscode.Position(position.line, position.character - dotMatch[2].length);
    const replaceRange = new vscode.Range(replaceStart, position);
    const items: vscode.CompletionItem[] = [];

    if (binding.kind === 'service') {
      const info = serviceRegistry.get(binding.targetName);
      if (!info) return undefined;
      this.addServiceMemberItems(items, info, partial, replaceRange, document);
    } else {
      const info = controllerRegistry.get(binding.targetName);
      if (!info) return undefined;
      this.addControllerMemberItems(items, info, partial, replaceRange);
    }

    if (items.length === 0) return undefined;
    return new vscode.CompletionList(items, false);
  }

  private addServiceMemberItems(
    items: vscode.CompletionItem[],
    info: ServiceInfo,
    partial: string,
    range: vscode.Range,
    document: vscode.TextDocument,
  ): void {
    let idx = 0;
    const isServer = this.classifyFile(document.uri.fsPath) === 'service';

    if (isServer) {
      for (const m of info.methods) {
        if (partial && !m.name.toLowerCase().includes(partial)) continue;
        const item = new vscode.CompletionItem(m.name, vscode.CompletionItemKind.Method);
        item.detail = `(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')})${m.returnType ? ` → ${m.returnType}` : ''}`;
        item.documentation = new vscode.MarkdownString(`Server method on **${info.name}**`);
        item.range = range;
        item.sortText = `\x00${String(idx++).padStart(5, '0')}`;
        items.push(item);
      }

      for (const m of info.clientMethods) {
        if (partial && !m.name.toLowerCase().includes(partial)) continue;
        const item = new vscode.CompletionItem(m.name, vscode.CompletionItemKind.Method);
        item.detail = `Client: (${['player', ...m.params.map(p => `${p.name}: ${p.type}`)].join(', ')})`;
        item.documentation = new vscode.MarkdownString(`Client method on **${info.name}**`);
        item.range = range;
        item.sortText = `\x00${String(idx++).padStart(5, '0')}`;
        items.push(item);
      }

      for (const evt of info.netEvents) {
        if (partial && !evt.name.toLowerCase().includes(partial)) continue;
        const item = new vscode.CompletionItem(evt.name, vscode.CompletionItemKind.Event);
        item.detail = 'NetEvent';
        item.documentation = new vscode.MarkdownString(`Server→client event on **${info.name}**.\n\nFire with \`self:FireClient("${evt.name}", player, ...)\` or \`self:FireAllClients("${evt.name}", ...)\``);
        item.range = range;
        item.sortText = `\x00${String(idx++).padStart(5, '0')}`;
        items.push(item);
      }
    } else {
      for (const m of info.clientMethods) {
        if (partial && !m.name.toLowerCase().includes(partial)) continue;
        const item = new vscode.CompletionItem(m.name, vscode.CompletionItemKind.Method);
        item.detail = `(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')}) → Promise`;
        item.documentation = new vscode.MarkdownString(`Remote method on **${info.name}** — returns Promise.`);
        item.range = range;
        item.sortText = `\x00${String(idx++).padStart(5, '0')}`;
        items.push(item);
      }

      for (const evt of info.netEvents) {
        if (partial && !evt.name.toLowerCase().includes(partial)) continue;
        const item = new vscode.CompletionItem(evt.name, vscode.CompletionItemKind.Event);
        item.detail = 'RemoteEvent signal';
        item.documentation = new vscode.MarkdownString(`NetEvent on **${info.name}**.\n\n\`:Connect(fn)\`, \`:Once(fn)\`, \`:Wait()\``);
        item.range = range;
        item.sortText = `\x00${String(idx++).padStart(5, '0')}`;
        items.push(item);
      }
    }
  }

  private addControllerMemberItems(
    items: vscode.CompletionItem[],
    info: ControllerInfo,
    partial: string,
    range: vscode.Range,
  ): void {
    let idx = 0;
    for (const m of info.methods) {
      if (partial && !m.name.toLowerCase().includes(partial)) continue;
      const item = new vscode.CompletionItem(m.name, vscode.CompletionItemKind.Method);
      item.detail = `(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')})${m.returnType ? ` → ${m.returnType}` : ''}`;
      item.documentation = new vscode.MarkdownString(`Method on **${info.name}**`);
      item.range = range;
      item.sortText = `\x00${String(idx++).padStart(5, '0')}`;
      items.push(item);
    }
  }

  private findKoreBinding(
    document: vscode.TextDocument,
    beforeLine: number,
    varName: string,
  ): KoreVarBinding | null {
    const svcPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]GetService\\s*\\(\\s*["']([^"']+)["']\\s*\\)`,
    );
    const ctrlPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]GetController\\s*\\(\\s*["']([^"']+)["']\\s*\\)`,
    );
    const createSvcPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]CreateService\\s*\\(`,
    );
    const createCtrlPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]CreateController\\s*\\(`,
    );

    const limit = Math.min(document.lineCount, beforeLine);
    for (let i = limit - 1; i >= 0; i--) {
      const line = document.lineAt(i).text;
      const sm = svcPattern.exec(line);
      if (sm) return { varName, kind: 'service', targetName: sm[1] };
      const cm = ctrlPattern.exec(line);
      if (cm) return { varName, kind: 'controller', targetName: cm[1] };

      if (createSvcPattern.test(line)) {
        const name = this.findNameInCreateCall(document, i);
        if (name) return { varName, kind: 'service', targetName: name };
      }
      if (createCtrlPattern.test(line)) {
        const name = this.findNameInCreateCall(document, i);
        if (name) return { varName, kind: 'controller', targetName: name };
      }
    }
    return null;
  }

  private findNameInCreateCall(document: vscode.TextDocument, startLine: number): string | null {
    const scanLimit = Math.min(document.lineCount, startLine + 10);
    for (let j = startLine; j < scanLimit; j++) {
      const nameMatch = document.lineAt(j).text.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch) return nameMatch[1];
      if (/\}\s*\)/.test(document.lineAt(j).text)) break;
    }
    return null;
  }

  // ===========================================================================
  // Fuzzy matching
  // ===========================================================================

  private fuzzyMatch(names: string[], query: string): string[] {
    if (!query) return names;

    const lower = query.toLowerCase();
    const prefix = names.filter(n => n.toLowerCase().startsWith(lower));
    const sub = names.filter(n => n.toLowerCase().includes(lower) && !n.toLowerCase().startsWith(lower));

    if (prefix.length > 0 || sub.length > 0) {
      return [...prefix.sort((a, b) => a.length - b.length), ...sub.sort((a, b) => a.length - b.length)];
    }

    const config = vscode.workspace.getConfiguration('kore');
    const threshold = config.get<number>('fuzzyThreshold', 0.4);
    const matcher = new FuzzyMatcher(names, threshold);
    return matcher.search(query).map(r => r.name);
  }

  // ===========================================================================
  // Kore require helpers
  // ===========================================================================

  private documentHasKoreRequire(document: vscode.TextDocument): boolean {
    const limit = Math.min(document.lineCount, 80);
    for (let i = 0; i < limit; i++) {
      if (/local\s+Kore\s*=\s*require\b/.test(document.lineAt(i).text)) return true;
    }
    return false;
  }

  private documentHasTypesRequire(document: vscode.TextDocument): boolean {
    const limit = Math.min(document.lineCount, 80);
    for (let i = 0; i < limit; i++) {
      if (/local\s+Types\s*=\s*require\b/.test(document.lineAt(i).text)) return true;
    }
    return false;
  }

  /**
   * Build text edits that insert both Kore and Types requires (in correct order) at the
   * right position. Uses the Kore.toml `require.kore` path. Types path is derived from it.
   */
  private ensureRequires(document: vscode.TextDocument): vscode.TextEdit[] {
    const cfg = getConfig();
    const korePath = cfg.require.kore;
    const typesPath = getTypesRequirePath();
    const edits: vscode.TextEdit[] = [];

    const needsKore = !this.documentHasKoreRequire(document);
    const needsTypes = !this.documentHasTypesRequire(document);

    if (!needsKore && !needsTypes) return edits;

    const insertLine = this.findRequireInsertPosition(document);
    // Build combined insert text so ordering is always Kore first, then Types
    let insertText = '';
    if (needsKore) {
      insertText += `local Kore = require(${korePath})\n`;
    }
    if (needsTypes) {
      insertText += `local Types = require(${typesPath})\n`;
    }

    edits.push(vscode.TextEdit.insert(new vscode.Position(insertLine, 0), insertText));
    return edits;
  }

  private findRequireInsertPosition(document: vscode.TextDocument): number {
    let lastRequireLine = -1;
    let afterComments = 0;
    let passedComments = false;

    const limit = Math.min(document.lineCount, 60);
    for (let i = 0; i < limit; i++) {
      const line = document.lineAt(i).text.trim();
      if (line === '' || line.startsWith('--')) {
        if (!passedComments) afterComments = i + 1;
        continue;
      }
      passedComments = true;
      if (/^local\s+\w+\s*=\s*(game:GetService|require)\b/.test(line)) {
        lastRequireLine = i;
        continue;
      }
      break;
    }
    return lastRequireLine >= 0 ? lastRequireLine + 1 : afterComments;
  }

  // ===========================================================================
  // Documentation builders
  // ===========================================================================

  private buildServiceDoc(info: ServiceInfo): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${info.name}** (Service)\n\n`);
    if (info.clientMethods.length > 0) {
      md.appendMarkdown('**Client methods:**\n');
      for (const m of info.clientMethods) md.appendMarkdown(`- \`${m.name}(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')})\`\n`);
    }
    if (info.netEvents.length > 0) {
      md.appendMarkdown('\n**Events:**\n');
      for (const e of info.netEvents) md.appendMarkdown(`- \`${e.name}\`\n`);
    }
    return md;
  }

  private buildControllerDoc(info: ControllerInfo): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${info.name}** (Controller)\n\n`);
    if (info.methods.length > 0) {
      md.appendMarkdown('**Methods:**\n');
      for (const m of info.methods) md.appendMarkdown(`- \`${m.name}(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')})\`\n`);
    }
    return md;
  }
}
