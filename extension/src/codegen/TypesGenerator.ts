/**
 * TypesGenerator — Generates Types.luau content from the service and controller registries.
 *
 * Emits the full set of framework type definitions (KoreAPI, Symbol, Signal,
 * Timer, Tween, Curve, Data, Thread, Mock, Proxy, Loader, Net, Util, Janitor,
 * Log, Config, ServiceDefinition, ControllerDefinition, ServiceFields,
 * ControllerFields) plus auto-generated per-service and per-controller types.
 */

import { serviceRegistry, ServiceInfo, ServiceMethod, MethodParam } from '../registry/ServiceRegistry';
import { controllerRegistry, ControllerInfo } from '../registry/ControllerRegistry';

function formatParams(params: MethodParam[]): string {
  if (params.length === 0) return '';
  return params.map(p => `${p.name}: ${p.type}`).join(', ');
}

function generateServiceType(service: ServiceInfo): string {
  const lines: string[] = [];

  lines.push(`export type ${service.name} = {`);
  lines.push('\tName: string,');
  lines.push('\tJanitor: Janitor,');
  lines.push('\tLog: TaggedLogger,');

  // Server methods
  for (const method of service.methods) {
    const params = formatParams(method.params);
    const ret = method.returnType ? method.returnType : '()';
    lines.push(`\t${method.name}: (${params}) -> ${ret},`);
  }

  // Client methods (accessible from server too)
  for (const method of service.clientMethods) {
    const params = formatParams(method.params);
    const ret = method.returnType ? method.returnType : '()';
    lines.push(`\t${method.name}: (${params}) -> ${ret},`);
  }

  // Fire helpers (only if there are net events)
  if (service.netEvents.length > 0) {
    lines.push('\tFireClient: ((self: any, eventName: string, player: Player, ...any) -> ())?,');
    lines.push('\tFireAllClients: ((self: any, eventName: string, ...any) -> ())?,');
  }

  lines.push('}');
  return lines.join('\n');
}

function generateServiceClientType(service: ServiceInfo): string {
  const lines: string[] = [];
  lines.push(`export type ${service.name}Client = {`);

  for (const method of service.clientMethods) {
    // Client proxy: player arg removed, return wrapped in Promise
    const params = formatParams(method.params);
    const ret = method.returnType ? `Promise<${method.returnType}>` : 'Promise<nil>';
    lines.push(`\t${method.name}: (${params}) -> ${ret},`);
  }

  for (const event of service.netEvents) {
    // Client events are proxied as ClientEventProxy (Connect/Once/Wait), NOT Signal
    lines.push(`\t${event.name}: ClientEventProxy,`);
  }

  lines.push('}');
  return lines.join('\n');
}

function generateControllerType(controller: ControllerInfo): string {
  const lines: string[] = [];

  lines.push(`export type ${controller.name} = {`);
  lines.push('\tName: string,');
  lines.push('\tJanitor: Janitor,');
  lines.push('\tLog: TaggedLogger,');

  for (const method of controller.methods) {
    const params = formatParams(method.params);
    const ret = method.returnType ? method.returnType : '()';
    lines.push(`\t${method.name}: (${params}) -> ${ret},`);
  }

  lines.push('}');
  return lines.join('\n');
}

// ─── Static framework type definitions ───────────────────────────────────────
// These mirror the hand-authored Kore/Types.luau so that the auto-generated
// file is a complete drop-in replacement (init.luau casts to Types.KoreAPI).

