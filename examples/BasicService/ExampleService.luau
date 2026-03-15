-- examples/BasicService/ExampleService.luau
-- A minimal service demonstrating the basic Kore service structure.

local Kore = require(game.ReplicatedStorage.Shared.Kore)

return {
	Name = "ExampleService",

	Config = {
		Greeting = "Hello from ExampleService!",
	},

	Client = {
		GetGreeting = function(self, player)
			return self.Config.Greeting
		end,

		Announcement = Kore.NetEvent,
	},

	Init = function(self, ctx)
		ctx.Log.Info("Initializing with greeting: %s", self.Config.Greeting)
	end,

	Start = function(self, ctx)
		ctx.Log.Info("Started!")

		-- Fire an event to all clients after 5 seconds
		Kore.Timer.Delay(5, function()
			self:FireAllClients("Announcement", "Server has been running for 5 seconds!")
		end)
	end,
}
