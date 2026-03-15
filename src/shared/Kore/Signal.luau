-- Kore.Signal — Lightweight signal with optional networking
-- Local by default. Opt-in networked via config table.

local RunService = game:GetService("RunService")

local Log = require(script.Parent.Log)

local IS_SERVER = RunService:IsServer()

local Signal = {}
Signal.__index = Signal

local Connection = {}
Connection.__index = Connection

function Connection.new(signal, fn)
	return setmetatable({
		_signal = signal,
		_fn = fn,
		_connected = true,
	}, Connection)
end

function Connection:Disconnect()
	if not self._connected then
		return
	end
	self._connected = false

	local listeners = self._signal._listeners
	for i, conn in ipairs(listeners) do
		if conn == self then
			table.remove(listeners, i)
			break
		end
	end
end

function Signal.new(config)
	local self = setmetatable({
		_listeners = {},
		_netListeners = {},
		_networked = false,
		_owner = nil,
		_remote = nil,
		_rateLimit = nil,
	}, Signal)

	if config and config.Network then
		self._networked = true
		self._owner = config.Owner or "Server"
		self._rateLimit = config.RateLimit

		-- Create the backing RemoteEvent
		if IS_SERVER then
			local remote = Instance.new("RemoteEvent")
			remote.Name = "KoreSignal_" .. tostring(self) .. "_" .. os.clock()
			remote.Parent = game:GetService("ReplicatedStorage")
			self._remote = remote

			if self._owner == "Client" or self._owner == "Both" then
				remote.OnServerEvent:Connect(function(player, ...)
					for _, conn in ipairs(self._netListeners) do
						if conn._connected then
							task.spawn(conn._fn, player, ...)
						end
					end
					-- Also fire local listeners
					for _, conn in ipairs(self._listeners) do
						if conn._connected then
							task.spawn(conn._fn, ...)
						end
					end
				end)
			end
		else
			-- Client: find remote
			task.spawn(function()
				-- Networked signals created server-side need discovery
				-- This is handled via the Net system for Client table signals
			end)
		end
	end

	return self
end

function Signal:Connect(fn)
	local conn = Connection.new(self, fn)
	table.insert(self._listeners, conn)
	return conn
end

function Signal:ConnectNet(fn)
	if not self._networked then
		Log.Warn("Kore.Signal", "ConnectNet called on a non-networked signal")
		return Signal.Connect(self, fn)
	end

	local conn = Connection.new(self, fn)
	table.insert(self._netListeners, conn)

	-- If client, connect to remote
	if not IS_SERVER and self._remote then
		local remoteConn = self._remote.OnClientEvent:Connect(function(...)
			if conn._connected then
				fn(...)
			end
		end)
		conn._remoteConnection = remoteConn

		local originalDisconnect = conn.Disconnect
		function conn:Disconnect()
			originalDisconnect(self)
			if self._remoteConnection then
				self._remoteConnection:Disconnect()
			end
		end
	end

	return conn
end

function Signal:Fire(...)
	-- Fire local listeners
	for _, conn in ipairs(self._listeners) do
		if conn._connected then
			task.spawn(conn._fn, ...)
		end
	end

	-- If networked, replicate
	if self._networked and self._remote then
		if IS_SERVER and (self._owner == "Server" or self._owner == "Both") then
			self._remote:FireAllClients(...)
		elseif not IS_SERVER and (self._owner == "Client" or self._owner == "Both") then
			self._remote:FireServer(...)
		end
	end
end

function Signal:FireClient(player, ...)
	if not IS_SERVER then
		Log.Warn("Kore.Signal", "FireClient can only be called from the server")
		return
	end

	if not self._networked or not self._remote then
		Log.Warn("Kore.Signal", "FireClient called on a non-networked signal")
		return
	end

	self._remote:FireClient(player, ...)
end

function Signal:FireAllClients(...)
	if not IS_SERVER then
		Log.Warn("Kore.Signal", "FireAllClients can only be called from the server")
		return
	end

	if not self._networked or not self._remote then
		Log.Warn("Kore.Signal", "FireAllClients called on a non-networked signal")
		return
	end

	self._remote:FireAllClients(...)
end

function Signal:Once(fn)
	local conn
	conn = self:Connect(function(...)
		conn:Disconnect()
		fn(...)
	end)
	return conn
end

function Signal:Wait()
	local thread = coroutine.running()
	local conn
	conn = self:Connect(function(...)
		conn:Disconnect()
		task.spawn(thread, ...)
	end)
	return coroutine.yield()
end

function Signal:DisconnectAll()
	for _, conn in ipairs(self._listeners) do
		conn._connected = false
	end
	table.clear(self._listeners)

	for _, conn in ipairs(self._netListeners) do
		conn._connected = false
		if conn._remoteConnection then
			conn._remoteConnection:Disconnect()
		end
	end
	table.clear(self._netListeners)
end

function Signal:Destroy()
	self:DisconnectAll()
	if self._remote then
		self._remote:Destroy()
		self._remote = nil
	end
end

return Signal
