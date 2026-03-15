-- Kore.Util.String — String manipulation utilities

local String = {}

function String.trim(s)
	return string.match(s, "^%s*(.-)%s*$")
end

function String.split(s, sep)
	sep = sep or ","
	local result = {}
	for part in string.gmatch(s, "([^" .. sep .. "]+)") do
		table.insert(result, part)
	end
	return result
end

function String.startsWith(s, prefix)
	return string.sub(s, 1, #prefix) == prefix
end

function String.endsWith(s, suffix)
	return string.sub(s, -#suffix) == suffix
end

function String.capitalize(s)
	return string.upper(string.sub(s, 1, 1)) .. string.sub(s, 2)
end

function String.truncate(s, maxLen, suffix)
	suffix = suffix or "..."
	if #s <= maxLen then
		return s
	end
	return string.sub(s, 1, maxLen - #suffix) .. suffix
end

function String.padStart(s, len, char)
	char = char or " "
	while #s < len do
		s = char .. s
	end
	return s
end

function String.padEnd(s, len, char)
	char = char or " "
	while #s < len do
		s = s .. char
	end
	return s
end

function String.camelize(s)
	local result = string.gsub(s, "[%-_]+(%w)", function(c)
		return string.upper(c)
	end)
	return string.lower(string.sub(result, 1, 1)) .. string.sub(result, 2)
end

function String.slugify(s)
	s = string.lower(s)
	s = string.gsub(s, "%s+", "-")
	s = string.gsub(s, "[^%w%-]", "")
	s = string.gsub(s, "%-%-+", "-")
	s = string.gsub(s, "^%-+", "")
	s = string.gsub(s, "%-+$", "")
	return s
end

return String
