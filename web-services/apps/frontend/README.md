# `@Axion/frontend` — React SPA

React 19 + TypeScript + Vite 7 SPA with TailwindCSS 4, shadcn/ui, and Framer Motion. Integrates Solana wallet (WalletAdapter) and real-time WebSocket updates.

## Pages (29)

Landing, Dashboard, RentVm, vmDetail, deployImage, Host, HostDashboard, HostMachine, HostMachineDetails, Hosting, ClaimRewards, Admin, Billing, Profile, Notifications, Terminal, Status, About, Blog, Careers, Contact, Docs, FAQ, Legal, Roadmap, Tutorials, ApiReference, Signin, Signup

## Develop

```bash
bun install
bun dev        # :5173 with HMR
bun run build  # Production build
bun run lint   # ESLint
```

## Environment

```
VITE_BACKEND_URL=http://localhost:3000
VITE_WS_RELAYER_URL=ws://localhost:9093
VITE_SOLANA_RPC_URL=http://localhost:8899
VITE_PROGRAM_ID=J7nyNjMR7p9Xi8ohzkNAFmnAeVUBb1AMpGKTFGtFvVjJ
```

## Key Libraries

- `@solana/web3.js` + `@solana/wallet-adapter-react` — Solana wallet
- `@coral-xyz/anchor` — Program client
- `motion` (Framer Motion) — Animations
- `three` + `three-globe` — 3D globe visualization
- `@xterm/xterm` + `@xterm/addon-fit` — Browser SSH terminal
- `@radix-ui/*` + `shadcn/ui` — Component primitives
