-- Kore.Curve — Keyframe curve sampler for animation, VFX, and time-based values

local Curve = {}
Curve.__index = Curve

function Curve.new(keyframes)
	local sorted = table.clone(keyframes)
	table.sort(sorted, function(a, b)
		return a.t < b.t
	end)

	return setmetatable({
		_keyframes = sorted,
	}, Curve)
end

function Curve:Sample(t)
	local keyframes = self._keyframes
	local count = #keyframes

	if count == 0 then
		return 0
	end

	if count == 1 then
		return keyframes[1].v
	end

	-- Clamp to range
	if t <= keyframes[1].t then
		return keyframes[1].v
	end

	if t >= keyframes[count].t then
		return keyframes[count].v
	end

	-- Find surrounding keyframes
	for i = 1, count - 1 do
		local kf0 = keyframes[i]
		local kf1 = keyframes[i + 1]

		if t >= kf0.t and t <= kf1.t then
			local alpha = (t - kf0.t) / (kf1.t - kf0.t)
			return kf0.v + (kf1.v - kf0.v) * alpha
		end
	end

	return keyframes[count].v
end

-- Smooth sampling with cubic interpolation (Catmull-Rom)
function Curve:SampleSmooth(t)
	local keyframes = self._keyframes
	local count = #keyframes

	if count < 4 then
		return self:Sample(t)
	end

	if t <= keyframes[1].t then
		return keyframes[1].v
	end

	if t >= keyframes[count].t then
		return keyframes[count].v
	end

	for i = 1, count - 1 do
		local kf1 = keyframes[i]
		local kf2 = keyframes[i + 1]

		if t >= kf1.t and t <= kf2.t then
			local alpha = (t - kf1.t) / (kf2.t - kf1.t)
			local p0 = keyframes[math.max(1, i - 1)].v
			local p1 = kf1.v
			local p2 = kf2.v
			local p3 = keyframes[math.min(count, i + 2)].v

			-- Catmull-Rom
			local a = 2 * p1
			local b = p2 - p0
			local c = 2 * p0 - 5 * p1 + 4 * p2 - p3
			local d = -p0 + 3 * p1 - 3 * p2 + p3
			return 0.5 * (a + b * alpha + c * alpha * alpha + d * alpha * alpha * alpha)
		end
	end

	return keyframes[count].v
end

return Curve
