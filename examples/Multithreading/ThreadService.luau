-- examples/Multithreading/ThreadService.luau
-- Demonstrates Kore.Thread for parallel Luau execution via Weave.

local Kore = require(game.ReplicatedStorage.Shared.Packages.kore)

local ThreadService = Kore.CreateService({
	Name = "ThreadService",
})

function ThreadService:Init(ctx)
	-- Create a pool of 16 worker Actors
	local Workers = game:GetService("ServerScriptService").Thread.Workers
	self._pool = Kore.Thread.Pool(16, Workers.ComputeWorker)
end

function ThreadService:Start(ctx)
	-- Dispatch computation across workers
	self._pool
		:Dispatch("compute", 1000)
		:andThen(function(results)
			ctx.Log.Info("Computation complete: %d results", #results)
		end)
		:catch(function(err)
			ctx.Log.Warn("Computation failed: %s", tostring(err))
		end)

	-- Fire and forget dispatch
	self._pool:DispatchDetached("update", 500)
end

return ThreadService
