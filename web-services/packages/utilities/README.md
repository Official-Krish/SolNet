# `@decloud/utilities` — Shared Utilities

Common utilities shared across backend and worker apps.

## Modules

| File | Description |
|------|-------------|
| `authMiddleware.ts` | Express JWT auth middleware — verifies Bearer token, attaches user to `req`, returns 401 on expiry / 403 on invalid |
| `redis.ts` | Redis connection singleton + BullMQ queue definitions (`vm-termination`, `initialise-host-pda`, `changeVMStatus`, `terminate-depin-vm`) |

## Usage

```ts
import { authMiddleware } from "@decloud/utilities";
import { redisConnection } from "@decloud/utilities/redis";
```
