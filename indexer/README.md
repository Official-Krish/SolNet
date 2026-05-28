# Transaction Indexer

Rust binary that monitors the Solana blockchain for Anchor program instructions, parses them, and pushes events to the backend and ws-relayer in real time.

## Modes

| Mode | Transport | Use Case |
|------|-----------|----------|
| **WebSocket** (default) | `logsSubscribe` via Solana WS endpoint | Devnet / testnet |
| **gRPC** (optional feature) | Yellowstone gRPC | Production / high throughput |

## How It Works

1. Subscribes to logs for the configured `PROGRAM_ID`
2. On each log entry, parses Anchor instruction signatures + Borsh arguments
3. Constructs a `ParsedEvent` with instruction name, accounts, and args
4. POSTs the event to:
   - `BACKEND_WEBHOOK_URL` (backend stores in DB)
   - `WS_RELAYER_URL` (ws-relayer broadcasts to frontend clients)

## Develop

```bash
cp .env.example .env && cargo run
```

## Environment

```
MODE=ws
SOLANA_WS_URL=wss://api.devnet.solana.com
SOLANA_HTTP_URL=https://api.devnet.solana.com
PROGRAM_ID=J7nyNjMR7p9Xi8ohzkNAFmnAeVUBb1AMpGKTFGtFvVjJ
BACKEND_WEBHOOK_URL=http://localhost:3000/api/v2/indexer/webhook
WS_RELAYER_URL=ws://localhost:9093
```

## Modules

| File | Description |
|------|-------------|
| `main.rs` | Entry point, mode dispatch |
| `config.rs` | Environment config loader |
| `ws.rs` | WebSocket logsSubscribe mode |
| `grpc.rs` | Yellowstone gRPC subscriber (feature-gated) |
| `parser.rs` | Anchor log → `ParsedEvent` |
| `instructions.rs` | Instruction discriminator definitions |
| `args.rs` | Borsh argument deserializer |
| `notifier.rs` | HTTP webhook dispatcher |
