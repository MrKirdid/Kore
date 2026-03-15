--[[
	Dynamic, lossless compressor for Roblox values (buffers based).

	API
		local Compressor = require(path.to.Compressor)
		local buf = Compressor.compress(value, options?)
		local reconstructed = Compressor.decompress(buf, options?)

	Options (same for compress / decompress)
		instanceSerializer: (instance) -> descriptor | nil
			Custom serializer for Instances. Should return any table that the resolver can understand.
			Default uses ancestry segments with sibling ordinals to disambiguate duplicate names.

		instanceResolver: (descriptor) -> Instance? | nil
			Custom resolver that turns a descriptor back into an Instance. Required when the default
			ancestry+ordinal lookup is not sufficient (e.g. orphaned instances, reordered siblings).

	Notes
		- The default Instance path avoids GetFullName() and uses sibling ordinals to disambiguate
			duplicates. Provide a custom resolver for more stable / cross-session lookups.
		- Tables preserve shared references (including self/cyclic) using reference IDs.
		- Strings are interned; repeats become string references to minimize size.
		- Numbers use zig-zag varints when they are 32-bit integers, otherwise 64-bit floats.
]]

local HttpService = game:GetService("HttpService")

-- Type tags (1 byte)
local TAG_NIL = 0
local TAG_FALSE = 1
local TAG_TRUE = 2
local TAG_INT = 3
local TAG_DOUBLE = 4
local TAG_STRING_NEW = 5
local TAG_STRING_REF = 6
local TAG_TABLE_NEW = 7
local TAG_TABLE_REF = 8
local TAG_VECTOR2 = 9
local TAG_VECTOR3 = 10
local TAG_VECTOR2INT16 = 11
local TAG_VECTOR3INT16 = 12
local TAG_CFRAME = 13
local TAG_COLOR3 = 14
local TAG_UDIM = 15
local TAG_UDIM2 = 16
local TAG_RECT = 17
local TAG_NUMBER_RANGE = 18
local TAG_NUMBER_SEQUENCE = 19
local TAG_COLOR_SEQUENCE = 20
local TAG_BRICKCOLOR = 21
local TAG_INSTANCE_NEW = 22
local TAG_INSTANCE_REF = 23

-- Lightweight buffer writer with auto growth.
local Writer = {}
Writer.__index = Writer

function Writer.new(initialSize: number?)
	local size = initialSize or 128
	local self = {
		buf = buffer.create(size),
		size = size,
		pos = 0,
	}
	return setmetatable(self, Writer)
end

function Writer:_grow(minExtra: number)
	local needed = self.pos + minExtra
	if needed <= self.size then
		return
	end
	local newSize = self.size
	repeat
		newSize *= 2
	until newSize >= needed

	local newBuf = buffer.create(newSize)
	for i = 0, self.pos - 1 do
		buffer.writeu8(newBuf, i, buffer.readu8(self.buf, i))
	end

	self.buf = newBuf
	self.size = newSize
end

function Writer:writeU8(value: number)
	self:_grow(1)
	buffer.writeu8(self.buf, self.pos, value)
	self.pos += 1
end

function Writer:writeDouble(value: number)
	self:_grow(8)
	buffer.writef64(self.buf, self.pos, value)
	self.pos += 8
end

function Writer:writeBytes(str: string)
	local len = #str
	self:_grow(len)
	for i = 1, len do
		buffer.writeu8(self.buf, self.pos, string.byte(str, i, i))
		self.pos += 1
	end
end

function Writer:toBuffer(): buffer
	if self.pos == self.size then
		return self.buf
	end

	local trimmed = buffer.create(self.pos)
	for i = 0, self.pos - 1 do
		buffer.writeu8(trimmed, i, buffer.readu8(self.buf, i))
	end
	return trimmed
end

-- Reader that walks an existing buffer.
local Reader = {}
Reader.__index = Reader

function Reader.new(buf: buffer)
	return setmetatable({ buf = buf, pos = 0, size = buffer.len(buf) }, Reader)
end

function Reader:readU8(): number
	local v = buffer.readu8(self.buf, self.pos)
	self.pos += 1
	return v
end

function Reader:readDouble(): number
	local v = buffer.readf64(self.buf, self.pos)
	self.pos += 8
	return v
end

function Reader:readBytes(len: number): string
	local out = table.create(len)
	for i = 1, len do
		out[i] = string.char(buffer.readu8(self.buf, self.pos))
		self.pos += 1
	end
	return table.concat(out)
end

