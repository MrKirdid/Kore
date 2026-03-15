-- Kore.Net.Middleware — Per-remote middleware pipeline

local Middleware = {}

function Middleware.RunInbound(middlewareDef, player, ...)
	if not middlewareDef or not middlewareDef.Inbound then
		return true, ...
	end

	local result = table.pack(middlewareDef.Inbound(player, ...))
	if result.n == 0 then
		-- Returning nothing drops the call
		return false
	end

	return true, table.unpack(result, 1, result.n)
end

function Middleware.RunOutbound(middlewareDef, player, result)
	if not middlewareDef or not middlewareDef.Outbound then
		return result
	end

	return middlewareDef.Outbound(player, result)
end

return Middleware