const FRAMEWORK_TYPES = `\
-- ──────────────────────────────────────────────────────────────────────
-- Symbol
-- ──────────────────────────────────────────────────────────────────────

--- A unique, interned sentinel value identified by name.
export type Symbol = {
\t_name: string,
\t_isSymbol: true,
}

--- Constructor: \`Symbol(name) -> Symbol\`
export type SymbolConstructor = (name: string) -> Symbol

-- ──────────────────────────────────────────────────────────────────────
-- Log
-- ──────────────────────────────────────────────────────────────────────

--- A tag-scoped logger instance returned by \`Log.Tagged(tag)\`.
export type TaggedLogger = {
\tDebug: (message: string, ...any) -> (),
\tInfo: (message: string, ...any) -> (),
\tWarn: (message: string, ...any) -> (),
\tError: (message: string, ...any) -> (),
\tErrorNoThrow: (message: string, ...any) -> (),
}

--- Valid log level names.
export type LogLevel = "Debug" | "Info" | "Warn" | "Error"

--- The static Log module.
export type LogModule = {
\tSetMinLevel: (level: LogLevel) -> (),
\tEnableDebug: () -> (),
\tDebug: (tag: string, message: string, ...any) -> (),
\tInfo: (tag: string, message: string, ...any) -> (),
\tWarn: (tag: string, message: string, ...any) -> (),
\tError: (tag: string, message: string, ...any) -> (),
\tErrorNoThrow: (tag: string, message: string, ...any) -> (),
\tTagged: (tag: string) -> TaggedLogger,
}

-- ──────────────────────────────────────────────────────────────────────
-- Signal
-- ──────────────────────────────────────────────────────────────────────

--- A single signal connection handle.
export type SignalConnection = {
\tDisconnect: (self: SignalConnection) -> (),
}

--- Configuration passed to \`Signal.new()\` for optional networking.
export type SignalConfig = {
\t--- Enable networking for this signal.
\tNetwork: boolean?,
\t--- Who owns (fires) the signal: \`"Server"\`, \`"Client"\`, or \`"Both"\`.
\tOwner: ("Server" | "Client" | "Both")?,
\t--- Optional rate-limit config for networked signals.
\tRateLimit: RateLimitConfig?,
}

--- A Kore Signal instance. Local by default, optionally networked.
export type Signal<T...> = {
\tConnect: (self: Signal<T...>, fn: (T...) -> ()) -> SignalConnection,
\tConnectNet: (self: Signal<T...>, fn: (T...) -> ()) -> SignalConnection,
\tOnce: (self: Signal<T...>, fn: (T...) -> ()) -> SignalConnection,
\tWait: (self: Signal<T...>) -> T...,
\tFire: (self: Signal<T...>, T...) -> (),
\tFireClient: (self: Signal<T...>, player: Player, T...) -> (),
\tFireAllClients: (self: Signal<T...>, T...) -> (),
\tDisconnectAll: (self: Signal<T...>) -> (),
\tDestroy: (self: Signal<T...>) -> (),
}

--- The static Signal module.
export type SignalModule = {
\tnew: <T...>(config: SignalConfig?) -> Signal<T...>,
}

-- ──────────────────────────────────────────────────────────────────────
-- Janitor
-- ──────────────────────────────────────────────────────────────────────

--- A task entry stored by the Janitor.
export type JanitorTask = {
\ttask: any,
\tmethod: string,
}

--- A Janitor instance for deterministic cleanup.
export type Janitor = {
\tAdd: <T>(self: Janitor, task: T, methodName: string?, index: any?) -> T,
\tRemove: (self: Janitor, index: any) -> (),
\tCleanup: (self: Janitor) -> (),
\tDestroy: (self: Janitor) -> (),
}

--- The static Janitor module.
export type JanitorModule = {
\tnew: () -> Janitor,
}

-- ──────────────────────────────────────────────────────────────────────
-- Timer
-- ──────────────────────────────────────────────────────────────────────

--- A cancel function returned by \`Timer.Delay\` and \`Timer.Every\`.
export type CancelFn = () -> ()

--- The static Timer module.
export type TimerModule = {
\t--- Returns a debounced version of \`fn\` that waits \`t\` seconds after the last call.
\tDebounce: <T...>(fn: (T...) -> (), t: number) -> (T...) -> (),
\t--- Returns a throttled version of \`fn\` that fires at most once per \`t\` seconds.
\tThrottle: <T...>(fn: (T...) -> (), t: number) -> (T...) -> (),
\t--- Calls \`fn\` after \`t\` seconds. Returns a cancel function.
\tDelay: (t: number, fn: () -> ()) -> CancelFn,
\t--- Calls \`fn\` every \`t\` seconds. Returns a cancel function.
\tEvery: (t: number, fn: () -> ()) -> CancelFn,
\t--- Connects to \`RunService.Heartbeat\`.
\tHeartbeat: (fn: (deltaTime: number) -> ()) -> RBXScriptConnection,
\t--- Connects to \`RunService.Stepped\`.
\tStepped: (fn: (time: number, deltaTime: number) -> ()) -> RBXScriptConnection,
\t--- Connects to \`RunService.RenderStepped\` (client only).
\tRenderStepped: (fn: (deltaTime: number) -> ()) -> RBXScriptConnection?,
}

-- ──────────────────────────────────────────────────────────────────────
-- Tween
-- ──────────────────────────────────────────────────────────────────────

--- A Tween builder instance for animating instance properties.
export type TweenBuilder = {
\t--- Set a property to tween. Chainable.
\tProperty: (self: TweenBuilder, name: string, value: any) -> TweenBuilder,
\t--- Set the tween duration in seconds. Chainable.
\tDuration: (self: TweenBuilder, t: number) -> TweenBuilder,
\t--- Set the easing style and optional direction. Chainable.
\tEasing: (
\t\tself: TweenBuilder,
\t\tstyle: string | Enum.EasingStyle,
\t\tdirection: (string | Enum.EasingDirection)?
\t) -> TweenBuilder,
\t--- Set the repeat count. Chainable.
\tRepeatCount: (self: TweenBuilder, count: number) -> TweenBuilder,
\t--- Set whether the tween reverses. Chainable.
\tReverses: (self: TweenBuilder, reverses: boolean) -> TweenBuilder,
\t--- Set delay before the tween starts. Chainable.
\tDelayTime: (self: TweenBuilder, t: number) -> TweenBuilder,
\t--- Play the tween and return a Promise that resolves on completion.
\tPlay: (self: TweenBuilder) -> any, -- Promise<void>
\t--- Cancel the tween (no-op if not playing).
\tCancel: (self: TweenBuilder) -> (),
}

--- The static Tween module.
export type TweenModule = {
\tnew: (instance: Instance) -> TweenBuilder,
}

-- ──────────────────────────────────────────────────────────────────────
-- Curve
-- ──────────────────────────────────────────────────────────────────────

--- A single keyframe in a curve.
export type Keyframe = {
\t--- Time position of this keyframe (0\\u20131 or any range).
\tt: number,
\t--- Value at this keyframe.
\tv: number,
}

--- A keyframe curve sampler for animation, VFX, and time-based values.
export type CurveInstance = {
\t--- Sample the curve with linear interpolation.
\tSample: (self: CurveInstance, t: number) -> number,
\t--- Sample the curve with Catmull-Rom cubic interpolation (requires >= 4 keyframes).
\tSampleSmooth: (self: CurveInstance, t: number) -> number,
}

--- The static Curve module.
export type CurveModule = {
\tnew: (keyframes: { Keyframe }) -> CurveInstance,
}

-- ──────────────────────────────────────────────────────────────────────
-- Data (ProfileStore bridge)
-- ──────────────────────────────────────────────────────────────────────

--- Configuration for \`Data.Configure()\`.
export type DataConfig = {
\t--- The DataStore name. Default: \`"PlayerData"\`.
\tStoreName: string?,
\t--- The default data template table.
\tTemplate: { [string]: any }?,
}

--- A loaded player profile from ProfileStore.
export type Profile = {
\tData: { [string]: any },
\tSave: (self: Profile) -> (),
\tEndSession: (self: Profile) -> (),
\tAddUserId: (self: Profile, userId: number) -> (),
\tReconcile: (self: Profile) -> (),
\tOnSessionEnd: RBXScriptSignal,
}

--- The static Data module (server-only).
export type DataModule = {
\tConfigure: (config: DataConfig) -> (),
\tLoad: (player: Player) -> any, -- Promise<Profile>
\tGet: (player: Player) -> Profile?,
\tOnLoaded: (player: Player, fn: (profile: Profile) -> ()) -> (),
\tSave: (player: Player) -> any, -- Promise<void>
\tRelease: (player: Player) -> (),
}

-- ──────────────────────────────────────────────────────────────────────
-- Thread (Weave wrapper)
-- ──────────────────────────────────────────────────────────────────────

--- A dispatcher-backed thread pool for parallel Luau execution.
export type ThreadPool = {
\t--- Dispatch a named task across \`count\` workers. Returns a Promise.
\tDispatch: (self: ThreadPool, taskName: string, count: number) -> any, -- Promise
\t--- Dispatch a fire-and-forget task.
\tDispatchDetached: (self: ThreadPool, taskName: string, count: number) -> (),
\t--- Destroy the pool and release worker Actors.
\tDestroy: (self: ThreadPool) -> (),
}

--- A worker kernel wrapping a single Actor.
export type ThreadKernel = {
\t--- Register a handler for a named task. Chainable.
\tOn: (self: ThreadKernel, taskName: string, handler: (...any) -> ...any) -> ThreadKernel,
\t--- Register a detached handler for a named task. Chainable.
\tOnDetached: (self: ThreadKernel, taskName: string, handler: (...any) -> ...any) -> ThreadKernel,
\t--- Mark this kernel as ready to receive dispatches.
\tReady: (self: ThreadKernel) -> (),
}

--- The static Thread module.
export type ThreadModule = {
\tPool: (count: number, workerScript: ModuleScript) -> ThreadPool,
\tKernel: (actor: Actor) -> ThreadKernel,
}

-- ──────────────────────────────────────────────────────────────────────
-- Mock
-- ──────────────────────────────────────────────────────────────────────

--- A mock handle wrapping a service or controller for test isolation.
export type MockHandle<T> = {
\t--- Run the \`Init\` lifecycle method.
\tInit: (self: MockHandle<T>) -> (),
\t--- Run the \`Start\` lifecycle method.
\tStart: (self: MockHandle<T>) -> (),
\t--- Inject a named dependency.
\tInject: (self: MockHandle<T>, name: string, implementation: any) -> (),
\t--- Get the underlying service/controller table.
\tGet: (self: MockHandle<T>) -> T,
\t--- Run \`Destroy\` and clean up the Janitor.
\tDestroy: (self: MockHandle<T>) -> (),
}

--- The static Mock module.
export type MockModule = {
\tService: (definition: ServiceDefinition) -> MockHandle<ServiceDefinition>,
\tController: (definition: ControllerDefinition) -> MockHandle<ControllerDefinition>,
}

-- ──────────────────────────────────────────────────────────────────────
-- Proxy
-- ──────────────────────────────────────────────────────────────────────

--- Internal resolver function for a proxy. Call with the real target once it's available.
export type ProxyResolveFn = (target: any) -> ()

--- The static Proxy module.
export type ProxyModule = {
\tcreate: (name: string) -> (any, ProxyResolveFn),
}

-- ──────────────────────────────────────────────────────────────────────
-- Loader
-- ──────────────────────────────────────────────────────────────────────

--- Any module with a Name field usable by the loader.
export type NamedModule = {
\tName: string,
\tDependencies: { string }?,
\t[any]: any,
}

--- The static Loader module.
export type LoaderModule = {
\tTopologicalSort: (modules: { NamedModule }) -> { NamedModule },
\tDiscoverModules: (parent: Instance) -> { NamedModule },
}

-- ──────────────────────────────────────────────────────────────────────
-- Net
-- ──────────────────────────────────────────────────────────────────────

--- An inbound/outbound middleware definition for a remote.
export type MiddlewareDef = {
\tInbound: ((player: Player, ...any) -> ...any)?,
\tOutbound: ((player: Player, result: any) -> any)?,
}

--- A middleware function signature.
export type MiddlewareFn = (player: Player, ...any) -> ...any

--- Rate-limit configuration for a remote.
export type RateLimitConfig = {
\tMaxCalls: number,
\tPerSeconds: number,
}

--- Compression strategy name.
export type CompressionStrategy = "None" | "Auto" | "Aggressive" | "Custom"

--- Custom compression config.
export type CompressionConfig = {
\tStrategy: CompressionStrategy?,
\tEncode: ((data: any) -> any)?,
\tDecode: ((data: any) -> any)?,
}

--- A frame-based remote call batcher.
export type Batcher = {
\tQueue: (self: Batcher, remoteName: string, ...any) -> (),
\tDestroy: (self: Batcher) -> (),
}

--- A single entry in a batch queue.
export type BatchEntry = {
\tname: string,
\targs: { [number]: any, n: number },
}

--- A client-side event proxy for \`RemoteEvent\`-backed signals.
export type ClientEventProxy = {
\tConnect: (self: ClientEventProxy, fn: (...any) -> ()) -> RBXScriptConnection,
\tOnce: (self: ClientEventProxy, fn: (...any) -> ()) -> RBXScriptConnection,
\tWait: (self: ClientEventProxy) -> ...any,
\tDisconnectAll: (self: ClientEventProxy) -> (),
}

--- Client table entry for a \`Kore.NetEvent\` sentinel.
export type NetEventType = Symbol

--- The static Net module.
export type NetModule = {
\tSetupServerRemotes: (service: ServiceDefinition) -> (),
\tCreateClientProxy: (serviceName: string, Promise: any) -> { [string]: any }?,
\tDestroyServiceRemotes: (serviceName: string) -> (),
\tSetCompression: (config: CompressionStrategy | CompressionConfig) -> (),
}

-- ──────────────────────────────────────────────────────────────────────
-- Util
-- ──────────────────────────────────────────────────────────────────────

--- Table diff result.
export type DiffResult<K, V> = {
\tadded: { [K]: V },
\tremoved: { [K]: V },
\tchanged: { [K]: { old: V, new: V } },
}

--- The Table utility module.
export type TableUtil = {
\tdeepCopy: <T>(t: T) -> T,
\tshallowCopy: <T>(t: T) -> T,
\tmerge: (...{ [any]: any }) -> { [any]: any },
\tkeys: <K, V>(t: { [K]: V }) -> { K },
\tvalues: <K, V>(t: { [K]: V }) -> { V },
\tfilter: <K, V>(t: { [K]: V }, predicate: (value: V, key: K) -> boolean) -> { [K]: V },
\tmap: <K, V, R>(t: { [K]: V }, transform: (value: V, key: K) -> R) -> { [K]: R },
\tfind: <K, V>(t: { [K]: V }, predicate: (value: V, key: K) -> boolean) -> (V?, K?),
\tflatten: <T>(t: { any }, depth: number?) -> { T },
\tshuffle: <T>(t: { T }) -> { T },
\tcount: (t: { [any]: any }) -> number,
\tfreeze: <T>(t: T) -> T,
\tdiff: <K, V>(a: { [K]: V }, b: { [K]: V }) -> DiffResult<K, V>,
}

--- The String utility module.
export type StringUtil = {
\ttrim: (s: string) -> string,
\tsplit: (s: string, sep: string?) -> { string },
\tstartsWith: (s: string, prefix: string) -> boolean,
\tendsWith: (s: string, suffix: string) -> boolean,
\tcapitalize: (s: string) -> string,
\ttruncate: (s: string, maxLen: number, suffix: string?) -> string,
\tpadStart: (s: string, len: number, char: string?) -> string,
\tpadEnd: (s: string, len: number, char: string?) -> string,
\tcamelize: (s: string) -> string,
\tslugify: (s: string) -> string,
}

--- The Math utility module.
export type MathUtil = {
\tlerp: (a: number, b: number, t: number) -> number,
\tclamp: (value: number, min: number, max: number) -> number,
\tround: (value: number, decimals: number?) -> number,
\tmap: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) -> number,
\tsnap: (value: number, step: number) -> number,
\tsign: (value: number) -> number,
\trandomRange: (min: number, max: number) -> number,
\tapproach: (current: number, target: number, step: number) -> number,
\tdamp: (a: number, b: number, smoothing: number, dt: number) -> number,
\tbezier: (t: number, p0: number, p1: number, p2: number, p3: number) -> number,
}

--- The combined Util module.
export type UtilModule = {
\tTable: TableUtil,
\tString: StringUtil,
\tMath: MathUtil,
}

-- ──────────────────────────────────────────────────────────────────────
-- Kore Configuration
-- ──────────────────────────────────────────────────────────────────────

--- Log sub-config for \`Kore.Configure()\`.
export type KoreLogConfig = {
\tDiscordWebhook: string?,
}

--- Configuration table passed to \`Kore.Configure()\`.
export type KoreConfig = {
\t--- Enable debug logging. Default: \`false\`.
\tDebug: boolean?,
\t--- Destroy mode: \`"shutdown"\` (default) or \`"dynamic"\`.
\tDestroy: ("shutdown" | "dynamic")?,
\t--- Log sub-configuration.
\tLog: KoreLogConfig?,
}

-- ──────────────────────────────────────────────────────────────────────
-- Service & Controller Definitions
-- ──────────────────────────────────────────────────────────────────────

--- The context object passed to \`Init()\` and \`Start()\` lifecycle methods.
export type ContextType = {
\t--- A tag-scoped logger for this service/controller.
\tLog: TaggedLogger,
\t--- Reference to the Kore API.
\tKore: KoreAPI,
\t--- The service/controller's Config table, if any.
\tConfig: { [string]: any }?,
}

--- Client-facing table on a service, defining remote methods and events.
export type ClientTable = {
\t--- Per-remote middleware definitions.
\tMiddleware: { [string]: MiddlewareDef }?,
\t--- Per-remote rate-limit definitions.
\tRateLimit: { [string]: RateLimitConfig }?,
\t--- Batching configuration.
\tBatching: any?,
\t--- Additional remote methods/events indexed by name.
\t[string]: ((...any) -> ...any) | NetEventType | {
\t\tfn: (...any) -> ...any,
\t\tUnreliable: boolean?,
\t\tImmediate: boolean?,
\t},
}

-- ──────────────────────────────────────────────────────────────────────
-- Service & Controller Injected Fields (for CreateService / CreateController)
-- ──────────────────────────────────────────────────────────────────────

--- Fields injected by \`Kore.CreateService()\`. Used as the intersection return type
--- so that \`self\` in \`:\` methods gets full IntelliSense on Janitor, Log, etc.
export type ServiceFields = {
\tJanitor: Janitor,
\tLog: TaggedLogger,
\tFireClient: ((self: any, eventName: string, player: Player, ...any) -> ())?,
\tFireAllClients: ((self: any, eventName: string, ...any) -> ())?,
}

--- Fields injected by \`Kore.CreateController()\`. Used as the intersection return type
--- so that \`self\` in \`:\` methods gets full IntelliSense on Janitor, Log, etc.
export type ControllerFields = {
\tJanitor: Janitor,
\tLog: TaggedLogger,
}

--- A Kore service definition table.
export type ServiceDefinition = {
\t--- Unique name for this service.
\tName: string,
\t--- Auto-injected Janitor for deterministic cleanup.
\tJanitor: Janitor,
\t--- Auto-injected tagged logger.
\tLog: TaggedLogger,
\t--- Fire a named event to a specific client.
\tFireClient: ((self: ServiceDefinition, eventName: string, player: Player, ...any) -> ())?,
\t--- Fire a named event to all clients.
\tFireAllClients: ((self: ServiceDefinition, eventName: string, ...any) -> ())?,
}

--- A Kore controller definition table.
export type ControllerDefinition = {
\t--- Unique name for this controller.
\tName: string,
\t--- Auto-injected Janitor for deterministic cleanup.
\tJanitor: Janitor,
\t--- Auto-injected tagged logger.
\tLog: TaggedLogger,
}

-- ──────────────────────────────────────────────────────────────────────
-- Kore API
-- ──────────────────────────────────────────────────────────────────────

--- The main Kore framework API.
-- NOTE: GetService / GetController overloads are generated dynamically
-- by the Kore extension so each known name returns its specific type.`;

