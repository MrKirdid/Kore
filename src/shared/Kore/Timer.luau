-- Kore.Timer — Debounce, Throttle, Delay, Every, and scheduler wrappers

local RunService = game:GetService("RunService")

local Timer = {}

function Timer.Debounce(fn, t)
	local scheduled = nil
	return function(...)
		if scheduled then
			task.cancel(scheduled)
		end
		local args = table.pack(...)
		scheduled = task.delay(t, function()
			scheduled = nil
			fn(table.unpack(args, 1, args.n))
		end)
	end
end

function Timer.Throttle(fn, t)
	local lastCall = 0
	return function(...)
		local now = os.clock()
		if now - lastCall >= t then
			lastCall = now
			fn(...)
		end
	end
end

function Timer.Delay(t, fn)
	local cancelled = false
	task.delay(t, function()
		if not cancelled then
			fn()
		end
	end)
	return function()
		cancelled = true
	end
end

function Timer.Every(t, fn)
	local running = true
	task.spawn(function()
		while running do
			fn()
			task.wait(t)
		end
	end)
	return function()
		running = false
	end
end

function Timer.Heartbeat(fn)
	return RunService.Heartbeat:Connect(fn)
end

function Timer.Stepped(fn)
	return RunService.Stepped:Connect(fn)
end

function Timer.RenderStepped(fn)
	if not RunService:IsClient() then
		warn("[Kore.Timer] RenderStepped is only available on the client")
		return nil
	end
	return RunService.RenderStepped:Connect(fn)
end

return Timer
