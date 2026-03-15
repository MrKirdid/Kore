-- Kore.Net.Batcher — Frame-based remote call batching

local RunService = game:GetService("RunService")
local Log = require(script.Parent.Parent.Log)

local Batcher = {}
Batcher.__index = Batcher

function Batcher.new(sendCallback)
	local self = setmetatable({
		_queue = {},
		_sendCallback = sendCallback,
		_connection = nil,
		_active = false,
	}, Batcher)
	return self
end

function Batcher:Queue(remoteName, ...)
	if not self._active then
		self._active = true
		self._connection = RunService.Heartbeat:Once(function()
			self:_flush()
		end)
	end

	table.insert(self._queue, {
		name = remoteName,
		args = table.pack(...),
	})
end

function Batcher:_flush()
	local batch = self._queue
	self._queue = {}
	self._active = false
	self._connection = nil

	if #batch > 0 then
		Log.Debug("Kore.Net", "Flushing batch of %d calls", #batch)
		self._sendCallback(batch)
	end
end

function Batcher:Destroy()
	if self._connection then
		self._connection:Disconnect()
		self._connection = nil
	end
	table.clear(self._queue)
	self._active = false
end

return Batcher
