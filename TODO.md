# Kore — TODO

## Discord Webhook Error Logging

Kore.Log supports a DiscordWebhook config key but it is not yet implemented.

```lua
Kore.Configure({
  Log = { DiscordWebhook = "https://..." }
})
```

Roblox cannot call Discord's API directly. This requires a proxy server
sitting between Roblox and Discord. Recommended pattern:

```
Roblox game server
  -> HTTP POST to your proxy (e.g. a Cloudflare Worker or lightweight Node server)
  -> proxy forwards to Discord webhook URL
```

The config key is scaffolded and accepted by Kore.Configure() but ignored
until the proxy infrastructure is in place.

**Status: NOT IMPLEMENTED. Infrastructure required before this can ship.**
