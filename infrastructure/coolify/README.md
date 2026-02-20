# Coolify Deployment & Branch Strategy

## Branch Strategy

```
feature branches → PR to staging → staging (auto-deploys to staging env)
                                  → PR to master → master (auto-deploys to production)
```

- **`staging`** — integration branch. Merging here triggers a staging deployment.
- **`master`** — production branch. Merging here triggers a production deployment.
- **Feature branches** — short-lived branches for individual changes. Open PRs against `staging`.

## Coolify Setup

You need **two Coolify applications per service** (storefront + backend = 4 total):

| Application | Branch | Domain |
|---|---|---|
| Storefront (staging) | `staging` | `staging.example.com` |
| Storefront (production) | `master` | `www.example.com` |
| Backend (staging) | `staging` | `api-staging.example.com` |
| Backend (production) | `master` | `api.example.com` |

### Per-application Coolify configuration

1. **Source**: Connect to the GitHub repo
2. **Build**: Set Dockerfile path (`apps/storefront/Dockerfile` or `apps/backend/Dockerfile`), build context to `/` (repo root)
3. **Branch**: Set the branch to watch (`staging` or `master`)
4. **Webhook**: Enable the Coolify webhook — copy the webhook URL for CI
5. **Environment variables**: Set per-environment values (database URLs, API keys, etc.)
6. **Health check**: Coolify will use the Docker HEALTHCHECK defined in each Dockerfile

## Required GitHub Secrets

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `COOLIFY_STAGING_WEBHOOK_URL` | Coolify webhook URL for the staging application |
| `COOLIFY_PRODUCTION_WEBHOOK_URL` | Coolify webhook URL for the production application |

The CI pipeline (`.github/workflows/ci.yml`) calls these webhooks after a successful build + security audit on the corresponding branch.

## Environment Isolation

Staging and production should use **separate databases and Redis instances** (or at minimum, separate Redis key prefixes). Ensure environment variables are configured independently in each Coolify application.

Refer to `docs/environment.md` for the full list of required environment variables.
