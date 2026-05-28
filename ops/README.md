# Kubernetes Manifests

Production deployment manifests for the Axion platform on a Kubernetes cluster (namespace: `decloud`).

## Components

| Manifest | Resource | Description |
|----------|----------|-------------|
| `deployment.yml` | Deployments | 6 deployments: frontend, backend, worker, ws-relayer, depin-ws-relayer, redis |
| `service.yml` | Services | ClusterIP services for frontend (80), backend (80), ws-relayer (80), depin-ws-relayer (80), redis (6379) |
| `ingress.yml` | Ingress | nginx ingress with 4 host rules |
| `certificate.yml` | Certificate | cert-manager Let's Encrypt TLS certs |
| `secrets.yml` | Secrets | Base64-encoded env vars per service + GCP service account key |

## Domains

| Host | Service |
|------|---------|
| `decloud.krishlabs.tech` | Frontend |
| `api.decloud.krishlabs.tech` | Backend API |
| `wss.decloud.krishlabs.tech` | WebSocket relay |
| `wss.depin.decloud.krishlabs.tech` | DePIN WebSocket relay |

## Apply

```bash
kubectl apply -f ops/
kubectl get pods -n decloud
```

## Images

All images hosted on Docker Hub under `krishanand01/` and built via multi-stage Dockerfiles in `web-services/docker/`.
