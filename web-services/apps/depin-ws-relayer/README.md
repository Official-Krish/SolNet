# `@decloud/depin-ws-relayer` — DePIN Host WebSocket Relay

Bun WebSocket server (port 8080) for communication with registered DePIN host machines. Handles job dispatch (start/stop Docker containers), status reporting, and host authentication.

## Protocols

| Message Type | Description |
|-------------|-------------|
| `start-job` | Deploy a Docker container on a host |
| `end-job` | Terminate a running job |
| `job-status` | Host reports container status |
| `status` | Heartbeat / health check |

## Develop

```bash
bun install
bun dev
```

## Environment

```
PORT=8080
JWT_SECRET=...
DATABASE_URL=postgresql://...
```
