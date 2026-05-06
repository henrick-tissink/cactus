# Axis A PR 6 — Deploy Workflow + Image-Based Production Compose

**Date:** 2026-05-06
**Status:** Draft, awaiting user review
**Parent spec:** `docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md` § PR 6

---

## Why this doc exists

The parent Axis A design assigns PR 6 the scope "`deploy.yml` workflow + `docker-compose.prod.yml` image references + GHCR auth on server + initial successful deploy. Done when: merging a PR to main redeploys prod within 10 min." This refinement locks the open decisions: how compose files reach the server (option A: `scp` from CI), workflow trigger shape (`push: main` + `workflow_dispatch`), tag strategy (`latest` + `sha-<git-sha>`), and the one-time setup sequence the user must perform before merging.

---

## Decision summary

| # | Decision | Choice |
|---|----------|--------|
| 1 | Compose-file delivery to server | **Option A — `scp` in deploy.yml.** Server doesn't need git; compose always matches `main`; ~2s cost per deploy |
| 2 | Workflow triggers | `push` to `main` + `workflow_dispatch` (manual re-run for first-deploy debugging) |
| 3 | GHCR tag strategy | Both `latest` and `sha-<git-sha>` per image. Rollback path: edit `IMAGE_TAG` in `/opt/cactus/.env` |
| 4 | Database migrations | Auto-applied on api startup via `db.Database.MigrateAsync()` (`Cactus.Api/Program.cs:52`). No deploy-time step needed |
| 5 | Health check / smoke after deploy | None for now — Axis D concern |
| 6 | Automated rollback on failure | None for now — manual via SSH or `workflow_dispatch` re-run on older SHA |
| 7 | What gets redeployed | Only `api` and `frontend`. `postgres` and `caddy` left running |
| 8 | Action version pinning | `@v4` / `@v6` / `@v0.1.7` / `@v1.0.3` floats — not full SHA pins (deferred per PR 4 code-quality note) |
| 9 | SSH user | `root` (existing prod posture; matches `/opt/cactus` ownership) |
| 10 | Permissions | `build-and-push` job: `contents: read`, `packages: write`. `deploy` job: `contents: read` only |

---

## Architecture

A single workflow at `.github/workflows/deploy.yml` runs on every push to `main` (and on `workflow_dispatch`). It splits into two jobs:

**`build-and-push`** publishes Docker images for `api` and `frontend` to GitHub Container Registry. Tags both as `latest` and `sha-<git-sha>` so the workflow can roll forward and the operator can roll back to any prior commit's image. Uses GH Actions cache for Docker layer caching.

**`deploy`** (`needs: build-and-push`) `scp`s the latest compose files (`docker-compose.yml`, `docker-compose.prod.yml`) and the Caddyfile to `/opt/cactus/`, then SSHes to the box and runs:
1. Update or insert `IMAGE_TAG=sha-<sha>` in `/opt/cactus/.env`
2. `docker compose pull api frontend`
3. `docker compose up -d --no-build api frontend`
4. `docker image prune -f`

`docker-compose.prod.yml` gains `image: ghcr.io/henrick-tissink/cactus-{api,frontend}:${IMAGE_TAG:-latest}` plus `pull_policy: always` for the api and frontend services. The base `docker-compose.yml` retains `build:` directives so local dev still works (compose merges `image:` from prod over `build:` from base; `--no-build` ensures prod never rebuilds).

EF Core migrations run automatically on api container startup (existing behavior at `Cactus.Api/Program.cs:52`). No deploy-time migration step needed; if a migration fails the api container fails to start and manual intervention is required (see Rollback runbook).

---

## File inventory

| File | Status | Purpose |
|---|---|---|
| `.github/workflows/deploy.yml` | new | Two-job workflow: build-and-push to GHCR, then SSH-deploy to Hetzner |
| `docker-compose.prod.yml` | modify | Replace local-build with `image:` references + `pull_policy: always` for `api` and `frontend` |

Total new files: 1. Total modified files: 1.

---

