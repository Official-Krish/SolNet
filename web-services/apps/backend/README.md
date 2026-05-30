# `@Axion/backend` — REST API Server

Express.js REST API running on Bun (port 3000). Handles user auth, VM provisioning, DePIN management, and indexer webhook ingestion.

## Routes

| Route | Description |
|-------|-------------|
| `/api/v2/user` | Signup, signin, profile |
| `/api/v2/vmInstance` | VM instance CRUD |
| `/api/v2/vm` | VM types & images |
| `/api/v2/user/depin` | DePIN host management |
| `/api/v2/indexer` | Indexer webhook ingestion |

## Develop

```bash
bun install
bun dev        # Hot-reload
bun run index.ts  # Production start
```

## Environment

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
SOLANA_RPC_URL=http://localhost:8899
PROGRAM_ID=J7nyNjMR7p9Xi8ohzkNAFmnAeVUBb1AMpGKTFGtFvVjJ
```

## Key Files

- `index.ts` — Express app setup + middleware
- `routes/` — Route handlers per domain
- `utils/` — VM provisioning, pricing, middleware
