-- Kore.Mock — Test isolation for services and controllers
-- Allows instantiation without Kore.Start()

local Log = require(script.Parent.Log)
local Signal = require(script.Parent.Signal)

local Mock = {}

local function createJanitor()
	local tasks = {}

	return {
		Add = function(self, task, method)
			table.insert(tasks, { task = task, method = method })
			return task
		end,

		Cleanup = function(self)
			for i = #tasks, 1, -1 do
				local entry = tasks[i]
				if type(entry.task) == "function" then
					entry.task()
				elseif entry.method and type(entry.task[entry.method]) == "function" then
					entry.task[entry.method](entry.task)
				end
			end
			table.clear(tasks)
		end,

		Destroy = function(self)
			self:Cleanup()
		end,
	}
end

local function createMockContext(name, config)
	return {
		Log = Log.Tagged(name),
		Kore = {
			GetService = function(svcName)
				return {} -- stub
			end,
			GetController = function(ctrlName)
				return {} -- stub
			end,
		},
		Config = config or {},
	}
end

function Mock.Service(definition)
	local service = {}

	-- Copy definition
	for k, v in pairs(definition) do
		service[k] = v
	end

	service.Janitor = createJanitor()
	service.Log = Log.Tagged(service.Name or "MockService")

	local injected = {}
	local ctx = createMockContext(service.Name or "MockService", service.Config)

	-- Override Kore.GetService to use injected services
	ctx.Kore.GetService = function(name)
		if injected[name] then
			return injected[name]
		end
		return {} -- stub
	end

	local mockHandle = {
		_service = service,
		_ctx = ctx,
	}

	function mockHandle:Init()
		if service.Init then
			service.Init(service, ctx)
		end
	end

	function mockHandle:Start()
		if service.Start then
			service.Start(service, ctx)
		end
	end

	function mockHandle:Inject(name, implementation)
		injected[name] = implementation
	end

	function mockHandle:Get()
		return service
	end

	function mockHandle:Destroy()
		if service.Destroy then
			service.Destroy(service)
		end
		service.Janitor:Cleanup()
	end

	return mockHandle
end

function Mock.Controller(definition)
	local controller = {}

	for k, v in pairs(definition) do
		controller[k] = v
	end

	controller.Janitor = createJanitor()
	controller.Log = Log.Tagged(controller.Name or "MockController")

	local injected = {}
	local ctx = createMockContext(controller.Name or "MockController", controller.Config)

	ctx.Kore.GetController = function(name)
		if injected[name] then
			return injected[name]
		end
		return {}
	end

	local mockHandle = {
		_controller = controller,
		_ctx = ctx,
	}

	function mockHandle:Init()
		if controller.Init then
			controller.Init(controller, ctx)
		end
	end

	function mockHandle:Start()
		if controller.Start then
			controller.Start(controller, ctx)
		end
	end

	function mockHandle:Inject(name, implementation)
		injected[name] = implementation
	end

	function mockHandle:Get()
		return controller
	end

	function mockHandle:Destroy()
		if controller.Destroy then
			controller.Destroy(controller)
		end
		controller.Janitor:Cleanup()
	end

	return mockHandle
end

return Mock