## Workflow shape

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  build-and-push:
    name: Build and push images
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        include:
          - image: api
            context: src/backend
          - image: frontend
            context: src/frontend
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ${{ matrix.context }}
          push: true
          tags: |
            ghcr.io/henrick-tissink/cactus-${{ matrix.image }}:latest
            ghcr.io/henrick-tissink/cactus-${{ matrix.image }}:sha-${{ github.sha }}
          cache-from: type=gha,scope=${{ matrix.image }}
          cache-to: type=gha,mode=max,scope=${{ matrix.image }}

  deploy:
    name: Deploy to Hetzner
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Copy compose files to server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "docker-compose.yml,docker-compose.prod.yml,infrastructure/Caddyfile"
          target: /opt/cactus
          overwrite: true

      - name: SSH and redeploy
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            set -euo pipefail
            cd /opt/cactus
            if grep -q "^IMAGE_TAG=" .env; then
              sed -i "s|^IMAGE_TAG=.*|IMAGE_TAG=sha-${{ github.sha }}|" .env
            else
              echo "IMAGE_TAG=sha-${{ github.sha }}" >> .env
            fi
            docker compose -f docker-compose.yml -f docker-compose.prod.yml pull api frontend
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build api frontend
            docker image prune -f
```

Notes:
- Matrix in `build-and-push` builds api and frontend in parallel. Each gets its own GHA cache scope to avoid cross-image cache pollution.
- `appleboy/scp-action` uses the `source` field as a comma-separated list of paths relative to the workflow's checkout. The `infrastructure/Caddyfile` path is preserved on the server (the action recreates the `infrastructure/` subdirectory under `/opt/cactus/`).
- `set -euo pipefail` makes the SSH script fail fast on any error (good — surfaces secrets/PAT problems immediately).
- `--no-build` ensures the box never tries to build images locally; if `image:` resolution fails we want a hard error, not a silent fallback to `build:`.
- `docker image prune -f` cleans up old image layers after each deploy. Keeps disk usage bounded.

---

## `docker-compose.prod.yml` change

Current `api` block:
```yaml
  api:
    restart: unless-stopped
    ports: !reset []
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=...
      ...
```

New `api` block (add 2 lines):
```yaml
  api:
    image: ghcr.io/henrick-tissink/cactus-api:${IMAGE_TAG:-latest}
    pull_policy: always
    restart: unless-stopped
    ports: !reset []
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=...
      ...
```

Same for `frontend`:
```yaml
  frontend:
    image: ghcr.io/henrick-tissink/cactus-frontend:${IMAGE_TAG:-latest}
    pull_policy: always
    restart: unless-stopped
    ports: !reset []
    expose:
      - "80"
```

The `postgres` and `caddy` services are unchanged.

---

## One-time setup runbook (you, before merging PR 6)

1. **Generate dedicated deploy SSH key (locally):**
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/cactus-deploy -N "" -C "github-actions-deploy"
   ```

2. **Add public key to the box's `authorized_keys`** (uses your existing SSH access):
   ```bash
   ssh root@<hetzner-host> "cat >> /root/.ssh/authorized_keys" < ~/.ssh/cactus-deploy.pub
   ```

3. **Verify the new key works:**
   ```bash
   ssh -i ~/.ssh/cactus-deploy root@<hetzner-host> "echo ok"
   ```
   Expected: prints `ok`.

4. **Generate a GitHub PAT** at https://github.com/settings/tokens with scope `read:packages` only. Save the token securely — you'll need it for the next step and won't see it again.

5. **Server-side `docker login` to GHCR** (one-time; saves to `/root/.docker/config.json`):
   ```bash
   ssh root@<hetzner-host> "docker login ghcr.io -u henrick-tissink -p <PAT>"
   ```
   Expected: `Login Succeeded`.

6. **Add three GitHub repo secrets** at https://github.com/henrick-tissink/cactus/settings/secrets/actions:
   - `SSH_HOST` — Hetzner IP or hostname
   - `SSH_USER` — `root`
   - `SSH_PRIVATE_KEY` — paste the full contents of `~/.ssh/cactus-deploy` (the private key, including BEGIN/END lines)

7. **Confirm `/opt/cactus/.env` exists on the box** with the existing `POSTGRES_PASSWORD` and `JWT_KEY` lines. The deploy workflow will append/update `IMAGE_TAG=` automatically.

After this runbook is complete, merge PR 6. The workflow fires on push to `main`. Watch the run at the Actions tab.

---

## Rollback runbook (when a deploy breaks prod)

