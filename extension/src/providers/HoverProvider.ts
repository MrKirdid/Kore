/**
 * HoverProvider — Hover documentation for Kore APIs, sub-modules,
 * GetService/GetController calls, and service/controller member access.
 */

import * as vscode from 'vscode';
import { serviceRegistry, ServiceInfo } from '../registry/ServiceRegistry';
import { controllerRegistry, ControllerInfo } from '../registry/ControllerRegistry';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Top-level API docs ──────────────────────────────────────────────────────

const KORE_API_DOCS: Record<string, string> = {
  'CreateService': '```lua\nKore.CreateService(table: T & { Name: string }) → T & ServiceFields\n```\nCreate and register a service. Injects `Janitor`, `Log`, `FireClient`, `FireAllClients`. Preferred over AddService for full IntelliSense.',
  'CreateController': '```lua\nKore.CreateController(table: T & { Name: string }) → T & ControllerFields\n```\nCreate and register a controller (client only). Injects `Janitor`, `Log`. Preferred over AddController for full IntelliSense.',
  'Configure': '```lua\nKore.Configure(config: KoreConfig) → ()\n```\nConfigure Kore settings before Start(). Options: `Debug`, `Destroy` ("shutdown"|"dynamic"), `Log`.',
  'Start': '```lua\nKore.Start() → Promise\n```\nBoot Kore. Resolves dependencies, runs Init (sync, in order) then Start (async, parallel). Returns Promise.',
  'AddService': '```lua\nKore.AddService(serviceTable) → ()\n```\nManually register a pre-made service. Legacy — prefer `CreateService`.',
  'AddController': '```lua\nKore.AddController(controllerTable) → ()\n```\nManually register a pre-made controller. Legacy — prefer `CreateController`.',
  'GetService': '```lua\nKore.GetService(name: string) → Service | ServiceClient\n```\nRetrieve a service by name. Server returns real instance, client returns typed network proxy.',
  'GetController': '```lua\nKore.GetController(name: string) → Controller\n```\nRetrieve a controller by name (client only). Returns deferred proxy during Init phase.',
  'DestroyService': '```lua\nKore.DestroyService(name: string) → ()\n```\nDynamic destroy (requires `Destroy = "dynamic"`). Calls Destroy(), cleans Janitor, removes remotes.',
  'DestroyController': '```lua\nKore.DestroyController(name: string) → ()\n```\nDynamic destroy (requires `Destroy = "dynamic"`). Calls Destroy(), cleans Janitor.',
  'NetEvent': '```lua\nKore.NetEvent :: Symbol\n```\nSentinel value for declaring server→client event remotes in Client tables.\n\n```lua\nClient = { MyEvent = Kore.NetEvent }\n```',
  'Signal': '```lua\nKore.Signal\n```\nSignal library. Use `Kore.Signal.new(config?)` to create.\n\nConfig: `{ Network, Owner, RateLimit }`',
  'Promise': '```lua\nKore.Promise\n```\nRe-export of evaera/promise. Full Promise/A+ implementation.',
  'Log': '```lua\nKore.Log\n```\nStructured logger. `.Tagged(name)`, `.Debug()`, `.Info()`, `.Warn()`, `.Error()`, `.SetMinLevel()`',
  'Timer': '```lua\nKore.Timer\n```\n`.Debounce(fn, t)`, `.Throttle(fn, t)`, `.Delay(t, fn)`, `.Every(t, fn)`, `.Heartbeat(fn)`, `.Stepped(fn)`, `.RenderStepped(fn)`',
  'Tween': '```lua\nKore.Tween.new(instance) → TweenBuilder\n```\nBuilder-pattern tween. Chain `:Property()`, `:Duration()`, `:Easing()`, `:Play()` → Promise.',
  'Curve': '```lua\nKore.Curve.new(keyframes) → CurveInstance\n```\nKeyframe curve sampler. `:Sample(t)` for linear, `:SampleSmooth(t)` for Catmull-Rom.',
  'Data': '```lua\nKore.Data\n```\nProfileStore bridge (server only). `.Configure()`, `.Load()`, `.Get()`, `.OnLoaded()`, `.Save()`, `.Release()`',
  'Thread': '```lua\nKore.Thread\n```\nWeave wrapper for parallel Luau. `.Pool(count, script)` → ThreadPool, `.Kernel(actor)` → ThreadKernel.',
  'Mock': '```lua\nKore.Mock\n```\nTest isolation. `.Service(def)`, `.Controller(def)` — test without Kore.Start().\n\nMockHandle: `:Init()`, `:Start()`, `:Inject()`, `:Get()`, `:Destroy()`',
  'Janitor': '```lua\nKore.Janitor.new() → Janitor\n```\nCleanup management. `:Add(task, method?)`, `:Cleanup()`, `:Destroy()`.\n\nAuto-injected into every service/controller.',
  'Fusion': '```lua\nKore.Fusion\n```\nRe-export of elttob/fusion.',
  'Util': '```lua\nKore.Util\n```\nUtility modules:\n- `Util.Table` — deepCopy, merge, filter, map, find, flatten, etc.\n- `Util.String` — trim, split, capitalize, camelize, slugify, etc.\n- `Util.Math` — lerp, clamp, round, snap, bezier, damp, etc.',
  'Symbol': '```lua\nKore.Symbol(name: string) → Symbol\n```\nCreate/retrieve a unique interned sentinel value.',
  'Net': '```lua\nKore.Net\n```\nRemote networking layer. `.SetCompression()`, `.SetupServerRemotes()`, `.CreateClientProxy()`.\n\nMiddleware, RateLimit, Compression, Batching.',
  'Types': '```lua\nKore.Types\n```\nAuto-generated type definitions module (managed by the VS Code extension).',
};

