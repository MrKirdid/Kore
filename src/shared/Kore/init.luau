-- Kore — Professional Roblox Luau game framework
-- Version 0.1.0

local RunService = game:GetService("RunService")

local IS_SERVER = RunService:IsServer()

local Symbol = require(script.Symbol)
local Log = require(script.Log)
local Proxy = require(script.Proxy)
local Loader = require(script.Loader)
local Net = require(script.Net)
local Signal = require(script.Signal)
local Timer = require(script.Timer)
local Tween = require(script.Tween)
local Curve = require(script.Curve)
local Data = require(script.Data)
local Thread = require(script.Thread)
local Mock = require(script.Mock)
local Janitor = require(script.Janitor)
local Util = require(script.Util)

local Packages = game:GetService("ReplicatedStorage"):FindFirstChild("Packages")
local Promise = require(Packages and Packages:FindFirstChild("promise") or script.Promise)

-- ──────────────────────────────────────────────────────────────────────
-- State
-- ──────────────────────────────────────────────────────────────────────

local services = {} -- [name] = service instance
local controllers = {} -- [name] = controller instance
local proxies = {} -- [name] = { proxy, resolve }
local clientProxies = {} -- [name] = client proxy (client-side)

local started = false
local configured = false

local config = {
	Debug = false,
	Destroy = "shutdown",
	Log = {
		DiscordWebhook = nil,
	},
}

-- ──────────────────────────────────────────────────────────────────────
-- Kore API
-- ──────────────────────────────────────────────────────────────────────

local Kore = {}

-- Sentinel value for server-to-client event remotes
Kore.NetEvent = Symbol("NetEvent")

-- Re-exports
Kore.Promise = Promise
Kore.Signal = Signal
Kore.Log = Log
Kore.Timer = Timer
Kore.Symbol = Symbol
Kore.Tween = Tween
Kore.Curve = Curve
Kore.Data = Data
Kore.Thread = Thread
Kore.Mock = Mock
Kore.Janitor = Janitor
Kore.Util = Util
Kore.Net = Net
Kore.Types = require(script.Types)

-- Optional re-exports (may not be available)
pcall(function()
	Kore.Fusion = require(script.Fusion)
end)

-- ──────────────────────────────────────────────────────────────────────
-- Configuration
-- ──────────────────────────────────────────────────────────────────────

function Kore.Configure(userConfig)
	if started then
		error("[Kore] Configure() must be called before Start()", 2)
	end

	if userConfig.Debug ~= nil then
		config.Debug = userConfig.Debug
		if config.Debug then
			Log.EnableDebug()
		end
	end

	if userConfig.Destroy ~= nil then
		config.Destroy = userConfig.Destroy
	end

	if userConfig.Log then
		if userConfig.Log.DiscordWebhook then
			config.Log.DiscordWebhook = userConfig.Log.DiscordWebhook
			Log.Debug("Kore", "Discord webhook configured (not yet implemented)")
		end
	end

	configured = true
end

-- ──────────────────────────────────────────────────────────────────────
-- Registration
-- ──────────────────────────────────────────────────────────────────────

local function createJanitor()
	return Janitor.new()
end

local function setupServiceInstance(svc)
	svc.Janitor = svc.Janitor or createJanitor()
	svc.Log = Log.Tagged(svc.Name)
end

function Kore.AddService(serviceTable)
	if not IS_SERVER then
		error("[Kore] AddService() can only be called on the server", 2)
	end

	if not serviceTable.Name then
		error("[Kore] Service is missing a Name field", 2)
	end

	if services[serviceTable.Name] then
		error("[Kore] Duplicate service name: " .. serviceTable.Name, 2)
	end

	setupServiceInstance(serviceTable)
	services[serviceTable.Name] = serviceTable

	Log.Debug("Kore", "Registered service: %s", serviceTable.Name)
end

function Kore.AddController(controllerTable)
	if IS_SERVER then
		error("[Kore] AddController() can only be called on the client", 2)
	end

	if not controllerTable.Name then
		error("[Kore] Controller is missing a Name field", 2)
	end

	if controllers[controllerTable.Name] then
		error("[Kore] Duplicate controller name: " .. controllerTable.Name, 2)
	end

	controllerTable.Janitor = controllerTable.Janitor or createJanitor()
	controllerTable.Log = Log.Tagged(controllerTable.Name)
	controllers[controllerTable.Name] = controllerTable

	Log.Debug("Kore", "Registered controller: %s", controllerTable.Name)
end

-- ──────────────────────────────────────────────────────────────────────
-- Retrieval
-- ──────────────────────────────────────────────────────────────────────

function Kore.GetService(name)
	-- Server: return real service or proxy during Init
	if IS_SERVER then
		local svc = services[name]
		if svc then
			return svc
		end

		-- During Init, return a proxy
		if not started then
			if proxies[name] then
				return proxies[name].proxy
			end

			local proxy, resolve = Proxy.create(name)
			proxies[name] = { proxy = proxy, resolve = resolve }
			Log.Debug("Kore", "Created proxy for undeclared GetService('%s') during Init", name)
			return proxy
		end

		error("[Kore] Unknown service: " .. tostring(name), 2)
	end

	-- Client: return client proxy
	if clientProxies[name] then
		return clientProxies[name]
	end

	if not started then
		-- During init, create a proxy
		if proxies[name] then
			return proxies[name].proxy
		end

		local proxy, resolve = Proxy.create(name)
		proxies[name] = { proxy = proxy, resolve = resolve }
		return proxy
	end

	error("[Kore] Unknown service: " .. tostring(name), 2)
