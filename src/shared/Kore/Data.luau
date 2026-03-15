-- Kore.Data — Thin bridge over ProfileStore

local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local Packages = game:GetService("ReplicatedStorage"):FindFirstChild("Packages")
	or game:GetService("ReplicatedStorage"):FindFirstChild("Shared"):FindFirstChild("Packages")
local Log = require(script.Parent.Log)

local Data = {}

local profileStore = nil
local profiles = {} -- [player.UserId] = profile
local loadedCallbacks = {} -- [player.UserId] = { fn, fn, ... }

local Promise
local ProfileStore

function Data.Configure(config)
	if not RunService:IsServer() then
		Log.Warn("Kore.Data", "Data module is server-only")
		return
	end

	-- Lazy load dependencies
	if not Promise then
		Promise = require(Packages and Packages:FindFirstChild("promise") or script.Parent.Promise)
	end

	if not ProfileStore then
		local ok, mod = pcall(function()
			return require(Packages and Packages:FindFirstChild("profilestore"))
		end)
		if ok then
			ProfileStore = mod
		else
			Log.Warn("Kore.Data", "ProfileStore not found — Kore.Data will not function")
			return
		end
	end

	local storeName = config.StoreName or "PlayerData"
	local template = config.Template or {}

	profileStore = ProfileStore.New(storeName, template)
end

function Data.Load(player)
	if not Promise then
		Promise = require(Packages and Packages:FindFirstChild("promise") or script.Parent.Promise)
	end

	return Promise.new(function(resolve, reject)
		if not profileStore then
			reject("Kore.Data: ProfileStore not configured. Call Kore.Data.Configure() first.")
			return
		end

		local key = "Player_" .. player.UserId
		local profile = profileStore:StartSessionAsync(key, {
			Cancel = function()
				return player.Parent ~= Players
			end,
		})

		if profile then
			profile:AddUserId(player.UserId)
			profile:Reconcile()

			profile.OnSessionEnd:Connect(function()
				profiles[player.UserId] = nil
				player:Kick("Profile session ended — please rejoin")
			end)

			if player.Parent == Players then
				profiles[player.UserId] = profile

				-- Fire loaded callbacks
				local callbacks = loadedCallbacks[player.UserId]
				if callbacks then
					for _, fn in ipairs(callbacks) do
						task.spawn(fn, profile)
					end
					loadedCallbacks[player.UserId] = nil
				end

				resolve(profile)
			else
				profile:EndSession()
				reject("Player left before profile loaded")
			end
		else
			reject("Failed to load profile for " .. player.Name)
		end
	end)
end

function Data.Get(player)
	return profiles[player.UserId]
end

function Data.OnLoaded(player, fn)
	local existing = profiles[player.UserId]
	if existing then
		task.spawn(fn, existing)
		return
	end

	if not loadedCallbacks[player.UserId] then
		loadedCallbacks[player.UserId] = {}
	end
	table.insert(loadedCallbacks[player.UserId], fn)
end

function Data.Save(player)
	if not Promise then
		Promise = require(Packages and Packages:FindFirstChild("promise") or script.Parent.Promise)
	end

	return Promise.new(function(resolve, reject)
		local profile = profiles[player.UserId]
		if not profile then
			reject("No profile loaded for " .. player.Name)
			return
		end

		profile:Save()
		resolve()
	end)
end

function Data.Release(player)
	local profile = profiles[player.UserId]
	if profile then
		profile:EndSession()
		profiles[player.UserId] = nil
	end
	loadedCallbacks[player.UserId] = nil
end

-- Auto-release on player leaving
if RunService:IsServer() then
	Players.PlayerRemoving:Connect(function(player)
		Data.Release(player)
	end)
end

return Data
