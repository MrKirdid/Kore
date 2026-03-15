-- Kore.Net.Compression — Custom compression strategies for networking
-- Built from scratch. Not based on any external module.

local Log = require(script.Parent.Parent.Log)

local Compression = {}

local currentStrategy = "Auto"
local customEncode = nil
local customDecode = nil

-- Dictionary encoding for repeated string keys
local dictionary = {}
local dictionaryReverse = {}
local nextDictId = 1

local function getDictKey(key)
	if dictionary[key] then
		return dictionary[key]
	end
	local id = nextDictId
	nextDictId = id + 1
	local encoded = string.char(0x01) .. string.pack("I2", id)
	dictionary[key] = encoded
	dictionaryReverse[encoded] = key
	return encoded
end

-- Delta compression: encode only differences between consecutive values
local function deltaEncode(values)
	if #values == 0 then
		return values
	end

	local result = { values[1] }
	for i = 2, #values do
		if type(values[i]) == "number" and type(values[i - 1]) == "number" then
			result[i] = values[i] - values[i - 1]
		else
			result[i] = values[i]
		end
	end
	return result
end

local function deltaDecode(values)
	if #values == 0 then
		return values
	end

	local result = { values[1] }
	for i = 2, #values do
		if type(values[i]) == "number" and type(result[i - 1]) == "number" then
			result[i] = result[i - 1] + values[i]
		else
			result[i] = values[i]
		end
	end
	return result
end

-- Analyze payload to determine best strategy
local function analyzePayload(data)
	if type(data) ~= "table" then
		return "None"
	end

	local keyCount = 0
	local numericValues = 0
	local totalValues = 0

	for key, value in pairs(data) do
		if type(key) == "string" then
			keyCount = keyCount + 1
		end
		if type(value) == "number" then
			numericValues = numericValues + 1
		end
		totalValues = totalValues + 1
	end

	-- Use aggressive if many string keys or numeric values for delta encoding
	if keyCount > 5 or numericValues > 3 then
		return "Aggressive"
	end

	return "None"
end

-- Encode data using dictionary encoding for string keys
local function dictionaryEncode(data)
	if type(data) ~= "table" then
		return data
	end

	local result = {}
	for key, value in pairs(data) do
		if type(key) == "string" then
			result[getDictKey(key)] = dictionaryEncode(value)
		else
			result[key] = dictionaryEncode(value)
		end
	end
	return result
end

local function dictionaryDecode(data)
	if type(data) ~= "table" then
		return data
	end

	local result = {}
	for key, value in pairs(data) do
		if type(key) == "string" and dictionaryReverse[key] then
			result[dictionaryReverse[key]] = dictionaryDecode(value)
		else
			result[key] = dictionaryDecode(value)
		end
	end
	return result
end

function Compression.Encode(data)
	local strategy = currentStrategy

	if strategy == "None" then
		return data
	end

	if strategy == "Custom" then
		if customEncode then
			return customEncode(data)
		end
		return data
	end

	if strategy == "Auto" then
		strategy = analyzePayload(data)
		if strategy == "None" then
			return data
		end
	end

	-- Aggressive strategy: dictionary encoding + delta for numeric arrays
	if strategy == "Aggressive" then
		local encoded = dictionaryEncode(data)
		return encoded
	end

	return data
end

function Compression.Decode(data)
	local strategy = currentStrategy

	if strategy == "None" then
		return data
	end

	if strategy == "Custom" then
		if customDecode then
			return customDecode(data)
		end
		return data
	end

	-- Auto and Aggressive both need dictionary decoding
	if strategy == "Auto" or strategy == "Aggressive" then
		return dictionaryDecode(data)
	end

	return data
end

function Compression.SetStrategy(config)
	if type(config) == "string" then
		currentStrategy = config
		return
	end

	if type(config) == "table" then
		currentStrategy = config.Strategy or "Auto"

		if config.Encode then
			customEncode = config.Encode
		end
		if config.Decode then
			customDecode = config.Decode
		end
	end
end

function Compression.GetStrategy()
	return currentStrategy
end

return Compression
