-- Kore.Proxy — Transparent proxy with queued method calls
-- Used during Init() phase for services not yet initialized.

local Log = require(script.Parent.Log)

local Proxy = {}

local QUEUE_WARN_THRESHOLD = 100

function Proxy.create(name)
	local queue = {}
	local resolved = false
	local realTarget = nil

	local proxy = setmetatable({}, {
		__index = function(_, key)
			if resolved then
				return realTarget[key]
			end

			-- Return a function that queues the call
			return function(_, ...)
				if resolved then
					return realTarget[key](realTarget, ...)
				end

				local args = table.pack(...)
				table.insert(queue, { method = key, args = args })

				if #queue > QUEUE_WARN_THRESHOLD then
					Log.Warn("Kore", "Proxy queue for '%s' exceeds %d entries", name, QUEUE_WARN_THRESHOLD)
				end
			end
		end,

		__tostring = function()
			return "KoreProxy<" .. name .. ">"
		end,
	})

	local function resolve(target)
		if resolved then
			return
		end
		resolved = true
		realTarget = target

		-- Flush queued calls
		if #queue > 0 then
			Log.Debug("Kore", "Flushing %d queued calls for '%s'", #queue, name)
		end

		for _, entry in ipairs(queue) do
			local method = target[entry.method]
			if method then
				method(target, table.unpack(entry.args, 1, entry.args.n))
			else
				Log.Warn("Kore", "Proxy flush: method '%s' not found on '%s'", entry.method, name)
			end
		end

		table.clear(queue)
	end

	return proxy, resolve
end

return Proxy
