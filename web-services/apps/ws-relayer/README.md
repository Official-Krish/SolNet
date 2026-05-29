# `@Axion/ws-relayer` — WebSocket Relay + SSH Proxy

Bun WebSocket server (port 9093) with two responsibilities:

1. **Indexer event relay** — Receives events from the Rust indexer via HTTP webhook, broadcasts to subscribed frontend clients by pubkey
2. **SSH terminal proxy** — Authenticates users via JWT, establishes SSH connections to user VMs, and multiplexes stdin/stdout over WebSocket for the browser terminal

## Protocols

| Message Type | Direction | Description |
|-------------|-----------|-------------|
| `authenticate` | Client → Server | JWT auth |
| `connect` | Client → Server | SSH connect to VM |
| `command` | Bidirectional | SSH stdin/stdout |
| `subscribe-indexer` | Client → Server | Subscribe to indexer events by pubkey |
| `indexer-event` | Server → Client | Parsed on-chain event |

## Develop

```bash
bun install
bun dev
```

## Environment

```
PORT=9093
JWT_SECRET=...
```