/**
 * Build the KoreAPI type block dynamically so GetService / GetController
 * have per-name overloads that return the specific generated type instead
 * of the generic ServiceDefinition / ControllerDefinition.
 */
function buildKoreAPIType(): string {
  const services = serviceRegistry.getAll();
  const controllers = controllerRegistry.getAll();

  // Build GetService type: intersection of per-service overloads + fallback
  let getServiceType: string;
  if (services.length > 0) {
    const overloads = services.map(s => `((name: "${s.name}") -> ${s.name})`);
    overloads.push('((name: string) -> ServiceDefinition)');
    getServiceType = overloads.join(' & ');
  } else {
    getServiceType = '(name: string) -> ServiceDefinition';
  }

  // Build GetController type: intersection of per-controller overloads + fallback
  let getControllerType: string;
  if (controllers.length > 0) {
    const overloads = controllers.map(c => `((name: "${c.name}") -> ${c.name})`);
    overloads.push('((name: string) -> ControllerDefinition)');
    getControllerType = overloads.join(' & ');
  } else {
    getControllerType = '(name: string) -> ControllerDefinition';
  }

  const lines: string[] = [];
  lines.push('export type KoreAPI = {');
  lines.push('\t--- Sentinel symbol for server-to-client event remotes.');
  lines.push('\tNetEvent: Symbol,');
  lines.push('');
  lines.push('\t-- Re-exported modules');
  lines.push('\tPromise: any,');
  lines.push('\tSignal: SignalModule,');
  lines.push('\tLog: LogModule,');
  lines.push('\tTimer: TimerModule,');
  lines.push('\tSymbol: SymbolConstructor,');
  lines.push('\tTween: TweenModule,');
  lines.push('\tCurve: CurveModule,');
  lines.push('\tData: DataModule,');
  lines.push('\tThread: ThreadModule,');
  lines.push('\tMock: MockModule,');
  lines.push('\tJanitor: JanitorModule,');
  lines.push('\tUtil: UtilModule,');
  lines.push('\tNet: NetModule,');
  lines.push('\tTypes: any,');
  lines.push('\tFusion: any?,');
  lines.push('');
  lines.push('\t--- Set framework configuration. Must be called before `Start()`.');
  lines.push('\tConfigure: (config: KoreConfig) -> (),');
  lines.push('\t--- Register a service (server only).');
  lines.push('\tAddService: (serviceTable: ServiceDefinition) -> (),');
  lines.push('\t--- Register a controller (client only).');
  lines.push('\tAddController: (controllerTable: ControllerDefinition) -> (),');
  lines.push('\t--- Create and register a service with full IntelliSense. Returns T & ServiceFields.');
  lines.push('\tCreateService: <T>(serviceTable: T & { Name: string }) -> T & ServiceFields,');
  lines.push('\t--- Create and register a controller with full IntelliSense. Returns T & ControllerFields.');
  lines.push('\tCreateController: <T>(controllerTable: T & { Name: string }) -> T & ControllerFields,');
  lines.push('\t--- Retrieve a registered service by name. On the client, returns a network proxy.');
  lines.push(`\tGetService: ${getServiceType},`);
  lines.push('\t--- Retrieve a registered controller by name (client only).');
  lines.push(`\tGetController: ${getControllerType},`);
  lines.push('\t--- Boot the framework. Returns a Promise that resolves when all lifecycle methods complete.');
  lines.push('\tStart: () -> any, -- Promise<void>');
  lines.push('\t--- Dynamically destroy and unregister a service. Requires `Destroy = "dynamic"` config.');
  lines.push('\tDestroyService: (name: string) -> (),');
  lines.push('\t--- Dynamically destroy and unregister a controller. Requires `Destroy = "dynamic"` config.');
  lines.push('\tDestroyController: (name: string) -> (),');
  lines.push('}');

  return lines.join('\n');
}

