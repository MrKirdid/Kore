-- Kore.Log — Structured logger with levels, tagging, and filtering

local RunService = game:GetService("RunService")

local Log = {}
Log.__index = Log

local LEVELS = {
	Debug = 1,
	Info = 2,
	Warn = 3,
	Error = 4,
}

local isStudio = RunService:IsStudio()
local minLevel = LEVELS.Warn

function Log.SetMinLevel(level)
	minLevel = LEVELS[level] or LEVELS.Warn
end

function Log.EnableDebug()
	minLevel = LEVELS.Debug
end

local function formatMessage(tag, level, message, ...)
	local args = { ... }
	if #args > 0 then
		local ok, formatted = pcall(string.format, message, ...)
		if ok then
			message = formatted
		end
	end

	if tag then
		return string.format("[%s][%s] %s", tag, level, message)
	end
	return string.format("[Kore][%s] %s", level, message)
end

function Log.Debug(tag, message, ...)
	if minLevel > LEVELS.Debug then
		return
	end
	print(formatMessage(tag, "DEBUG", message, ...))
end

function Log.Info(tag, message, ...)
	if minLevel > LEVELS.Info then
		return
	end
	print(formatMessage(tag, "INFO", message, ...))
end

function Log.Warn(tag, message, ...)
	if minLevel > LEVELS.Warn then
		return
	end
	warn(formatMessage(tag, "WARN", message, ...))
end

function Log.Error(tag, message, ...)
	-- Errors always print
	error(formatMessage(tag, "ERROR", message, ...), 2)
end

function Log.ErrorNoThrow(tag, message, ...)
	-- Logs error without throwing
	warn(formatMessage(tag, "ERROR", message, ...))
end

-- Create a tagged logger for a specific service/controller
function Log.Tagged(tag)
	local tagged = {}

	function tagged.Debug(message, ...)
		Log.Debug(tag, message, ...)
	end

	function tagged.Info(message, ...)
		Log.Info(tag, message, ...)
	end

	function tagged.Warn(message, ...)
		Log.Warn(tag, message, ...)
	end

	function tagged.Error(message, ...)
		Log.Error(tag, message, ...)
	end

	function tagged.ErrorNoThrow(message, ...)
		Log.ErrorNoThrow(tag, message, ...)
	end

	return tagged
end

return Log
