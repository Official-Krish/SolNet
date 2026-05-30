# `@Axion/types` — Shared TypeScript Types

Zod validation schemas and TypeScript types shared across apps. Centralizes API request/response shapes to ensure type safety between frontend and backend.

## Contents

- `index.ts` — Zod schemas for all API contracts
- Re-exported as `@Axion/types` for workspace consumption

## Usage

```ts
import { signinSchema } from "@Axion/types";
const data = signinSchema.parse(req.body);
```
