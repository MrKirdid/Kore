-- examples/BasicService/ExampleService.luau
-- A minimal service demonstrating the basic Kore service structure.

local Kore = require(game.ReplicatedStorage.Shared.Packages.kore)

local ExampleService = Kore.CreateService({
	Name = "ExampleService",

	Config = {
		Greeting = "Hello from ExampleService!",
	},
})

ExampleService.Client = {
	GetGreeting = function(self, player)
		return self.Config.Greeting
	end,

	Announcement = Kore.NetEvent,
}

function ExampleService:Init(ctx)
	ctx.Log.Info("Initializing with greeting: %s", self.Config.Greeting)
end

function ExampleService:Start(ctx)
	ctx.Log.Info("Started!")

	-- Fire an event to all clients after 5 seconds
	Kore.Timer.Delay(5, function()
		self:FireAllClients("Announcement", "Server has been running for 5 seconds!")
	end)
end

return ExampleService