// ─── Sub-module hover docs ───────────────────────────────────────────────────

const KORE_SUBMODULE_DOCS: Record<string, Record<string, string>> = {
  Signal: {
    'new': '```lua\nKore.Signal.new(config?) → Signal\n```\nCreate a new signal.\n\nOptional config: `{ Network = true, Owner = "Server"|"Client"|"Both", RateLimit = { MaxCalls, PerSeconds } }`\n\nMethods: `:Connect(fn)`, `:Once(fn)`, `:Wait()`, `:Fire(...)`, `:FireClient(player, ...)`, `:FireAllClients(...)`, `:DisconnectAll()`, `:Destroy()`',
  },
  Timer: {
    'Debounce': '```lua\nKore.Timer.Debounce(fn, seconds) → (...) → ()\n```\nCreate a debounced wrapper. Waits `seconds` after the last call before firing.',
    'Throttle': '```lua\nKore.Timer.Throttle(fn, seconds) → (...) → ()\n```\nCreate a throttled wrapper. Fires at most once per `seconds`.',
    'Delay': '```lua\nKore.Timer.Delay(seconds, fn) → CancelFn\n```\nFire `fn` once after `seconds` delay. Returns a cancel function.',
    'Every': '```lua\nKore.Timer.Every(seconds, fn) → CancelFn\n```\nFire `fn` repeatedly every `seconds`. Returns a cancel function.',
    'Heartbeat': '```lua\nKore.Timer.Heartbeat(fn: (dt) → ()) → RBXScriptConnection\n```\nConnect to RunService.Heartbeat.',
    'Stepped': '```lua\nKore.Timer.Stepped(fn: (time, dt) → ()) → RBXScriptConnection\n```\nConnect to RunService.Stepped.',
    'RenderStepped': '```lua\nKore.Timer.RenderStepped(fn: (dt) → ()) → RBXScriptConnection?\n```\nConnect to RunService.RenderStepped (client only).',
  },
  Tween: {
    'new': '```lua\nKore.Tween.new(instance: Instance) → TweenBuilder\n```\nCreate a builder-pattern tween.\n\nChain: `:Property(name, value)`, `:Duration(secs)`, `:Easing(style, dir)`, `:RepeatCount(n)`, `:Reverses(bool)`, `:DelayTime(secs)`, `:Play()` → Promise',
  },
  Curve: {
    'new': '```lua\nKore.Curve.new(keyframes: {{ t: number, v: number }}) → CurveInstance\n```\nCreate a keyframe curve.\n\n`:Sample(t)` — linear interpolation\n`:SampleSmooth(t)` — Catmull-Rom cubic (needs ≥4 keyframes)',
  },
  Log: {
    'Tagged': '```lua\nKore.Log.Tagged(tag: string) → TaggedLogger\n```\nCreate a tagged logger. Returns `{ Debug, Info, Warn, Error }` functions auto-tagged with the given name.',
    'Debug': '```lua\nKore.Log.Debug(tag, message, ...) → ()\n```\nLog debug message (only if min level ≤ Debug).',
    'Info': '```lua\nKore.Log.Info(tag, message, ...) → ()\n```\nLog info message.',
    'Warn': '```lua\nKore.Log.Warn(tag, message, ...) → ()\n```\nLog warning message.',
    'Error': '```lua\nKore.Log.Error(tag, message, ...) → ()\n```\nLog error message and throw.',
    'ErrorNoThrow': '```lua\nKore.Log.ErrorNoThrow(tag, message, ...) → ()\n```\nLog error without throwing.',
    'SetMinLevel': '```lua\nKore.Log.SetMinLevel(level: "Debug"|"Info"|"Warn"|"Error") → ()\n```\nSet minimum log level.',
    'EnableDebug': '```lua\nKore.Log.EnableDebug() → ()\n```\nEnable debug logging (sets min level to Debug).',
  },
  Data: {
    'Configure': '```lua\nKore.Data.Configure(config: { StoreName: string?, Template: { [string]: any }? }) → ()\n```\nConfigure DataStore name and default player data template.',
    'Load': '```lua\nKore.Data.Load(player: Player) → Promise<Profile>\n```\nLoad (or create) a player profile.',
    'Get': '```lua\nKore.Data.Get(player: Player) → Profile?\n```\nGet loaded profile, or nil if not yet loaded.',
    'OnLoaded': '```lua\nKore.Data.OnLoaded(player: Player, fn: (Profile) → ()) → ()\n```\nCallback when the player\'s profile finishes loading.',
    'Save': '```lua\nKore.Data.Save(player: Player) → Promise\n```\nForce-save player profile.',
    'Release': '```lua\nKore.Data.Release(player: Player) → ()\n```\nRelease profile session and clean up.',
  },
  Thread: {
    'Pool': '```lua\nKore.Thread.Pool(count: number, workerScript: ModuleScript) → ThreadPool\n```\nCreate a parallel worker pool.\n\n`:Dispatch(task, count)` → Promise\n`:DispatchDetached(task, count)`\n`:Destroy()`',
    'Kernel': '```lua\nKore.Thread.Kernel(actor: Actor) → ThreadKernel\n```\nRegister task handlers on a worker Actor.\n\n`:On(task, handler)` (chainable)\n`:OnDetached(task, handler)`\n`:Ready()`',
  },
  Mock: {
    'Service': '```lua\nKore.Mock.Service(definition) → MockHandle\n```\nCreate test mock. Methods: `:Init()`, `:Start()`, `:Inject(name, impl)`, `:Get()`, `:Destroy()`',
    'Controller': '```lua\nKore.Mock.Controller(definition) → MockHandle\n```\nCreate test mock controller.',
  },
  Janitor: {
    'new': '```lua\nKore.Janitor.new() → Janitor\n```\nCreate a new Janitor.\n\n`:Add(task, method?)` — track\n`:Remove(index)`\n`:Cleanup()` — clean all (LIFO)\n`:Destroy()` — alias for Cleanup',
  },
  Net: {
    'SetCompression': '```lua\nKore.Net.SetCompression(config: "None"|"Auto"|"Aggressive"|CompressionConfig) → ()\n```\nSet compression strategy for network payloads.',
  },
  Util: {
    'Table': '```lua\nKore.Util.Table\n```\n`deepCopy`, `shallowCopy`, `merge`, `keys`, `values`, `filter`, `map`, `find`, `flatten`, `shuffle`, `count`, `freeze`, `diff`',
    'String': '```lua\nKore.Util.String\n```\n`trim`, `split`, `startsWith`, `endsWith`, `capitalize`, `truncate`, `padStart`, `padEnd`, `camelize`, `slugify`',
    'Math': '```lua\nKore.Util.Math\n```\n`lerp`, `clamp`, `round`, `map`, `snap`, `sign`, `randomRange`, `approach`, `damp`, `bezier`',
  },
};