end

function Kore.GetController(name)
	if IS_SERVER then
		error("[Kore] GetController() can only be called on the client", 2)
	end

	local ctrl = controllers[name]
	if ctrl then
		return ctrl
	end

	if not started then
		if proxies[name] then
			return proxies[name].proxy
		end

		local proxy, resolve = Proxy.create(name)
		proxies[name] = { proxy = proxy, resolve = resolve }
		return proxy
	end

	error("[Kore] Unknown controller: " .. tostring(name), 2)
end

-- ──────────────────────────────────────────────────────────────────────
-- Boot
-- ──────────────────────────────────────────────────────────────────────

function Kore.Start()
	if started then
		return Promise.reject("[Kore] Already started")
	end

	return Promise.new(function(resolve, reject)
		local ok, err = pcall(function()
			if IS_SERVER then
				Kore._startServer()
			else
				Kore._startClient()
			end
		end)

		if ok then
			started = true
			resolve()
		else
			reject(err)
		end
	end)
end

function Kore._startServer()
	local startTime = os.clock()

	-- Auto-discover services if none registered
	if next(services) == nil then
		local servicesFolder = game:GetService("ServerScriptService"):FindFirstChild("Services")
		if servicesFolder then
			local discovered = Loader.DiscoverModules(servicesFolder)
			for _, svc in ipairs(discovered) do
				if not services[svc.Name] then
					setupServiceInstance(svc)
					services[svc.Name] = svc
				end
			end
		end
	end

	-- Build module list for topo sort
	local moduleList = {}
	for _, svc in pairs(services) do
		table.insert(moduleList, svc)
	end

	-- Topological sort
	local sorted = Loader.TopologicalSort(moduleList)

	if config.Debug then
		local order = {}
		for _, svc in ipairs(sorted) do
			table.insert(order, svc.Name)
		end
		Log.Debug("Kore", "Dependency resolution order: %s", table.concat(order, " -> "))
	end

	-- Init phase (synchronous, in dependency order)
	for _, svc in ipairs(sorted) do
		if svc.Init then
			local initStart = os.clock()

			-- Inject declared dependencies
			if svc.Dependencies then
				for _, depName in ipairs(svc.Dependencies) do
					if services[depName] then
						svc[depName] = services[depName]
					end
				end
			end

			local ctx = {
				Log = svc.Log,
				Kore = Kore,
				Config = svc.Config,
			}

			-- Detect yielding
			local initThread = coroutine.create(function()
				svc:Init(ctx)
			end)

			local success, result = coroutine.resume(initThread)
			if not success then
				error(string.format("[Kore] %s.Init() error: %s", svc.Name, tostring(result)), 0)
			end

			if coroutine.status(initThread) ~= "dead" then
				Log.Warn("Kore", "%s.Init() yielded — this is not allowed and may cause issues", svc.Name)
				-- Wait for it to complete anyway
				task.spawn(initThread)
			end

			if config.Debug then
				Log.Debug("Kore", "%s.Init() completed in %.3fms", svc.Name, (os.clock() - initStart) * 1000)
			end
		end

		-- Resolve any proxies for this service
		if proxies[svc.Name] then
			proxies[svc.Name].resolve(svc)
			Log.Debug("Kore", "Resolved proxy for '%s'", svc.Name)
		end
	end

	-- Setup remotes for all services
	for _, svc in ipairs(sorted) do
		Net.SetupServerRemotes(svc)
	end

	-- Start phase (concurrent, yielding allowed)
	local startPromises = {}
	for _, svc in ipairs(sorted) do
		if svc.Start then
			table.insert(
				startPromises,
				Promise.new(function(resolveStart)
					local ctx = {
						Log = svc.Log,
						Kore = Kore,
						Config = svc.Config,
					}

					local startStartTime = os.clock()
					svc:Start(ctx)

					if config.Debug then
						Log.Debug(
							"Kore",
							"%s.Start() completed in %.3fms",
							svc.Name,
							(os.clock() - startStartTime) * 1000
						)
					end

					resolveStart()
				end)
			)
		end
	end

	if #startPromises > 0 then
		Promise.all(startPromises):await()
	end

	if config.Debug then
		Log.Debug("Kore", "Server started in %.3fms (%d services)", (os.clock() - startTime) * 1000, #sorted)
	end
end

function Kore._startClient()
	local startTime = os.clock()

	-- Auto-discover controllers
	if next(controllers) == nil then
		local controllersFolder = game:GetService("Players").LocalPlayer
			and game:GetService("Players").LocalPlayer:WaitForChild("PlayerScripts", 10)

		if controllersFolder then
			local ctrlFolder = controllersFolder:FindFirstChild("Controllers")
			if ctrlFolder then
				local discovered = Loader.DiscoverModules(ctrlFolder)
				for _, ctrl in ipairs(discovered) do
					if not controllers[ctrl.Name] then
						ctrl.Janitor = ctrl.Janitor or createJanitor()
						ctrl.Log = Log.Tagged(ctrl.Name)
						controllers[ctrl.Name] = ctrl
					end
				end
			end
		end
	end

	-- Build client proxies for services (from remotes)
	local remotesFolder = game:GetService("ReplicatedStorage"):WaitForChild("KoreRemotes", 30)
	if remotesFolder then
		for _, serviceFolder in ipairs(remotesFolder:GetChildren()) do
			clientProxies[serviceFolder.Name] = Net.CreateClientProxy(serviceFolder.Name, Promise)
		end
	end

	-- Resolve service proxies
	for name, proxyData in pairs(proxies) do
		if clientProxies[name] then
			proxyData.resolve(clientProxies[name])
		elseif controllers[name] then
			proxyData.resolve(controllers[name])
		end
	end

	-- Build module list for topo sort
	local moduleList = {}
	for _, ctrl in pairs(controllers) do
		table.insert(moduleList, ctrl)
	end

	local sorted = Loader.TopologicalSort(moduleList)

	if config.Debug then
		local order = {}
		for _, ctrl in ipairs(sorted) do
			table.insert(order, ctrl.Name)
		end
		Log.Debug("Kore", "Dependency resolution order: %s", table.concat(order, " -> "))
	end

	-- Init phase
	for _, ctrl in ipairs(sorted) do
		if ctrl.Init then
			local initStart = os.clock()

			if ctrl.Dependencies then
				for _, depName in ipairs(ctrl.Dependencies) do
					if controllers[depName] then
						ctrl[depName] = controllers[depName]
					elseif clientProxies[depName] then
						ctrl[depName] = clientProxies[depName]
					end
				end
			end

			local ctx = {
				Log = ctrl.Log,
				Kore = Kore,
				Config = ctrl.Config,
			}

			local initThread = coroutine.create(function()
				ctrl:Init(ctx)
			end)

			local success, result = coroutine.resume(initThread)
			if not success then
				error(string.format("[Kore] %s.Init() error: %s", ctrl.Name, tostring(result)), 0)
			end

			if coroutine.status(initThread) ~= "dead" then
				Log.Warn("Kore", "%s.Init() yielded — this is not allowed and may cause issues", ctrl.Name)
				task.spawn(initThread)
			end

			if config.Debug then
				Log.Debug("Kore", "%s.Init() completed in %.3fms", ctrl.Name, (os.clock() - initStart) * 1000)
			end
		end

		if proxies[ctrl.Name] then
			proxies[ctrl.Name].resolve(ctrl)
		end
	end

	-- Start phase
	local startPromises = {}
	for _, ctrl in ipairs(sorted) do
		if ctrl.Start then
			table.insert(
				startPromises,
				Promise.new(function(resolveStart)
					local ctx = {
						Log = ctrl.Log,
						Kore = Kore,
						Config = ctrl.Config,
					}

					local startStartTime = os.clock()
					ctrl:Start(ctx)

					if config.Debug then
						Log.Debug(
							"Kore",
							"%s.Start() completed in %.3fms",
							ctrl.Name,
							(os.clock() - startStartTime) * 1000
						)
					end

					resolveStart()
				end)
			)
		end
	end

	if #startPromises > 0 then
		Promise.all(startPromises):await()
	end

	if config.Debug then
		Log.Debug("Kore", "Client started in %.3fms (%d controllers)", (os.clock() - startTime) * 1000, #sorted)
	end
end

-- ──────────────────────────────────────────────────────────────────────
-- Dynamic Destroy
-- ──────────────────────────────────────────────────────────────────────

function Kore.DestroyService(name)
	if config.Destroy ~= "dynamic" then
		error("[Kore] DestroyService requires Configure({ Destroy = 'dynamic' })", 2)
	end

	local svc = services[name]
	if not svc then
		error("[Kore] Unknown service: " .. tostring(name), 2)
	end

	-- 1. Call Destroy() if defined
	if svc.Destroy then
		svc:Destroy()
	end

	-- 2. Clean janitor
	if svc.Janitor then
		svc.Janitor:Cleanup()
	end

	-- 3. Remove remotes
	Net.DestroyServiceRemotes(name)

	-- 4. Remove from registry
	services[name] = nil

	Log.Debug("Kore", "Destroyed service: %s", name)
end

function Kore.DestroyController(name)
	if config.Destroy ~= "dynamic" then
		error("[Kore] DestroyController requires Configure({ Destroy = 'dynamic' })", 2)
	end

	local ctrl = controllers[name]
	if not ctrl then
		error("[Kore] Unknown controller: " .. tostring(name), 2)
	end

	if ctrl.Destroy then
		ctrl:Destroy()
	end

	if ctrl.Janitor then
		ctrl.Janitor:Cleanup()
	end

	controllers[name] = nil

	Log.Debug("Kore", "Destroyed controller: %s", name)
end

return Kore
