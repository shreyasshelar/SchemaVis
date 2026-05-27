# Home Server Setup Guide

## Prerequisites on your home server

```bash
# 1. Install k3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# 2. Copy kubeconfig so kubectl works as your user
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config

# 3. Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 4. Install GitHub Actions self-hosted runner
# Go to: https://github.com/shreyasshelar/schema-vis/settings/actions/runners/new
# Follow the Linux instructions — label the runner: home-server
```

## GitHub Repository Secrets

Set these in: GitHub repo → Settings → Secrets and variables → Actions

| Secret              | Description                                  |
|---------------------|----------------------------------------------|
| `DB_PASSWORD`       | PostgreSQL password (min 20 chars)           |
| `JWT_SECRET`        | JWT signing secret (min 32 chars)            |
| `GEMINI_API_KEY`    | Google Gemini API key                        |
| `CF_TUNNEL_TOKEN`   | Cloudflare tunnel token (see below)          |

Set this as a **variable** (not secret):

| Variable      | Example value              |
|---------------|----------------------------|
| `CF_HOSTNAME`  | `schema-vis.yourdomain.com` |

## Cloudflare Tunnel Setup (one-time)

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com) → Networks → Tunnels
2. Click **Create a tunnel** → name it `schema-vis`
3. On the **Install connector** page, copy the tunnel token
4. Add it to GitHub secrets as `CF_TUNNEL_TOKEN`
5. Under **Public Hostname** tab, add:
   - **Subdomain**: `schema-vis` (or whatever you want)
   - **Domain**: your domain
   - **Service**: `http://schema-vis-frontend.schema-vis.svc.cluster.local:80`
   - Or just use `http://schema-vis-frontend:80` (resolves inside the namespace)

## First deploy (manual)

```bash
helm upgrade --install schema-vis ./helm/schema-vis \
  --namespace schema-vis \
  --create-namespace \
  --set backend.secrets.SPRING_DATASOURCE_PASSWORD="<your-db-password>" \
  --set backend.secrets.JWT_SECRET="<your-jwt-secret>" \
  --set backend.secrets.GEMINI_API_KEY="<your-gemini-key>" \
  --set cloudflared.tunnelToken="<your-tunnel-token>" \
  --set cloudflared.hostname="schema-vis.yourdomain.com"
```

## Verify

```bash
kubectl get pods -n schema-vis
kubectl logs -n schema-vis -l app.kubernetes.io/component=cloudflared
```

Once cloudflared pods are `Running`, visit `https://schema-vis.yourdomain.com`.
