# Kore

A professional Roblox Luau game framework. Structured service/controller loader for all server and client scripts, with built-in typed dynamic networking, lifecycle management, multithreading support, and a comprehensive suite of QOL utilities.

## Installation

### Wally
```toml
[dependencies]
Kore = "mrkirdid/kore@0.1.0"
```

### Rojo
Use the provided `default.project.json` to sync into Studio.

## Quick Start

### Server (KoreServer.server.luau)
```lua
local Kore = require(game.ReplicatedStorage.Shared.Kore)

Kore.Start():andThen(function()
  print("Server started!")
end)
```

### Client (KoreClient.client.luau)
```lua
local Kore = require(game.ReplicatedStorage.Shared.Kore)

Kore.Start():andThen(function()
  print("Client started!")
end)
```

### Defining a Service
```lua
-- src/server/services/MyService.luau
local Kore = require(game.ReplicatedStorage.Shared.Kore)

return {
  Name = "MyService",

  Client = {
    GetData = function(self, player, id)
      return { id = id, value = 42 }
    end,

    DataUpdated = Kore.NetEvent,
  },

  Init = function(self, ctx)
    ctx.Log.Info("Initializing!")
  end,

  Start = function(self, ctx)
    ctx.Log.Info("Started!")
  end,
}
```

### Defining a Controller
```lua
-- src/client/controllers/MyController.luau
return {
  Name = "MyController",
  Dependencies = { "MyService" },

  Init = function(self, ctx)
  end,

  Start = function(self, ctx)
    local MyService = ctx.Kore.GetService("MyService")
    MyService.GetData(1):andThen(function(data)
      print(data)
    end)
  end,
}
```

## Modules

| Module | Description |
|--------|-------------|
| `Kore.Promise` | Promise/A+ (evaera/promise) |
| `Kore.Signal` | Lightweight signal with optional networking |
| `Kore.Log` | Structured tagged logger |
| `Kore.Timer` | Debounce, Throttle, Delay, Every |
| `Kore.Symbol` | Unique opaque sentinel values |
| `Kore.Util.Table` | Table manipulation utilities |
| `Kore.Util.String` | String manipulation utilities |
| `Kore.Util.Math` | Math utilities |
| `Kore.Tween` | Builder pattern tween with Promise |
| `Kore.Curve` | Keyframe curve sampler |
| `Kore.Data` | ProfileStore bridge |
| `Kore.Thread` | Weave parallel execution wrapper |
| `Kore.Mock` | Test isolation (TestEZ/Hoarcekat) |
| `Kore.Janitor` | Cleanup management |
| `Kore.Fusion` | Re-export of Fusion |
| `Kore.Net` | Networking internals |

## VS Code Extension

The companion extension provides:
- Autocomplete for `Kore.GetService()` and `Kore.GetController()`
- Automatic type generation (`Types.luau`)
- Service/Controller snippets
- Diagnostics (name mismatches, unknown deps, duplicates)
- Hover documentation

See `extension/README.md` for details.

## License

MIT