-- Varint helpers (unsigned + zig-zag for signed ints).
local function writeVarUInt(w: Writer, n: number)
	repeat
		local byte = n % 0x80
		n //= 0x80
		if n > 0 then
			byte += 0x80
		end
		w:writeU8(byte)
	until n == 0
end

local function readVarUInt(r: Reader): number
	local result = 0
	local shift = 0
	while true do
		local byte = r:readU8()
		result += bit32.lshift(byte % 0x80, shift)
		if byte < 0x80 then
			break
		end
		shift += 7
	end
	return result
end

local function writeVarInt(w: Writer, n: number)
	-- Zig-zag: map signed ints to unsigned for better packing.
	local zz = bit32.bxor(bit32.lshift(n, 1), bit32.rshift(n, 31))
	writeVarUInt(w, zz)
end

local function readVarInt(r: Reader): number
	local zz = readVarUInt(r)
	local n = bit32.rshift(zz, 1)
	if bit32.band(zz, 1) ~= 0 then
		n = -n - 1
	end
	return n
end

-- String interning context.
local function writeString(ctx, value: string)
	local id = ctx.stringIds[value]
	if id then
		ctx.writer:writeU8(TAG_STRING_REF)
		writeVarUInt(ctx.writer, id)
		return
	end

	id = #ctx.strings + 1
	ctx.stringIds[value] = id
	ctx.strings[id] = value

	ctx.writer:writeU8(TAG_STRING_NEW)
	writeVarUInt(ctx.writer, id)
	writeVarUInt(ctx.writer, #value)
	ctx.writer:writeBytes(value)
end

local function readString(ctx): string
	local tag = ctx.reader:readU8()
	if tag == TAG_STRING_REF then
		local id = readVarUInt(ctx.reader)
		local existing = ctx.strings[id]
		assert(existing, "invalid string ref")
		return existing
	end

	assert(tag == TAG_STRING_NEW, "invalid string tag")
	local id = readVarUInt(ctx.reader)
	local len = readVarUInt(ctx.reader)
	local value = ctx.reader:readBytes(len)
	ctx.strings[id] = value
	return value
end

-- Instance path serializer using sibling ordinals (avoids GetFullName collisions).
local function defaultInstanceDescriptor(instance: Instance)
	local segments = {}
	local current = instance
	while current and current.Parent do
		local parent = current.Parent
		local ordinal = 0
		for _, child in ipairs(parent:GetChildren()) do
			if child.Name == current.Name and child.ClassName == current.ClassName then
				ordinal += 1
				if child == current then
					break
				end
			end
		end

		table.insert(segments, 1, {
			name = current.Name,
			class = current.ClassName,
			ordinal = ordinal,
		})

		current = parent
	end

	local root
	if current == game then
		root = { kind = "game" }
	elseif current then
		root = {
			kind = "service",
			name = current.Name,
			class = current.ClassName,
		}
	else
		-- Unparented; fallback descriptor containing a generated token (session scoped).
		root = { kind = "orphan", token = HttpService:GenerateGUID(false) }
	end

	return {
		root = root,
		segments = segments,
	}
end

local function resolveWithDescriptor(descriptor, resolver): Instance?
	if resolver then
		return resolver(descriptor)
	end

	local root = descriptor.root
	if not root or root.kind == "orphan" then
		return nil
	end

	local cursor
	if root.kind == "game" then
		cursor = game
	elseif root.kind == "service" then
		cursor = game:FindFirstChild(root.name)
		if not cursor or cursor.ClassName ~= root.class then
			return nil
		end
	end

	for _, seg in ipairs(descriptor.segments or {}) do
		local count = 0
		local found
		for _, child in ipairs(cursor:GetChildren()) do
			if child.Name == seg.name and child.ClassName == seg.class then
				count += 1
				if count == seg.ordinal then
					found = child
					break
				end
			end
		end
		if not found then
			return nil
		end
		cursor = found
	end

	return cursor
end

local function writeInstance(ctx, instance: Instance)
	local id = ctx.instanceIds[instance]
	if id then
		ctx.writer:writeU8(TAG_INSTANCE_REF)
		writeVarUInt(ctx.writer, id)
		return
	end

	id = #ctx.instances + 1
	ctx.instanceIds[instance] = id
	ctx.instances[id] = instance

	local descriptor = (ctx.options.instanceSerializer or defaultInstanceDescriptor)(instance)

	ctx.writer:writeU8(TAG_INSTANCE_NEW)
	writeVarUInt(ctx.writer, id)

	-- Descriptor format: root kind, root meta, segment count, each segment name/class/ordinal.
	writeString(ctx, descriptor.root.kind)
	if descriptor.root.kind == "service" then
		writeString(ctx, descriptor.root.name)
		writeString(ctx, descriptor.root.class)
	elseif descriptor.root.kind == "orphan" then
		writeString(ctx, descriptor.root.token or "")
		writeString(ctx, descriptor.root.name or instance.Name)
		writeString(ctx, descriptor.root.class or instance.ClassName)
	end

	local segments = descriptor.segments or {}
	writeVarUInt(ctx.writer, #segments)
	for _, seg in ipairs(segments) do
		writeString(ctx, seg.name)
		writeString(ctx, seg.class)
		writeVarUInt(ctx.writer, seg.ordinal)
	end
end

local function readInstance(ctx)
	local tag = ctx.reader:readU8()
	if tag == TAG_INSTANCE_REF then
		local refId = readVarUInt(ctx.reader)
		local inst = ctx.instances[refId]
		assert(inst, "invalid instance ref")
		return inst
	end

	assert(tag == TAG_INSTANCE_NEW, "invalid instance tag")
	local id = readVarUInt(ctx.reader)

	local rootKind = readString(ctx)
	local root = { kind = rootKind }
	if rootKind == "service" then
		root.name = readString(ctx)
		root.class = readString(ctx)
	elseif rootKind == "orphan" then
		root.token = readString(ctx)
		root.name = readString(ctx)
		root.class = readString(ctx)
	end

	local segCount = readVarUInt(ctx.reader)
	local segments = table.create(segCount)
	for i = 1, segCount do
		segments[i] = {
			name = readString(ctx),
			class = readString(ctx),
			ordinal = readVarUInt(ctx.reader),
		}
	end

	local descriptor = { root = root, segments = segments }
	local inst = resolveWithDescriptor(descriptor, ctx.options.instanceResolver)
	assert(inst, "instance resolver failed")
	ctx.instances[id] = inst
	return inst
end

-- Table encoding with shared reference preservation.
local function writeTable(ctx, tbl: table)
	local id = ctx.tableIds[tbl]
	if id then
		ctx.writer:writeU8(TAG_TABLE_REF)
		writeVarUInt(ctx.writer, id)
		return
	end

	id = #ctx.tables + 1
	ctx.tableIds[tbl] = id
	ctx.tables[id] = tbl

	ctx.writer:writeU8(TAG_TABLE_NEW)
	writeVarUInt(ctx.writer, id)

	local arrayLen = #tbl
	writeVarUInt(ctx.writer, arrayLen)
	for i = 1, arrayLen do
		ctx.encode(tbl[i])
	end

	local mapEntries = {}
	for k, v in pairs(tbl) do
		if type(k) ~= "number" or k < 1 or k > arrayLen or math.floor(k) ~= k then
			local orderKey = typeof(k) .. ":" .. tostring(k)
			table.insert(mapEntries, { k = k, v = v, orderKey = orderKey })
		end
	end
	table.sort(mapEntries, function(a, b)
		return a.orderKey < b.orderKey
	end)

	writeVarUInt(ctx.writer, #mapEntries)
	for _, entry in ipairs(mapEntries) do
		ctx.encode(entry.k)
		ctx.encode(entry.v)
	end
end

local function readTable(ctx)
	local id = readVarUInt(ctx.reader)
	local tbl = {}
	ctx.tables[id] = tbl

	local arrayLen = readVarUInt(ctx.reader)
	for i = 1, arrayLen do
		tbl[i] = ctx.decode()
	end

	local mapCount = readVarUInt(ctx.reader)
	for _ = 1, mapCount do
		local k = ctx.decode()
		local v = ctx.decode()
		tbl[k] = v
	end

	return tbl
end

-- Primitive value encoder/decoder.
local function encodeValue(ctx, value)
	local valueType = typeof(value)

	if value == nil then
		ctx.writer:writeU8(TAG_NIL)
		return
	elseif valueType == "boolean" then
		ctx.writer:writeU8(value and TAG_TRUE or TAG_FALSE)
		return
	elseif valueType == "number" then
		if value % 1 == 0 and value >= -2147483648 and value <= 2147483647 then
			ctx.writer:writeU8(TAG_INT)
			writeVarInt(ctx.writer, value)
		else
			ctx.writer:writeU8(TAG_DOUBLE)
			ctx.writer:writeDouble(value)
		end
		return
	elseif valueType == "string" then
		writeString(ctx, value)
		return
	elseif valueType == "table" then
		writeTable(ctx, value)
		return
	elseif valueType == "Instance" then
		writeInstance(ctx, value)
		return
	elseif valueType == "Vector2" then
		ctx.writer:writeU8(TAG_VECTOR2)
		ctx.writer:writeDouble(value.X)
		ctx.writer:writeDouble(value.Y)
		return
	elseif valueType == "Vector3" then
		ctx.writer:writeU8(TAG_VECTOR3)
		ctx.writer:writeDouble(value.X)
		ctx.writer:writeDouble(value.Y)
		ctx.writer:writeDouble(value.Z)
		return
	elseif valueType == "Vector2int16" then
		ctx.writer:writeU8(TAG_VECTOR2INT16)
		writeVarInt(ctx.writer, value.X)
		writeVarInt(ctx.writer, value.Y)
		return
	elseif valueType == "Vector3int16" then
		ctx.writer:writeU8(TAG_VECTOR3INT16)
		writeVarInt(ctx.writer, value.X)
		writeVarInt(ctx.writer, value.Y)
		writeVarInt(ctx.writer, value.Z)
		return
	elseif valueType == "CFrame" then
		ctx.writer:writeU8(TAG_CFRAME)
		local components = { value:GetComponents() }
		for i = 1, 12 do
			ctx.writer:writeDouble(components[i])
		end
		return
	elseif valueType == "Color3" then
		ctx.writer:writeU8(TAG_COLOR3)
		ctx.writer:writeDouble(value.R)
		ctx.writer:writeDouble(value.G)
		ctx.writer:writeDouble(value.B)
		return
	elseif valueType == "UDim" then
		ctx.writer:writeU8(TAG_UDIM)
		ctx.writer:writeDouble(value.Scale)
		writeVarInt(ctx.writer, value.Offset)
		return
	elseif valueType == "UDim2" then
		ctx.writer:writeU8(TAG_UDIM2)
		ctx.writer:writeDouble(value.X.Scale)
		writeVarInt(ctx.writer, value.X.Offset)
		ctx.writer:writeDouble(value.Y.Scale)
		writeVarInt(ctx.writer, value.Y.Offset)
		return
	elseif valueType == "Rect" then
		ctx.writer:writeU8(TAG_RECT)
		ctx.writer:writeDouble(value.Min.X)
		ctx.writer:writeDouble(value.Min.Y)
		ctx.writer:writeDouble(value.Max.X)
		ctx.writer:writeDouble(value.Max.Y)
		return
	elseif valueType == "NumberRange" then
		ctx.writer:writeU8(TAG_NUMBER_RANGE)
		ctx.writer:writeDouble(value.Min)
		ctx.writer:writeDouble(value.Max)
		return
	elseif valueType == "NumberSequence" then
		ctx.writer:writeU8(TAG_NUMBER_SEQUENCE)
		local keypoints = value.Keypoints
		writeVarUInt(ctx.writer, #keypoints)
		for _, kp in ipairs(keypoints) do
			ctx.writer:writeDouble(kp.Time)
			ctx.writer:writeDouble(kp.Value)
			ctx.writer:writeDouble(kp.Envelope)
		end
		return
	elseif valueType == "ColorSequence" then
		ctx.writer:writeU8(TAG_COLOR_SEQUENCE)
		local keypoints = value.Keypoints
		writeVarUInt(ctx.writer, #keypoints)
		for _, kp in ipairs(keypoints) do
			ctx.writer:writeDouble(kp.Time)
			ctx.writer:writeDouble(kp.Value.R)
			ctx.writer:writeDouble(kp.Value.G)
			ctx.writer:writeDouble(kp.Value.B)
		end
		return
	elseif valueType == "BrickColor" then
		ctx.writer:writeU8(TAG_BRICKCOLOR)
		writeVarUInt(ctx.writer, value.Number)
		return
	end

	error("Unsupported type: " .. valueType)
end

local function decodeValue(ctx)
	local tag = ctx.reader:readU8()

	if tag == TAG_NIL then
		return nil
	elseif tag == TAG_FALSE then
		return false
	elseif tag == TAG_TRUE then
		return true
	elseif tag == TAG_INT then
		return readVarInt(ctx.reader)
	elseif tag == TAG_DOUBLE then
		return ctx.reader:readDouble()
	elseif tag == TAG_STRING_NEW or tag == TAG_STRING_REF then
		ctx.reader.pos -= 1 -- rewind one byte so readString consumes tag
		return readString(ctx)
	elseif tag == TAG_TABLE_NEW then
		return readTable(ctx)
	elseif tag == TAG_TABLE_REF then
		local id = readVarUInt(ctx.reader)
		local tbl = ctx.tables[id]
		assert(tbl, "invalid table ref")
		return tbl
	elseif tag == TAG_VECTOR2 then
		local x = ctx.reader:readDouble()
		local y = ctx.reader:readDouble()
		return Vector2.new(x, y)
	elseif tag == TAG_VECTOR3 then
		local x = ctx.reader:readDouble()
		local y = ctx.reader:readDouble()
		local z = ctx.reader:readDouble()
		return Vector3.new(x, y, z)
	elseif tag == TAG_VECTOR2INT16 then
		local x = readVarInt(ctx.reader)
		local y = readVarInt(ctx.reader)
		return Vector2int16.new(x, y)
	elseif tag == TAG_VECTOR3INT16 then
		local x = readVarInt(ctx.reader)
		local y = readVarInt(ctx.reader)
		local z = readVarInt(ctx.reader)
		return Vector3int16.new(x, y, z)
	elseif tag == TAG_CFRAME then
		local c = table.create(12)
		for i = 1, 12 do
			c[i] = ctx.reader:readDouble()
		end
		return CFrame.new(table.unpack(c, 1, 12))
	elseif tag == TAG_COLOR3 then
		local r = ctx.reader:readDouble()
		local g = ctx.reader:readDouble()
		local b = ctx.reader:readDouble()
		return Color3.new(r, g, b)
	elseif tag == TAG_UDIM then
		local scale = ctx.reader:readDouble()
		local offset = readVarInt(ctx.reader)
		return UDim.new(scale, offset)
	elseif tag == TAG_UDIM2 then
		local xs = ctx.reader:readDouble()
		local xo = readVarInt(ctx.reader)
		local ys = ctx.reader:readDouble()
		local yo = readVarInt(ctx.reader)
		return UDim2.new(xs, xo, ys, yo)
	elseif tag == TAG_RECT then
		local minX = ctx.reader:readDouble()
		local minY = ctx.reader:readDouble()
		local maxX = ctx.reader:readDouble()
		local maxY = ctx.reader:readDouble()
		return Rect.new(minX, minY, maxX, maxY)
	elseif tag == TAG_NUMBER_RANGE then
		local min = ctx.reader:readDouble()
		local max = ctx.reader:readDouble()
		return NumberRange.new(min, max)
	elseif tag == TAG_NUMBER_SEQUENCE then
		local count = readVarUInt(ctx.reader)
		local keypoints = table.create(count)
		for i = 1, count do
			local time = ctx.reader:readDouble()
			local value = ctx.reader:readDouble()
			local envelope = ctx.reader:readDouble()
			keypoints[i] = NumberSequenceKeypoint.new(time, value, envelope)
		end
		return NumberSequence.new(keypoints)
	elseif tag == TAG_COLOR_SEQUENCE then
		local count = readVarUInt(ctx.reader)
		local keypoints = table.create(count)
		for i = 1, count do
			local time = ctx.reader:readDouble()
			local r = ctx.reader:readDouble()
			local g = ctx.reader:readDouble()
			local b = ctx.reader:readDouble()
			keypoints[i] = ColorSequenceKeypoint.new(time, Color3.new(r, g, b))
		end
		return ColorSequence.new(keypoints)
	elseif tag == TAG_BRICKCOLOR then
		local num = readVarUInt(ctx.reader)
		return BrickColor.new(num)
	elseif tag == TAG_INSTANCE_REF or tag == TAG_INSTANCE_NEW then
		ctx.reader.pos -= 1 -- let readInstance consume the tag
		return readInstance(ctx)
	end

	error("Unknown tag: " .. tostring(tag))
end

local Compressor = {}

function Compressor.compress(value: any, options)
	local ctx = {
		writer = Writer.new(),
		strings = {},
		stringIds = {},
		tables = {},
		tableIds = {},
		instances = {},
		instanceIds = {},
		options = options or {},
	}

	ctx.encode = function(v)
		encodeValue(ctx, v)
	end

	ctx.encode(value)
	return ctx.writer:toBuffer()
end

function Compressor.decompress(buf: buffer, options)
	local ctx = {
		reader = Reader.new(buf),
		strings = {},
		tables = {},
		instances = {},
		options = options or {},
	}

	ctx.decode = function()
		return decodeValue(ctx)
	end

	return ctx.decode()
end

return Compressor
