-- Kore.Thread — Weave wrapper for parallel Luau execution
-- Experimental: Weave is currently in beta (0.10.0-beta.1)

local Log = require(script.Parent.Log)

local Packages = game:GetService("ReplicatedStorage"):FindFirstChild("Packages")
local Promise

local Thread = {}

local weave
local function getWeave()
	if weave then
		return weave
	end

	-- Try DevelopmentMaterial path first (dev), then Packages
	local ok, mod = pcall(function()
		local devWeave = game:GetService("ReplicatedStorage"):FindFirstChild("Shared")
		if devWeave then
			devWeave = devWeave:FindFirstChild("weave")
			if devWeave then
				return require(devWeave)
			end
		end

		-- Try packages
		if Packages then
			local pkg = Packages:FindFirstChild("weave")
			if pkg then
				return require(pkg)
			end
		end

		error("Weave not found")
	end)

	if ok then
		weave = mod
		return weave
	end

	Log.Warn("Kore.Thread", "Weave not available — Kore.Thread will not function")
	return nil
end

local function getPromise()
	if not Promise then
		Promise = require(Packages and Packages:FindFirstChild("promise") or script.Parent.Promise)
	end
	return Promise
end

-- Pool: dispatcher backed by N worker Actors
local Pool = {}
Pool.__index = Pool

function Thread.Pool(count, workerScript)
	local w = getWeave()
	if not w then
		error("[Kore.Thread] Weave is not available", 2)
	end

	local dispatcher = w.dispatcher.new(count, workerScript)

	return setmetatable({
		_dispatcher = dispatcher,
		_count = count,
	}, Pool)
end

function Pool:Dispatch(taskName, count)
	local P = getPromise()
	return P.new(function(resolve, reject)
		local ok, results = pcall(function()
			return self._dispatcher:dispatch(taskName, count)
		end)

		if ok then
			resolve(results)
		else
			reject(results)
		end
	end)
end

function Pool:DispatchDetached(taskName, count)
	pcall(function()
		self._dispatcher:dispatchDetached(taskName, count)
	end)
end

function Pool:Destroy()
	if self._dispatcher and self._dispatcher.destroy then
		self._dispatcher:destroy()
	end
end

-- Kernel: wraps a worker Actor
local Kernel = {}
Kernel.__index = Kernel

function Thread.Kernel(actor)
	local w = getWeave()
	if not w then
		error("[Kore.Thread] Weave is not available", 2)
	end

	local kernel = w.kernel.new(actor)

	return setmetatable({
		_kernel = kernel,
	}, Kernel)
end

function Kernel:On(taskName, handler)
	self._kernel:on(taskName, handler)
	return self
end

function Kernel:OnDetached(taskName, handler)
	self._kernel:onDetached(taskName, handler)
	return self
end

function Kernel:Ready()
	self._kernel:ready()
end

return Thread
