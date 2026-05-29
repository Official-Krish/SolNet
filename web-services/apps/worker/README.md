# `@Axion/worker` — Background Job Processor

BullMQ worker that processes VM provisioning and DePIN host lifecycle jobs. Communicates with the Solana smart contract via Anchor and provisions GCP Compute Engine instances.

## Queues

| Queue | Description |
|-------|-------------|
| `vm-termination` | End rental session + delete GCP instance |
| `initialise-host-pda` | Create DePIN host PDA on-chain |
| `changeVMStatus` | Update host machine status on-chain |
| `terminate-depin-vm` | Terminate DePIN-hosted VM |

## Develop

```bash
bun install
bun run index.ts
```

## Environment

```
PRIVATE_KEY=<base58 wallet private key>
SECRET_KEY=<base58 vault wallet key>
PROJECT_ID=<gcp-project-id>
WS_URL=ws://localhost:8080
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
SOLANA_RPC_URL=http://localhost:8899
```

## Notes

- Runs as a headless consumer (no HTTP server)
- `@solana/wallet-adapter-react` intentionally removed — this is a Bun process, not a browser app
- Lint excluded from `turbo lint` due to `@google-cloud/compute` type weight; lint with `bun run lint` directly