/**
 * Build the typed return table so every exported type is accessible
 * via `Types.TypeName` when the module is required.
 */
function buildReturnTable(services: ServiceInfo[], controllers: ControllerInfo[]): string {
  // Static framework types — always present
  const staticTypes = [
    'Symbol', 'SymbolConstructor',
    'TaggedLogger', 'LogLevel', 'LogModule',
    'SignalConnection', 'SignalConfig', 'SignalModule',
    'JanitorTask', 'Janitor', 'JanitorModule',
    'CancelFn', 'TimerModule',
    'TweenBuilder', 'TweenModule',
    'Keyframe', 'CurveInstance', 'CurveModule',
    'DataConfig', 'Profile', 'DataModule',
    'ThreadPool', 'ThreadKernel', 'ThreadModule',
    'MockModule',
    'ProxyResolveFn', 'ProxyModule',
    'NamedModule', 'LoaderModule',
    'MiddlewareDef', 'MiddlewareFn',
    'RateLimitConfig', 'CompressionStrategy', 'CompressionConfig',
    'Batcher', 'BatchEntry',
    'ClientEventProxy', 'NetEventType', 'NetModule',
    'TableUtil', 'StringUtil', 'MathUtil', 'UtilModule',
    'KoreLogConfig', 'KoreConfig',
    'ContextType', 'ClientTable',
    'ServiceFields', 'ControllerFields',
    'ServiceDefinition', 'ControllerDefinition',
    'KoreAPI',
  ];

  const entries: string[] = staticTypes.map(t => `\t${t}: ${t}`);

  // Generic types need a concrete instantiation
  entries.push('\tSignal: Signal<...any>');
  entries.push('\tMockHandle: MockHandle<any>');
  entries.push('\tDiffResult: DiffResult<any, any>');

  // Auto-generated service types
  for (const s of services) {
    entries.push(`\t${s.name}: ${s.name}`);
    entries.push(`\t${s.name}Client: ${s.name}Client`);
  }

  // Auto-generated controller types
  for (const c of controllers) {
    entries.push(`\t${c.name}: ${c.name}`);
  }

  return `return {} :: {\n${entries.join(',\n')},\n}`;
}

