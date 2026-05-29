# `@Axion/db` — Database Schema & Client

Prisma ORM package for PostgreSQL. Defines all data models and exposes the generated client.

## Models

| Model | Description |
|-------|-------------|
| `User` | Wallet-based user accounts (email, pubkey, JWT) |
| `VMInstance` | Virtual machine instances (provider, region, status, pricing) |
| `VMConfig` | VM configuration (CPU, RAM, disk, ports) |
| `VMImage` | Pre-configured Docker / OS images |
| `VMTypes` | Available VM pricing tiers |
| `DepinHostMachine` | DePIN host registrations (specs, status, rewards) |

## Commands

```bash
bunx prisma migrate dev   # Apply migrations
bunx prisma generate      # Generate client
bunx prisma studio        # Admin UI
```

## Usage

```ts
import prisma from "@Axion/db";
const users = await prisma.user.findMany();
```
