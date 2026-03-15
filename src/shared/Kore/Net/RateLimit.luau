-- Kore.Net.RateLimit — Per-remote rate limiting

local Log = require(script.Parent.Parent.Log)

local RateLimit = {}

local trackers = {} -- [remoteName] = { [player] = { count, resetTime } }

function RateLimit.Check(remoteName, player, config)
	if not config then
		return true
	end

	local maxCalls = config.MaxCalls
	local perSeconds = config.PerSeconds

	if not maxCalls or not perSeconds then
		return true
	end

	if not trackers[remoteName] then
		trackers[remoteName] = {}
	end

	local playerKey = player.UserId
	local tracker = trackers[remoteName][playerKey]
	local now = os.clock()

	if not tracker or now >= tracker.resetTime then
		trackers[remoteName][playerKey] = {
			count = 1,
			resetTime = now + perSeconds,
		}
		return true
	end

	tracker.count = tracker.count + 1
	if tracker.count > maxCalls then
		Log.Debug(
			"Kore.Net",
			"Rate limit exceeded for '%s' by %s (%d/%d in %.1fs)",
			remoteName,
			player.Name,
			tracker.count,
			maxCalls,
			perSeconds
		)
		return false
	end

	return true
end

-- Cleanup when a player leaves
function RateLimit.ClearPlayer(player)
	local playerKey = player.UserId
	for _, remoteTrackers in pairs(trackers) do
		remoteTrackers[playerKey] = nil
	end
end

return RateLimit
