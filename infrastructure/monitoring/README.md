# Monitoring Setup (Uptime Kuma)

Uptime Kuma provides lightweight uptime monitoring and alerting for all production services.

## Deployment

### Option A: Docker Compose (standalone)

```bash
cd infrastructure/monitoring
docker compose up -d
```

Access the dashboard at `http://<server-ip>:3001`.

### Option B: Coolify

1. Create a new Docker Compose service in Coolify
2. Paste the contents of `docker-compose.yml`
3. Deploy — Coolify handles networking and SSL

## Monitors to Configure

After first launch, create an admin account, then add these monitors:

| Monitor | Type | URL / Host | Interval |
|---|---|---|---|
| Storefront | HTTP(s) | `https://<storefront-domain>/api/health` | 60s |
| Storefront (deep) | HTTP(s) | `https://<storefront-domain>/api/health?verbose=true` | 300s |
| Backend | HTTP(s) | `https://<backend-domain>/health` | 60s |
| PostgreSQL | TCP Port | `<db-host>:5432` | 60s |
| Redis | TCP Port | `<redis-host>:6379` | 60s |
| MeiliSearch | HTTP(s) | `http://<meili-host>:7700/health` | 60s |

For the storefront health monitor, set **accepted status codes** to `200` so that a `503` (unhealthy) triggers an alert.

## Notifications

Configure at least one notification channel under **Settings → Notifications**:

- **Email** (SMTP) — for on-call alerts
- **Slack / Discord webhook** — for team visibility
- **Ntfy / Pushover** — for mobile push notifications

Assign the notification channel to each monitor.

## Status Page (Optional)

Uptime Kuma can serve a public status page. Create one under **Status Pages** and add all monitors. Useful for sharing uptime info with stakeholders.