export function generateTypes(): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  lines.push('-- Kore.Types \u2014 Central type definitions for the Kore framework');
  lines.push('-- Provides comprehensive type annotations for full intellisense support.');
  lines.push('-- AUTOGENERATED BY KORE EXTENSION \u2014 manual edits may be overwritten.');
  lines.push(`-- Last updated: ${timestamp}`);
  lines.push('');

  // Full framework type definitions (everything up to KoreAPI placeholder)
  lines.push(FRAMEWORK_TYPES);
  lines.push('');

  // ── Auto-generated per-service types ───────────────────────────────
  const services = serviceRegistry.getAll();
  if (services.length > 0) {
    lines.push('-- ──────────────────────────────────────────────────────────────────────');
    lines.push('-- Auto-generated service types');
    lines.push('-- ──────────────────────────────────────────────────────────────────────');
    lines.push('');
    for (const service of services) {
      lines.push(generateServiceType(service));
      lines.push('');
      lines.push(generateServiceClientType(service));
      lines.push('');
    }
  }

  // ── Auto-generated per-controller types ────────────────────────────
  const controllers = controllerRegistry.getAll();
  if (controllers.length > 0) {
    lines.push('-- ──────────────────────────────────────────────────────────────────────');
    lines.push('-- Auto-generated controller types');
    lines.push('-- ──────────────────────────────────────────────────────────────────────');
    lines.push('');
    for (const controller of controllers) {
      lines.push(generateControllerType(controller));
      lines.push('');
    }
  }

  // ── KoreAPI type (dynamic — includes GetService/GetController overloads) ──
  lines.push('-- ──────────────────────────────────────────────────────────────────────');
  lines.push('-- Kore API');
  lines.push('-- ──────────────────────────────────────────────────────────────────────');
  lines.push('');
  lines.push(buildKoreAPIType());
  lines.push('');

  // ── Typed return table — every exported type referenced ────────────
  lines.push(buildReturnTable(services, controllers));
  lines.push('');

  return lines.join('\n');
}
