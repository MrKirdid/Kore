# Kore Extension

VS Code extension for the Kore Roblox Luau game framework.

## Features

- **Autocomplete** for `Kore.GetService()` and `Kore.GetController()` with fuzzy matching
- **Type Generation** — automatically generates `Types.luau` on every save
- **Snippets** — `::preset` for service/controller templates, `:AddService`, `:AddController`
- **Diagnostics** — name mismatches, unknown dependencies, duplicate names, dangling references
- **Hover Documentation** — inline docs for all Kore APIs and service/controller info

## Requirements

- VS Code ^1.85.0
- [luau-lsp](https://marketplace.visualstudio.com/items?itemName=JohnnyMorganz.luau-lsp) (recommended)

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `kore.servicesPath` | `src/server/services` | Path to services directory |
| `kore.controllersPath` | `src/client/controllers` | Path to controllers directory |
| `kore.typesOutputPath` | `src/shared/Kore/Types.luau` | Output path for generated types |
| `kore.enableDiagnostics` | `true` | Enable Kore diagnostics |
| `kore.enableSnippets` | `true` | Enable Kore snippets |
| `kore.fuzzyThreshold` | `0.4` | Fuzzy matching threshold (0-1) |
| `kore.debug` | `false` | Log extension internals |

## Commands

- **Kore: Refresh Types** — Re-scan all files and rewrite Types.luau
- **Kore: Open Documentation** — Open Kore docs
- **Kore: Show Service Registry** — Debug panel showing all discovered services and controllers

## Development

```bash
cd extension
npm install
npm run build
```

## Target

This extension targets **luau-lsp** by JohnnyMorganz. It does NOT target Roblox LSP.
