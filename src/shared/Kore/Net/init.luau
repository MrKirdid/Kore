-- Kore.Net — Automatic remote generation and networking

local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local Log = require(script.Parent.Log)
local Middleware = require(script.Middleware)
local RateLimitMod = require(script.RateLimit)
local Compression = require(script.Compression)
local Batcher = require(script.Batcher)

local IS_SERVER = RunService:IsServer()

local Net = {}
Net._remotes = {} -- [serviceName] = { [remoteName] = RemoteInstance }
Net._remoteFolder = nil

local function getRemoteFolder()
	if Net._remoteFolder then
		return Net._remoteFolder
	end

	if IS_SERVER then
		local folder = Instance.new("Folder")
		folder.Name = "KoreRemotes"
		folder.Parent = game:GetService("ReplicatedStorage")
		Net._remoteFolder = folder
		return folder
	else
		local folder = game:GetService("ReplicatedStorage"):WaitForChild("KoreRemotes", 30)
		if not folder then
			Log.Warn("Kore.Net", "KoreRemotes folder not found — server may not have started")
		end
		Net._remoteFolder = folder
		return folder
	end
end

local function getServiceFolder(serviceName)
	local root = getRemoteFolder()
	if not root then
		return nil
	end

	if IS_SERVER then
		local folder = root:FindFirstChild(serviceName)
		if not folder then
			folder = Instance.new("Folder")
			folder.Name = serviceName
			folder.Parent = root
		end
		return folder
	else
		return root:WaitForChild(serviceName, 15)
	end
end

-- SERVER: Create remotes for a service's Client table
function Net.SetupServerRemotes(service)
	if not IS_SERVER then
		return
	end

	local clientTable = service.Client
	if not clientTable then
		return
	end

	local serviceName = service.Name
	local folder = getServiceFolder(serviceName)
	Net._remotes[serviceName] = {}

	local middlewareDefs = clientTable.Middleware or {}
	local rateLimitDefs = clientTable.RateLimit or {}

	for key, value in pairs(clientTable) do
		if key == "Middleware" or key == "RateLimit" or key == "Batching" then
			continue
		end

		-- Determine type of remote
		local handler = value
		local isUnreliable = false
		local isImmediate = false

		if type(value) == "table" and value._isSymbol then
			-- Kore.NetEvent sentinel — server-to-client event remote
			local remote = Instance.new("RemoteEvent")
			remote.Name = key
			remote.Parent = folder
			Net._remotes[serviceName][key] = remote
			continue
		end

		if type(value) == "table" and value.fn then
			handler = value.fn
			isUnreliable = value.Unreliable == true
			isImmediate = value.Immediate == true
		end

		if type(handler) ~= "function" then
			continue
		end

		local mw = middlewareDefs[key]
		local rl = rateLimitDefs[key]

		if isUnreliable then
			local remote = Instance.new("UnreliableRemoteEvent")
			remote.Name = key
			remote.Parent = folder
			Net._remotes[serviceName][key] = remote

			remote.OnServerEvent:Connect(function(player, ...)
				if not RateLimitMod.Check(serviceName .. "." .. key, player, rl) then
					return
				end

				local pass, a1, a2, a3, a4, a5, a6, a7, a8 = Middleware.RunInbound(mw, player, ...)
				if not pass then
					return
				end

				handler(service, player, a1, a2, a3, a4, a5, a6, a7, a8)
			end)
		else
			-- Determine if it's a RemoteFunction (returns value) or RemoteEvent
			-- We use RemoteFunction for all methods, and fire-and-forget via OnServerEvent
			-- Convention: all methods become RemoteFunctions for Promise support
			local remote = Instance.new("RemoteFunction")
			remote.Name = key
			remote.Parent = folder
			Net._remotes[serviceName][key] = remote

			remote.OnServerInvoke = function(player, ...)
				if not RateLimitMod.Check(serviceName .. "." .. key, player, rl) then
					return nil
				end

				local pass, a1, a2, a3, a4, a5, a6, a7, a8 = Middleware.RunInbound(mw, player, ...)
				if not pass then
					return nil
				end

				local ok, result = pcall(handler, service, player, a1, a2, a3, a4, a5, a6, a7, a8)
				if not ok then
					Log.ErrorNoThrow(serviceName, "Client method '%s' error: %s", key, tostring(result))
					if RunService:IsStudio() then
						error(string.format("[%s.Client.%s] %s", serviceName, key, tostring(result)))
					end
					return nil
				end

				result = Middleware.RunOutbound(mw, player, result)
				return result
			end
		end
	end

	-- Setup FireClient and FireAllClients helpers on the service
	service.FireClient = function(self, eventName, player, ...)
		local remote = Net._remotes[serviceName] and Net._remotes[serviceName][eventName]
		if remote and remote:IsA("RemoteEvent") then
			remote:FireClient(player, ...)
		elseif remote and remote:IsA("UnreliableRemoteEvent") then
			remote:FireClient(player, ...)
		end
	end

	service.FireAllClients = function(self, eventName, ...)
		local remote = Net._remotes[serviceName] and Net._remotes[serviceName][eventName]
		if remote and remote:IsA("RemoteEvent") then
			remote:FireAllClients(...)
		elseif remote and remote:IsA("UnreliableRemoteEvent") then
			remote:FireAllClients(...)
		end
	end

	-- Cleanup rate limit data when player leaves
	Players.PlayerRemoving:Connect(function(player)
		RateLimitMod.ClearPlayer(player)
	end)
end

-- CLIENT: Create a client proxy that wraps remote calls in Promises
function Net.CreateClientProxy(serviceName, Promise)
	if IS_SERVER then
		return nil
	end

	local folder = getServiceFolder(serviceName)
	if not folder then
		Log.Warn("Kore.Net", "Service folder for '%s' not found on client", serviceName)
		return nil
	end

	local proxy = {}

	for _, remote in ipairs(folder:GetChildren()) do
		local remoteName = remote.Name

		if remote:IsA("RemoteFunction") then
			proxy[remoteName] = function(...)
				return Promise.new(function(resolve, reject)
					local ok, result = pcall(remote.InvokeServer, remote, ...)
					if ok then
						resolve(result)
					else
						reject(result)
					end
				end)
			end
		elseif remote:IsA("RemoteEvent") then
			-- Expose as a Signal-like object
			local connections = {}
			proxy[remoteName] = {
				Connect = function(_, fn)
					local conn = remote.OnClientEvent:Connect(fn)
					table.insert(connections, conn)
					return conn
				end,
				Once = function(_, fn)
					return remote.OnClientEvent:Once(fn)
				end,
				Wait = function(_)
					return remote.OnClientEvent:Wait()
				end,
				DisconnectAll = function(_)
					for _, conn in ipairs(connections) do
						conn:Disconnect()
					end
					table.clear(connections)
				end,
			}
		elseif remote:IsA("UnreliableRemoteEvent") then
			proxy[remoteName] = function(...)
				remote:FireServer(...)
			end
		end
	end

	return proxy
end

-- Remove remotes for a destroyed service
function Net.DestroyServiceRemotes(serviceName)
	local folder = getRemoteFolder()
	if folder then
		local serviceFolder = folder:FindFirstChild(serviceName)
		if serviceFolder then
			serviceFolder:Destroy()
		end
	end
	Net._remotes[serviceName] = nil
end

function Net.SetCompression(config)
	Compression.SetStrategy(config)
end

return Net
