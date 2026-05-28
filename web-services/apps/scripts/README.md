# `@decloud/scripts` — Host Onboarding & Verification

Shell scripts executed on DePIN host machines for automated setup and health verification.

## Scripts

| Script | Description |
|--------|-------------|
| `onboard.sh` | Registers a host machine with the Axion network — installs Docker, connects to depin-ws-relayer, reports specs |
| `verification_script.sh` | Validates host machine health — checks Docker runtime, network latency, disk I/O, and reports results to backend |
