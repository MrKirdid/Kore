-- examples/Multithreading/ComputeWorker.luau
-- Worker script for parallel computation.

local Kore = require(game.ReplicatedStorage.Shared.Kore)

local kernel = Kore.Thread.Kernel(script)

kernel:On("compute", function(id)
	-- Simulate heavy computation
	local result = 0
	for i = 1, 10000 do
		result = result + math.sin(id * i)
	end
	return result
end)

kernel:OnDetached("update", function(id)
	-- Fire-and-forget work
end)

kernel:Ready()
