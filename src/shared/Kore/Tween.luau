-- Kore.Tween — Builder pattern tween with Promise-based Play()

local TweenService = game:GetService("TweenService")

local Packages = game:GetService("ReplicatedStorage"):FindFirstChild("Packages")
local Promise = require(Packages and Packages:FindFirstChild("promise") or script.Parent.Promise)

local Tween = {}
Tween.__index = Tween

function Tween.new(instance)
	return setmetatable({
		_instance = instance,
		_properties = {},
		_duration = 0.3,
		_easingStyle = Enum.EasingStyle.Quad,
		_easingDirection = Enum.EasingDirection.Out,
		_repeatCount = 0,
		_reverses = false,
		_delayTime = 0,
	}, Tween)
end

function Tween:Property(name, value)
	self._properties[name] = value
	return self
end

function Tween:Duration(t)
	self._duration = t
	return self
end

function Tween:Easing(style, direction)
	if type(style) == "string" then
		if style == "Spring" then
			self._easingStyle = Enum.EasingStyle.Elastic
		elseif style == "Bezier" then
			self._easingStyle = Enum.EasingStyle.Cubic
		else
			local enumStyle = Enum.EasingStyle[style]
			if enumStyle then
				self._easingStyle = enumStyle
			end
		end
	elseif typeof(style) == "EnumItem" then
		self._easingStyle = style
	end

	if direction then
		if type(direction) == "string" then
			local enumDir = Enum.EasingDirection[direction]
			if enumDir then
				self._easingDirection = enumDir
			end
		elseif typeof(direction) == "EnumItem" then
			self._easingDirection = direction
		end
	end

	return self
end

function Tween:RepeatCount(count)
	self._repeatCount = count
	return self
end

function Tween:Reverses(reverses)
	self._reverses = reverses
	return self
end

function Tween:DelayTime(t)
	self._delayTime = t
	return self
end

function Tween:Play()
	return Promise.new(function(resolve)
		local tweenInfo = TweenInfo.new(
			self._duration,
			self._easingStyle,
			self._easingDirection,
			self._repeatCount,
			self._reverses,
			self._delayTime
		)

		local tween = TweenService:Create(self._instance, tweenInfo, self._properties)
		tween.Completed:Once(function()
			resolve()
		end)
		tween:Play()
	end)
end

function Tween:Cancel()
	-- No-op if not playing (tween is created inline in Play)
end

return Tween
