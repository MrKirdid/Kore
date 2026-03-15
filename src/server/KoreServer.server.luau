-- KoreServer — Server bootstrap entry point
-- Auto-discovers services and starts Kore on the server.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Kore = require(ReplicatedStorage.Shared.Kore)

-- Configure Kore (optional — defaults are fine for most projects)
-- Kore.Configure({
-- 	Debug = false,
-- 	Destroy = "shutdown",
-- })

-- Start Kore — auto-discovers all services in ServerScriptService.Services
Kore.Start()
	:andThen(function()
		print("[Kore] Server started successfully")
	end)
	:catch(function(err)
		warn("[Kore] Server failed to start: " .. tostring(err))
	end)
