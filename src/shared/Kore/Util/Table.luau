-- Kore.Util.Table — Table manipulation utilities

local Table = {}

function Table.deepCopy(t)
	if type(t) ~= "table" then
		return t
	end

	local copy = {}
	for k, v in pairs(t) do
		copy[Table.deepCopy(k)] = Table.deepCopy(v)
	end
	return setmetatable(copy, getmetatable(t))
end

function Table.shallowCopy(t)
	local copy = {}
	for k, v in pairs(t) do
		copy[k] = v
	end
	return copy
end

function Table.merge(...)
	local result = {}
	for i = 1, select("#", ...) do
		local t = select(i, ...)
		if type(t) == "table" then
			for k, v in pairs(t) do
				result[k] = v
			end
		end
	end
	return result
end

function Table.keys(t)
	local result = {}
	for k in pairs(t) do
		table.insert(result, k)
	end
	return result
end

function Table.values(t)
	local result = {}
	for _, v in pairs(t) do
		table.insert(result, v)
	end
	return result
end

function Table.filter(t, predicate)
	local result = {}
	for k, v in pairs(t) do
		if predicate(v, k) then
			result[k] = v
		end
	end
	return result
end

function Table.map(t, transform)
	local result = {}
	for k, v in pairs(t) do
		result[k] = transform(v, k)
	end
	return result
end

function Table.find(t, predicate)
	for k, v in pairs(t) do
		if predicate(v, k) then
			return v, k
		end
	end
	return nil
end

function Table.flatten(t, depth)
	depth = depth or 1
	local result = {}
	for _, v in ipairs(t) do
		if type(v) == "table" and depth > 0 then
			local flat = Table.flatten(v, depth - 1)
			for _, fv in ipairs(flat) do
				table.insert(result, fv)
			end
		else
			table.insert(result, v)
		end
	end
	return result
end

function Table.shuffle(t)
	local result = table.clone(t)
	for i = #result, 2, -1 do
		local j = math.random(1, i)
		result[i], result[j] = result[j], result[i]
	end
	return result
end

function Table.count(t)
	local n = 0
	for _ in pairs(t) do
		n = n + 1
	end
	return n
end

function Table.freeze(t)
	return table.freeze(Table.deepCopy(t))
end

function Table.diff(a, b)
	local added = {}
	local removed = {}
	local changed = {}

	for k, v in pairs(b) do
		if a[k] == nil then
			added[k] = v
		elseif a[k] ~= v then
			changed[k] = { old = a[k], new = v }
		end
	end

	for k, v in pairs(a) do
		if b[k] == nil then
			removed[k] = v
		end
	end

	return { added = added, removed = removed, changed = changed }
end

return Table
