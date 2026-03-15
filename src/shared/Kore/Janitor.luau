-- Kore.Janitor — Re-export of howmanysmall/janitor

local Packages = game:GetService("ReplicatedStorage"):FindFirstChild("Packages")

local ok, Janitor = pcall(function()
	return require(Packages and Packages:FindFirstChild("janitor") or error("not found"))
end)

if ok then
	return Janitor
end

-- Minimal fallback if janitor package is not available
local JanitorFallback = {}
JanitorFallback.__index = JanitorFallback

function JanitorFallback.new()
	return setmetatable({
		_tasks = {},
	}, JanitorFallback)
end

function JanitorFallback:Add(task, methodName, index)
	local entry = { task = task, method = methodName or "Destroy" }
	if index then
		self._tasks[index] = entry
	else
		table.insert(self._tasks, entry)
	end
	return task
end

function JanitorFallback:Remove(index)
	self._tasks[index] = nil
end

function JanitorFallback:Cleanup()
	for i = #self._tasks, 1, -1 do
		local entry = self._tasks[i]
		if entry then
			local task = entry.task
			if type(task) == "function" then
				task()
			elseif typeof(task) == "RBXScriptConnection" then
				task:Disconnect()
			elseif type(task) == "table" and type(task[entry.method]) == "function" then
				task[entry.method](task)
			elseif typeof(task) == "Instance" then
				task:Destroy()
			end
		end
	end
	table.clear(self._tasks)
end

function JanitorFallback:Destroy()
	self:Cleanup()
end

return JanitorFallback
