-- examples/DataStore/DataService.luau
-- Demonstrates Kore.Data for ProfileStore integration.

local Kore = require(game.ReplicatedStorage.Shared.Kore)
local Players = game:GetService("Players")

return {
	Name = "DataService",

	Config = {
		StoreName = "PlayerData",
		Template = {
			Coins = 0,
			Level = 1,
			Inventory = {},
		},
	},

	Client = {
		GetCoins = function(self, player)
			local profile = Kore.Data.Get(player)
			if profile then
				return profile.Data.Coins
			end
			return 0
		end,

		CoinsUpdated = Kore.NetEvent,
	},

	Init = function(self, ctx)
		Kore.Data.Configure({
			StoreName = ctx.Config.StoreName,
			Template = ctx.Config.Template,
		})
	end,

	Start = function(self, ctx)
		Players.PlayerAdded:Connect(function(player)
			Kore.Data
				.Load(player)
				:andThen(function(profile)
					ctx.Log.Info("Loaded profile for %s", player.Name)
				end)
				:catch(function(err)
					ctx.Log.Warn("Failed to load profile for %s: %s", player.Name, tostring(err))
				end)
		end)
	end,
}