// ─── provider ────────────────────────────────────────────────────────────────

export class HoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | null {
    const range = document.getWordRangeAtPosition(position, /[\w.]+/);
    if (!range) return null;

    const word = document.getText(range);
    const line = document.lineAt(position).text;

    // ── Kore.GetService("Name") hover ────────────────────────────────────────
    const getServiceMatch = line.match(/GetService\s*\(\s*["']([^"']+)["']\s*\)/);
    if (getServiceMatch) {
      const name = getServiceMatch[1];
      const info = serviceRegistry.get(name);
      if (info) return new vscode.Hover(this.buildServiceMarkdown(info), range);
    }

    // ── Kore.GetController("Name") hover ─────────────────────────────────────
    const getControllerMatch = line.match(/GetController\s*\(\s*["']([^"']+)["']\s*\)/);
    if (getControllerMatch) {
      const name = getControllerMatch[1];
      const info = controllerRegistry.get(name);
      if (info) return new vscode.Hover(this.buildControllerMarkdown(info), range);
    }

    // ── Kore.SubModule.Method hover (e.g. Kore.Timer.Debounce) ───────────────
    const deepApiMatch = word.match(/^Kore\.(\w+)\.(\w+)\.(\w+)$/);
    if (deepApiMatch) {
      const key = `${deepApiMatch[1]}.${deepApiMatch[2]}`;
      // This would be for Kore.Util.Table.deepCopy etc. — not in KORE_SUBMODULE_DOCS yet
      // but we can check if the parent sub-module has it
    }

