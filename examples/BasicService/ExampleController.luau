-- examples/BasicService/ExampleController.luau
-- A minimal controller that consumes ExampleService.

local Kore = require(game.ReplicatedStorage.Shared.Packages.kore)

local ExampleController = Kore.CreateController({
	Name = "ExampleController",
	Dependencies = { "ExampleService" },
})

function ExampleController:Init(ctx)
	ctx.Log.Info("Initializing ExampleController")
end

function ExampleController:Start(ctx)
	local ExampleService = ctx.Kore.GetService("ExampleService")

	ExampleService.GetGreeting():andThen(function(greeting)
		ctx.Log.Info("Got greeting: %s", greeting)
	end)

	ExampleService.Announcement:Connect(function(message)
		ctx.Log.Info("Announcement: %s", message)
	end)
end

return ExampleController
