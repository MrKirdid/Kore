-- examples/DataStore/DataService.luau
-- Demonstrates Kore.Data for ProfileStore integration.

local Kore = require(game.ReplicatedStorage.Shared.Packages.kore)
local Players = game:GetService("Players")

local DataService = Kore.CreateService({
	Name = "DataService",

	Config = {
		StoreName = "PlayerData",
		Template = {
			Coins = 0,
			Level = 1,
			Inventory = {},
		},
	},
})

DataService.Client = {
	GetCoins = function(self, player)
		local profile = Kore.Data.Get(player)
		if profile then
			return profile.Data.Coins
		end
		return 0
	end,

	CoinsUpdated = Kore.NetEvent,
}

function DataService:Init(ctx)
	Kore.Data.Configure({
		StoreName = self.Config.StoreName,
		Template = self.Config.Template,
	})
end

function DataService:Start(ctx)
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
end

return DataService