**Manual SSH rollback (fastest):**
```bash
ssh root@<hetzner-host>
cd /opt/cactus

# Find a known-good prior SHA (last green run on the Actions tab, or `git log` on the box if a clone exists locally — there isn't one by default)
sed -i 's|^IMAGE_TAG=.*|IMAGE_TAG=sha-<old-good-sha>|' .env

docker compose -f docker-compose.yml -f docker-compose.prod.yml pull api frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build api frontend
```

**`workflow_dispatch` re-run on older commit:** Go to the Actions tab → Deploy → Run workflow → pick a different ref. This rebuilds and redeploys from that ref. Slower (rebuild + push + deploy ~5-10 min) but doesn't require SSH.

Both options are manual. Automated rollback on health-check failure is Axis D scope.

---

## Success criteria

- First merge to `main` after PR 6 lands triggers `deploy.yml` automatically.
- GHCR registry shows `ghcr.io/henrick-tissink/cactus-api:latest`, `:sha-<sha>` (and same for `frontend`).
- Server pulls new images and restarts `api` + `frontend` containers within 10 minutes of merge.
- `cactusmoney.app` is reachable (HTTP 200 from `/health`) within 1 minute of container restart.
- Total time from merge to live: < 10 min.
- Zero manual steps after first-time setup.

**Out of scope:** zero-downtime deploys (frontend restart causes ~2–5s of 502s — acceptable). Database backups before deploy (Axis B). Health checks / auto-rollback (Axis D). Branch protection requiring deploy success (PR 7).

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| First deploy fails because a GitHub secret is misconfigured | High (first-time setup) | `workflow_dispatch` lets you fix the secret and re-run without a no-op commit. Setup runbook above is explicit about every secret. |
| GHCR push permission error | Low | Job-level `permissions: { packages: write }` is explicit. `GITHUB_TOKEN` automatically has the right scope when permissions are declared. |
| SSH connection refused / wrong host | Low | Setup runbook Step 3 verifies the new key works before declaring success. |
| Migration fails on api container startup → container restart loop | Medium | Manual intervention via Rollback runbook. Future: pre-deploy migration validation (Axis D). |
| Frontend container restart causes ~2–5s of 502s | High (every deploy) | Acceptable for non-zero-downtime scope; documented in Out of scope. Cloudflare's 522 retry behavior may further mitigate. |
| `appleboy/*` actions are external and not SHA-pinned | Low | Pinned to specific `@v0.1.7` / `@v1.0.3` minor.patch versions (not floating major tags). Full SHA pinning deferred per PR 4 code-quality note. |
| GHCR auth on server expires | Very Low (PATs are long-lived) | User re-runs `docker login ghcr.io` on the box. Document in CONTRIBUTING.md when one exists. |
| `docker compose pull` partial failure (api succeeds, frontend fails) | Low | `set -euo pipefail` causes immediate exit; `up -d --no-build` won't run. Containers stay on old version. Manual re-trigger via `workflow_dispatch`. |
| Cache poisoning via `cache-from: type=gha` | Negligible | Cache keyed by branch + Dockerfile hash. Public-repo cache is shared with PRs but read-only from PR perspective. |

---

## Verification (post-merge — your responsibility)

1. **Watch the first run on the Actions tab.** Both `build-and-push` jobs (api + frontend matrix) and the `deploy` job should turn green. Total time: ~5–8 min on a cold cache, ~2–3 min on a warm cache.

2. **Verify GHCR has the images.** Go to https://github.com/henrick-tissink/cactus/pkgs/container/cactus-api — should show two tags. Same for `cactus-frontend`.

3. **Verify the server is running new images:**
   ```bash
   ssh root@<hetzner-host>
   docker ps --format 'table {{.Names}}\t{{.Image}}'
   ```
   Expected: `cactus-api` and `cactus-frontend` both reference `ghcr.io/henrick-tissink/cactus-{api,frontend}:sha-<the-merged-sha>`.

4. **Verify `cactusmoney.app` is up:** open the URL in a browser, log in, see the dashboard. (5s).

5. **Verify `IMAGE_TAG` was updated in `.env`:**
   ```bash
   ssh root@<hetzner-host> "grep IMAGE_TAG /opt/cactus/.env"
   ```

If any step fails: see Rollback runbook.

---

## Open questions

None remaining. All ten decisions in the table at the top are locked.