    const subApiMatch = word.match(/^Kore\.(\w+)\.(\w+)$/);
    if (subApiMatch) {
      const moduleName = subApiMatch[1];
      const methodName = subApiMatch[2];
      const moduleDocs = KORE_SUBMODULE_DOCS[moduleName];
      if (moduleDocs) {
        const doc = moduleDocs[methodName];
        if (doc) return new vscode.Hover(new vscode.MarkdownString(doc), range);
      }
    }

    // ── Kore.* API hover ─────────────────────────────────────────────────────
    const koreApiMatch = word.match(/^Kore\.(\w+)$/);
    if (koreApiMatch) {
      const apiName = koreApiMatch[1];
      const doc = KORE_API_DOCS[apiName];
      if (doc) return new vscode.Hover(new vscode.MarkdownString(doc), range);
    }

    // ── ServiceVar.Member hover ──────────────────────────────────────────────
    const dotMemberMatch = word.match(/^(\w+)\.(\w+)$/);
    if (dotMemberMatch) {
      const varName = dotMemberMatch[1];
      const memberName = dotMemberMatch[2];
      if (varName !== 'Kore') {
        const binding = this.findKoreBinding(document, position.line, varName);
        if (binding) {
          if (binding.kind === 'service') {
            const info = serviceRegistry.get(binding.targetName);
            if (info) {
              const hover = this.buildMemberHover(info, memberName);
              if (hover) return new vscode.Hover(hover, range);
            }
          } else {
            const info = controllerRegistry.get(binding.targetName);
            if (info) {
              const method = info.methods.find(m => m.name === memberName);
              if (method) {
                const md = new vscode.MarkdownString();
                md.appendMarkdown(`**${info.name}.${method.name}**\n\n`);
                md.appendCodeblock(`(${method.params.map(p => `${p.name}: ${p.type}`).join(', ')})${method.returnType ? ` → ${method.returnType}` : ''}`, 'lua');
                return new vscode.Hover(md, range);
              }
            }
          }
        }
      }
    }

