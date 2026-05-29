# `@Axion` — Web Services Monorepo

Turborepo monorepo managed with Bun. Contains all application services and shared packages for the Axion platform.

## Commands

```bash
bun install            # Install all dependencies
turbo build            # Build all packages & apps
turbo lint             # Lint all (excludes worker — see worker/README)
turbo dev              # Start all dev servers
```

## Structure

### Apps

| App | Port | Description |
|-----|------|-------------|
| `apps/backend` | 3000 | Express REST API |
| `apps/frontend` | 5173 | React SPA (Vite) |
| `apps/worker` | — | BullMQ background jobs |
| `apps/ws-relayer` | 9093 | WebSocket relay + SSH proxy |
| `apps/depin-ws-relayer` | 8080 | DePIN host communication |
| `apps/scripts` | — | Shell scripts for hosts |

### Packages

| Package | Description |
|---------|-------------|
| `packages/db` | Prisma client + PostgreSQL schema |
| `packages/types` | Shared Zod schemas |
| `packages/ui` | Shared React components (shadcn) |
| `packages/utilities` | Auth middleware, Redis helpers |
| `packages/eslint-config` | Shared lint configs |
| `packages/typescript-config` | Shared TS configs |

## Prerequisites

- Bun >= 1.2
- PostgreSQL
- Redis
