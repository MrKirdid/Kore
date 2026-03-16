-- examples/Testing/TestExample.spec.luau
-- Demonstrates testing a service in isolation with Kore.Mock.

local Kore = require(game.ReplicatedStorage.Shared.Packages.kore)

return function()
	describe("ExampleService", function()
		local mock

		beforeEach(function()
			mock = Kore.Mock.Service({
				Name = "ExampleService",

				Config = {
					Greeting = "Test greeting",
				},

				Client = {
					GetGreeting = function(self, player)
						return self.Config.Greeting
					end,
				},

				Init = function(self, ctx) end,

				Start = function(self, ctx) end,
			})
		end)

		afterEach(function()
			mock:Destroy()
		end)

		it("should initialize without errors", function()
			expect(function()
				mock:Init()
			end).never.to.throw()
		end)

		it("should start without errors", function()
			mock:Init()
			expect(function()
				mock:Start()
			end).never.to.throw()
		end)

		it("should return the configured greeting", function()
			mock:Init()
			mock:Start()

			local service = mock:Get()
			local result = service.Client.GetGreeting(service, { Name = "TestPlayer" })
			expect(result).to.equal("Test greeting")
		end)

		it("should allow dependency injection", function()
			mock:Inject("OtherService", {
				SomeMethod = function()
					return "injected"
				end,
			})

			mock:Init()
		end)
	end)
end