    return null;
  }

  private buildServiceMarkdown(info: ServiceInfo): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`### ${info.name}\n\n`);
    if (info.methods.length > 0) {
      md.appendMarkdown(`**Server methods:**\n${info.methods.map(m => `- \`${m.name}(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')})\``).join('\n')}\n\n`);
    }
    const clientMethods = info.clientMethods.map(m => `- \`${m.name}(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')})\``).join('\n');
    md.appendMarkdown(`**Client methods:**\n${clientMethods || '(none)'}\n\n`);
    const events = info.netEvents.map(e => `- \`${e.name}\` (RemoteEvent)`).join('\n');
    if (events) md.appendMarkdown(`**Events:**\n${events}\n`);
    if (info.hasBatching) md.appendMarkdown(`\n*Batching enabled*\n`);
    return md;
  }

  private buildControllerMarkdown(info: ControllerInfo): vscode.MarkdownString {
    const methods = info.methods.map(m => `- \`${m.name}(${m.params.map(p => `${p.name}: ${p.type}`).join(', ')})\``).join('\n');
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`### ${info.name}\n\n`);
    md.appendMarkdown(`**Methods:**\n${methods || '(none)'}\n`);
    return md;
  }

  private buildMemberHover(info: ServiceInfo, memberName: string): vscode.MarkdownString | null {
    const clientMethod = info.clientMethods.find(m => m.name === memberName);
    if (clientMethod) {
      const md = new vscode.MarkdownString();
      const isRemoteFunction = clientMethod.returnType !== null;
      md.appendMarkdown(`**${info.name}.${clientMethod.name}** — ${isRemoteFunction ? 'RemoteFunction' : 'RemoteEvent'}\n\n`);
      md.appendCodeblock(`(${clientMethod.params.map(p => `${p.name}: ${p.type}`).join(', ')}) → ${isRemoteFunction ? `Promise<${clientMethod.returnType}>` : 'Promise<void>'}`, 'lua');
      return md;
    }

    const netEvent = info.netEvents.find(e => e.name === memberName);
    if (netEvent) {
      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**${info.name}.${netEvent.name}** — NetEvent (RemoteEvent)\n\n`);
      md.appendMarkdown(`Server-to-client event signal.\n\n`);
      md.appendCodeblock(`:Connect(function(...) end)\n:Once(function(...) end)\n:Wait()`, 'lua');
      return md;
    }

    const serverMethod = info.methods.find(m => m.name === memberName);
    if (serverMethod) {
      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**${info.name}.${serverMethod.name}** — Server method\n\n`);
      md.appendCodeblock(`(${serverMethod.params.map(p => `${p.name}: ${p.type}`).join(', ')})${serverMethod.returnType ? ` → ${serverMethod.returnType}` : ''}`, 'lua');
      return md;
    }

    return null;
  }

  private findKoreBinding(
    document: vscode.TextDocument,
    beforeLine: number,
    varName: string,
  ): { kind: 'service' | 'controller'; targetName: string } | null {
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
      if (sm) return { kind: 'service', targetName: sm[1] };
      const cm = ctrlPattern.exec(line);
      if (cm) return { kind: 'controller', targetName: cm[1] };

      if (createSvcPattern.test(line)) {
        const name = this.findNameInCreateCall(document, i);
        if (name) return { kind: 'service', targetName: name };
      }
      if (createCtrlPattern.test(line)) {
        const name = this.findNameInCreateCall(document, i);
        if (name) return { kind: 'controller', targetName: name };
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
}
