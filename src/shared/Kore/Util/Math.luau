-- Kore.Util.Math — Math utilities

local Math = {}

function Math.lerp(a, b, t)
	return a + (b - a) * t
end

function Math.clamp(value, min, max)
	return math.clamp(value, min, max)
end

function Math.round(value, decimals)
	if decimals then
		local mult = 10 ^ decimals
		return math.round(value * mult) / mult
	end
	return math.round(value)
end

function Math.map(value, inMin, inMax, outMin, outMax)
	return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin)
end

function Math.snap(value, step)
	return math.round(value / step) * step
end

function Math.sign(value)
	if value > 0 then
		return 1
	elseif value < 0 then
		return -1
	end
	return 0
end

function Math.randomRange(min, max)
	return min + math.random() * (max - min)
end

function Math.approach(current, target, step)
	if current < target then
		return math.min(current + step, target)
	elseif current > target then
		return math.max(current - step, target)
	end
	return current
end

function Math.damp(a, b, smoothing, dt)
	return Math.lerp(a, b, 1 - smoothing ^ dt)
end

function Math.bezier(t, p0, p1, p2, p3)
	local u = 1 - t
	local tt = t * t
	local uu = u * u
	local uuu = uu * u
	local ttt = tt * t

	return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3
end

return Math
