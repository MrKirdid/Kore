-- examples/Networking/NetworkService.luau
-- Demonstrates Client remotes, middleware, rate limiting, and batching.

local Kore = require(game.ReplicatedStorage.Shared.Packages.kore)

local NetworkService = Kore.CreateService({
	Name = "NetworkService",
})

NetworkService.Client = {
	-- RemoteFunction: returns a value -> client gets a Promise
	GetPlayerData = function(self, player, key)
		return { key = key, value = math.random(1, 100) }
	end,

	-- RemoteEvent: returns nothing -> fire and forget
	LogAction = function(self, player, action)
		self.Log.Info("%s performed action: %s", player.Name, action)
	end,

	-- Server-to-client event
	Notification = Kore.NetEvent,

	-- Middleware
	Middleware = {
		GetPlayerData = {
			Inbound = function(player, key)
				-- Validate the key
				if type(key) ~= "string" then
					return -- drops the call
				end
				return key
			end,
			Outbound = function(player, result)
				-- Add timestamp to result
				result.timestamp = os.clock()
				return result
			end,
		},
	},

	-- Rate limiting
	RateLimit = {
		GetPlayerData = { MaxCalls = 10, PerSeconds = 1 },
		LogAction = { MaxCalls = 5, PerSeconds = 1 },
	},

	-- Batch all remote calls within the same frame
	Batching = true,
}

function NetworkService:Init(ctx) end

function NetworkService:Start(ctx)
	-- Send a notification to all clients every 30 seconds
	Kore.Timer.Every(30, function()
		self:FireAllClients("Notification", "Server tick: " .. os.clock())
	end)
end

return NetworkService
