-- Kore.Symbol — Unique opaque sentinel values (interned by name)

local symbols = {}

local Symbol = {}
Symbol.__index = Symbol

function Symbol:__tostring()
	return "Symbol(" .. self._name .. ")"
end

function Symbol:__eq(other)
	return rawequal(self, other)
end

return function(name)
	if symbols[name] then
		return symbols[name]
	end

	local sym = setmetatable({
		_name = name,
		_isSymbol = true,
	}, Symbol)

	symbols[name] = sym
	return sym
end
