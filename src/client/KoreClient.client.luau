-- KoreClient — Client bootstrap entry point
-- Auto-discovers controllers and starts Kore on the client.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Kore = require(ReplicatedStorage.Shared.Kore)

-- Configure Kore (optional — defaults are fine for most projects)
-- Kore.Configure({
-- 	Debug = false,
-- })

-- Start Kore — auto-discovers all controllers in StarterPlayerScripts.Controllers
Kore.Start()
	:andThen(function()
		print("[Kore] Client started successfully")
	end)
	:catch(function(err)
		warn("[Kore] Client failed to start: " .. tostring(err))
	end)
