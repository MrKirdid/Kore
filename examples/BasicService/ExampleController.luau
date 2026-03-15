-- examples/BasicService/ExampleController.luau
-- A minimal controller that consumes ExampleService.

return {
	Name = "ExampleController",
	Dependencies = { "ExampleService" },

	Init = function(self, ctx)
		ctx.Log.Info("Initializing ExampleController")
	end,

	Start = function(self, ctx)
		local ExampleService = ctx.Kore.GetService("ExampleService")

		ExampleService.GetGreeting():andThen(function(greeting)
			ctx.Log.Info("Got greeting: %s", greeting)
		end)

		ExampleService.Announcement:Connect(function(message)
			ctx.Log.Info("Announcement: %s", message)
		end)
	end,
}
