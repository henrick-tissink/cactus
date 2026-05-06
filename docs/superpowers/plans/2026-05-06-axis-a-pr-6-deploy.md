# Axis A PR 6 — Deploy Workflow + Image-Based Production Compose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 2-job deploy workflow (`build-and-push` to GHCR, then `deploy` via SSH to Hetzner) and switch `docker-compose.prod.yml` from local-build to image-based for `api` and `frontend`. After merge, every push to `main` redeploys prod within 10 min with no manual steps (post one-time setup).

**Architecture:** Single workflow at `.github/workflows/deploy.yml` triggers on `push: main` and `workflow_dispatch`. `build-and-push` builds api + frontend images via a matrix (parallel), tagging both `latest` and `sha-<git-sha>`, pushing to GHCR with GHA layer caching. `deploy` (`needs: build-and-push`) `scp`s compose files + Caddyfile to `/opt/cactus/`, then SSH-runs the IMAGE_TAG update + `docker compose pull` + `up -d --no-build` + image prune. `docker-compose.prod.yml` adds `image:` + `pull_policy: always` for api and frontend; base `docker-compose.yml` retains `build:` for local dev.

**Tech Stack:** GitHub Actions · GHCR · `docker/build-push-action@v6` with GHA cache · `appleboy/scp-action@v0.1.7` · `appleboy/ssh-action@v1.0.3` · Docker Compose merge semantics

**Branch:** `axis-a/pr-6-deploy`

**Spec reference:** `docs/superpowers/specs/2026-05-06-axis-a-pr-6-deploy-design.md`

**Critical user-side prerequisite:** The PR opens with a body explicitly instructing the user to complete the one-time setup runbook (SSH key generation, server-side `docker login`, GitHub secrets) BEFORE merging. The first deploy fires immediately on merge; if secrets are missing the deploy job fails — recoverable via `workflow_dispatch` re-run after fixing.

---

## File structure

```
.github/workflows/
└── deploy.yml                 (new — 2-job: build-and-push + deploy)

docker-compose.prod.yml         (modify — add image: + pull_policy: always to api and frontend)
```

**Total new files:** 1. **Total modified files:** 1.

---

## Task 0: Worktree + branch

The controller creates the worktree before dispatching the implementer.

Working directory: `/Users/henricktissink/Sauce/cactus/.worktrees/axis-a-pr-6`
Branch: `axis-a/pr-6-deploy` (branched from `main`).

If executing inline:

```bash
cd /Users/henricktissink/Sauce/cactus
git worktree add .worktrees/axis-a-pr-6 -b axis-a/pr-6-deploy main
cd .worktrees/axis-a-pr-6
```

---

## Task 1: Modify `docker-compose.prod.yml`

**Files:**
- Modify: `docker-compose.prod.yml`

- [ ] **Step 1: Read current contents to confirm starting state**

```bash
cat docker-compose.prod.yml
```

Expected: 46 lines, services `postgres`, `api`, `frontend`, `caddy` plus volumes block. The `api` service starts at line 10 with `restart: unless-stopped`, ports/environment/etc. The `frontend` service starts at line 22.

If the file structure differs significantly from the spec's reproduction (`docs/superpowers/specs/2026-05-06-axis-a-pr-6-deploy-design.md` § "`docker-compose.prod.yml` change"), STOP and report — the surrounding line numbers or service names may have drifted.

- [ ] **Step 2: Add `image:` and `pull_policy:` to the `api` service**

Find:
```yaml
  api:
    restart: unless-stopped
```

Replace with:
```yaml
  api:
    image: ghcr.io/henrick-tissink/cactus-api:${IMAGE_TAG:-latest}
    pull_policy: always
    restart: unless-stopped
```

(Two new lines inserted between `api:` and `restart: unless-stopped`. The rest of the api block — ports, environment — is unchanged.)

- [ ] **Step 3: Add `image:` and `pull_policy:` to the `frontend` service**

Find:
```yaml
  frontend:
    restart: unless-stopped
    ports: !reset []
    expose:
      - "80"
```

Replace with:
```yaml
  frontend:
    image: ghcr.io/henrick-tissink/cactus-frontend:${IMAGE_TAG:-latest}
    pull_policy: always
    restart: unless-stopped
    ports: !reset []
    expose:
      - "80"
```

(Same two new lines inserted between `frontend:` and `restart: unless-stopped`.)

- [ ] **Step 4: Validate YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('docker-compose.prod.yml'))" && echo "YAML OK"
```
Expected: `YAML OK`. If parsing errors, fix indentation.

- [ ] **Step 5: Validate compose merge produces expected result**

Use `docker compose config` to merge base + prod and inspect the resulting api/frontend services:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml config 2>&1 | grep -A 3 "^  api:\|^  frontend:" | head -20
```

Expected output includes both services with `image: ghcr.io/henrick-tissink/cactus-api:latest` and `image: ghcr.io/henrick-tissink/cactus-frontend:latest` (because `IMAGE_TAG` is unset, so `${IMAGE_TAG:-latest}` resolves to `latest`).

If `docker compose config` errors out about missing env vars (`POSTGRES_PASSWORD`, `JWT_KEY`), set placeholder values for the validation:
```bash
POSTGRES_PASSWORD=x JWT_KEY=x docker compose -f docker-compose.yml -f docker-compose.prod.yml config 2>&1 | grep -A 3 "image:" | head -10
```

Confirm both `api` and `frontend` services have `image: ghcr.io/henrick-tissink/cactus-{api,frontend}:latest` in the merged output.

If `docker compose` isn't available locally, skip this step and note it in the report — CI's docker-build job will catch any compose-merge issues post-push (well, actually CI doesn't run compose merge; this is the only place it's validated, so try harder to run it).

- [ ] **Step 6: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "ci(deploy): switch prod compose to GHCR image references"
```

---

## Task 2: Create `.github/workflows/deploy.yml`

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Verify `.github/workflows/` directory exists**

```bash
ls -la .github/workflows/
```
Expected: `ci.yml` is present (from PR 4). The directory exists.

- [ ] **Step 2: Write `deploy.yml`**

Create `.github/workflows/deploy.yml` with this exact content:

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

Notes for the implementer (do NOT modify the file based on these — they're context, not instructions):
- Matrix builds api + frontend in parallel with separate GHA cache scopes.
- `appleboy/scp-action`'s `source` field is comma-separated paths relative to the workflow checkout. The action recreates the `infrastructure/` subdirectory structure under `/opt/cactus/`.
- `set -euo pipefail` makes the SSH script fail fast on any command error (catches missing secrets, PAT expiry, compose errors immediately).
- `--no-build` ensures the box never tries to build — if image resolution fails we want a hard error.
- `docker image prune -f` keeps the box's disk usage bounded after each deploy (removes dangling layers).

- [ ] **Step 3: Validate YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "YAML OK"
```
Expected: `YAML OK`. If python3/yaml unavailable, fall back to:
```bash
grep -E "^[a-z]" .github/workflows/deploy.yml | head
```
Confirm `name:`, `on:`, `permissions:`, `jobs:` appear at column 0.

- [ ] **Step 4: Verify the matrix and secret references look right**

Spot-check that:
```bash
grep -c "matrix.image" .github/workflows/deploy.yml
```
Returns `5` (used 5 times in the file: 2 in matrix definition, 1 each in tags and cache-from/cache-to).

```bash
grep -c "secrets\." .github/workflows/deploy.yml
```
Returns `7` (`GITHUB_TOKEN` ×1, `SSH_HOST` ×2, `SSH_USER` ×2, `SSH_PRIVATE_KEY` ×2).

If counts differ, re-read the file content from Step 2 and re-write.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(deploy): add 2-job workflow for GHCR build/push + Hetzner deploy"
```

---

## Task 3: Local pre-push verification

**Files:**
- None (verification only)

This task can't end-to-end test the deploy (that requires GitHub-side execution, secrets, the Hetzner box). What it CAN do: prove the YAML is valid, the compose merge produces the expected shape, and the existing CI pipeline (from PR 4) still passes for this branch's other changes.

- [ ] **Step 1: Confirm both YAML files validate**

From repo root:
```bash
python3 -c "import yaml; yaml.safe_load(open('docker-compose.prod.yml')); yaml.safe_load(open('.github/workflows/deploy.yml')); print('both YAML files parse')"
```
Expected: `both YAML files parse`.

- [ ] **Step 2: Run the existing CI pipeline locally to confirm no regressions**

The PR 4 CI workflow runs lint, type-check, tests, and build for both projects. Run them locally to confirm the prod-compose change didn't break anything (it shouldn't — compose changes don't affect application code, but compose-config validity matters).

Frontend (from `src/frontend/`):
```bash
npm ci
npm run lint
npm run format:check
npx tsc -b
npm run test:coverage
npm run build
```
All 6 should exit 0. Tests: 12/12.

Backend (from worktree root). Use `DOTNET_ROLL_FORWARD=LatestMajor` if "no .NET 8 runtime" appears (per pre-PR 4 post-execution notes):
```bash
dotnet restore src/backend/Cactus.slnx
dotnet format src/backend/Cactus.slnx --verify-no-changes --severity error
dotnet build src/backend/Cactus.slnx --no-restore -c Release
dotnet test src/backend/Cactus.slnx --no-build -c Release
```
All 4 should exit 0. Tests: 28/28.

- [ ] **Step 3: Verify Docker builds still succeed locally** (the existing CI's `*-build` jobs run these)

```bash
docker buildx build --load src/backend
docker buildx build --load src/frontend
```
Both should complete with `Successfully built` (or `naming to docker.io/library/...` for buildx). If Docker isn't running locally, skip with a note — CI's frontend-build/backend-build jobs will exercise this on push.

- [ ] **Step 4: No commit**

Verification only.

---

## Task 4: Push branch + open PR + watch CI

**Files:**
- None (process step)

The deploy.yml workflow itself only fires on `push: main` and `workflow_dispatch` — NOT on PR. So the first real test of `deploy.yml` is post-merge. On the PR itself, only the existing `ci.yml` workflow runs (lint, test, build for both projects).

- [ ] **Step 1: Push the branch**

```bash
git push -u origin axis-a/pr-6-deploy
```

The push triggers `ci.yml` on this branch (per PR 4's `push: branches-ignore: [main]` trigger).

- [ ] **Step 2: Open the PR with explicit setup-runbook callout**

```bash
gh pr create --title "Axis A PR 6: Deploy workflow + image-based prod compose" --body "$(cat <<'EOF'
## Summary
- Adds `.github/workflows/deploy.yml` with a 2-job pipeline: `build-and-push` (matrix-builds api + frontend, pushes to GHCR with `latest` and `sha-<git-sha>` tags), then `deploy` (`scp`s compose files to `/opt/cactus`, SSHes in, updates `IMAGE_TAG` in `.env`, pulls images, restarts containers).
- Refactors `docker-compose.prod.yml` to reference GHCR images instead of local `build:`.
- Triggers: `push: main` + `workflow_dispatch` (manual re-run for debugging).
- Tagged tokenless GHCR push (repo is public).

## ⚠️ One-time setup required BEFORE merging
The first deploy fires immediately on merge. If secrets are missing or the SSH key isn't on the box, the deploy job fails (recoverable via `workflow_dispatch` re-run).

**Complete this runbook from `docs/superpowers/specs/2026-05-06-axis-a-pr-6-deploy-design.md` § "One-time setup runbook" before merging:**
1. \`ssh-keygen -t ed25519 -f ~/.ssh/cactus-deploy -N "" -C "github-actions-deploy"\`
2. Add public key to box's authorized_keys
3. Test the new key works
4. Generate GitHub PAT (scope: \`read:packages\`)
5. Run \`docker login ghcr.io\` on the box with the PAT
6. Add three GitHub repo secrets: \`SSH_HOST\`, \`SSH_USER\`, \`SSH_PRIVATE_KEY\`
7. Confirm \`/opt/cactus/.env\` has the existing \`POSTGRES_PASSWORD\` and \`JWT_KEY\` lines

## Verification (post-merge — your responsibility)
- Watch the first run on the Actions tab. Both \`build-and-push\` jobs (api + frontend) and the \`deploy\` job should turn green. Total: ~5–8 min cold cache.
- Verify GHCR has the images: https://github.com/henrick-tissink/cactus/pkgs/container/cactus-api
- SSH to the box: \`docker ps --format 'table {{.Names}}\\t{{.Image}}'\` shows \`ghcr.io/...:sha-<merged-sha>\`
- Confirm \`cactusmoney.app\` is reachable

## Out of scope
- Health-check / auto-rollback on deploy failure (Axis D)
- Zero-downtime deploys (~2–5s of 502s on frontend restart is acceptable)
- Database backups before deploy (Axis B)
- Branch protection requiring deploy success (PR 7)

## Rollback path
If a deploy breaks prod:
\`\`\`
ssh root@<box>
cd /opt/cactus
sed -i 's|^IMAGE_TAG=.*|IMAGE_TAG=sha-<known-good-sha>|' .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull api frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build api frontend
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh auth status` reports not logged in, the user must `gh auth login` interactively before this step. The push in Step 1 uses git's stored credentials and works without `gh`.

- [ ] **Step 3: Watch the existing `ci.yml` run on the PR's branch**

The push triggered `ci.yml`. Use the public Actions API since gh isn't authenticated:

```bash
sleep 20
curl -s "https://api.github.com/repos/henrick-tissink/cactus/actions/runs?branch=axis-a/pr-6-deploy&per_page=3" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for r in data.get('workflow_runs', [])[:3]:
    print(f\"#{r['run_number']} {r['name']} status={r['status']} conclusion={r['conclusion']} sha={r['head_sha'][:7]}\")
"
```

Wait for completion (poll every 60s for up to 5 min). Expected: `ci.yml` run completes with all 4 jobs green (Backend test, Frontend test, Backend Docker build, Frontend Docker build). The Docker build jobs in particular validate the Dockerfiles still build cleanly — important since the deploy workflow will use the same Dockerfiles.

The `Deploy` workflow itself does NOT run on this PR (it's gated to `push: main`). It will only fire after merge.

- [ ] **Step 4: Report PR URL + CI outcome**

Final report should include:
- PR URL
- `ci.yml` run number + outcome (4/4 green expected)
- Confirmation that `deploy.yml` did NOT run on this PR (correct — it's gated to main)

---

## Self-review checklist

**Spec coverage** (against `2026-05-06-axis-a-pr-6-deploy-design.md`):

| Spec line | Plan task |
|-----------|-----------|
| `.github/workflows/deploy.yml` with 2-job structure | Task 2 |
| `build-and-push` matrix (api + frontend, parallel) | Task 2 (matrix block in YAML) |
| Tags `latest` + `sha-<git-sha>` | Task 2 (tags multi-line YAML) |
| GHA layer caching (`type=gha`, `mode=max`, scoped per image) | Task 2 |
| `deploy` job uses `scp-action` for compose files | Task 2 |
| `deploy` job uses `ssh-action` for compose pull/up/prune | Task 2 |
| `set -euo pipefail` in SSH script | Task 2 |
| `IMAGE_TAG=sha-<sha>` update via grep + sed | Task 2 |
| `docker-compose.prod.yml` adds `image:` + `pull_policy: always` to api + frontend | Task 1 |
| Triggers `push: main` + `workflow_dispatch` | Task 2 |
| Permissions: `contents: read` workflow-level; `packages: write` on build-and-push only | Task 2 |
| Action versions: `@v4`, `@v6`, `@v0.1.7`, `@v1.0.3` | Task 2 |
| One-time setup runbook visible in PR body | Task 4 step 2 |
| Rollback path documented in PR body | Task 4 step 2 |
| Verify YAML + compose merge before push | Tasks 1 step 5, 2 step 3, 3 step 1 |
| Local CI parity check (lint/test/build for both projects) | Task 3 step 2 |
| Local Docker build smoke | Task 3 step 3 |
| Watch `ci.yml` on the branch (deploy.yml only fires post-merge) | Task 4 step 3 |

**Placeholder scan:** No "TBD"/"implement later"/"add validation"/"similar to Task N." Task 1 step 1's "STOP and report if structure differs" is a real defensive check, not a hand-wave. Task 4 step 2's PR body uses HEREDOC with literal escaping for backticks.

**Type/name consistency:**
- Image names: `cactus-api`, `cactus-frontend` (matrix `image` values + GHCR repo names + compose `image:` references) match across Tasks 1 and 2.
- Tag format `sha-${{ github.sha }}` consistent in deploy.yml's `tags:` block and SSH script's `IMAGE_TAG=` write.
- Secret names: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` consistent across deploy.yml and PR body.
- Compose paths in scp-action source: `docker-compose.yml,docker-compose.prod.yml,infrastructure/Caddyfile` (no spaces — comma-separated).

**Risks flagged in the plan:**
- Task 1 step 5: `docker compose config` may complain about missing env vars; the workaround `POSTGRES_PASSWORD=x JWT_KEY=x docker compose ...` is documented inline.
- Task 3: full Docker build smoke is optional if Docker isn't running locally; CI catches it on push.
- Task 4: deploy.yml does NOT run on this PR; the first end-to-end test is post-merge, contingent on the user having completed the setup runbook. The PR body makes this explicit.
- The runbook itself (SSH key generation, `docker login`, GitHub secrets) is the user's responsibility — the implementer does not run those steps.

---

## Post-execution notes (added 2026-05-06)

PR 6 merged as squash commit `57b06df`. First post-merge deploy required four iterations to go green; lessons below.

- **GHCR images are public by default for public repos — `docker login ghcr.io` on the server is unnecessary.** Step 4–5 of the spec's one-time setup runbook (PAT generation + `docker login`) can be skipped entirely. Verified on the box: `docker pull ghcr.io/henrick-tissink/cactus-{api,frontend}:latest` succeeded anonymously. Note: this assumes the package's visibility was inherited from the repo's public visibility (true today). If a future repo turns private, the PAT step comes back.
- **`appleboy/scp-action` reports specific error messages; trust them.** First failure: `Error: can't connect without a private SSH key or password` (exact match for empty `SSH_PRIVATE_KEY`). Second: `missing server host` (empty `SSH_HOST`). Third: `ssh: handshake failed: ... unable to authenticate, attempted methods [none publickey]` (private key in secret didn't match a public key in box's `authorized_keys`). Each of these maps cleanly to a single fix; future debugs should jump straight to the action's stderr line.
- **Plan's Task 1 Step 4 / Task 2 Step 3 use `python yaml.safe_load`, which trips on compose's `!reset` tag.** The compose file is structurally valid; safe_load just doesn't know about compose extensions. Future plans touching compose YAML should use `docker compose config` instead, or register the custom tags via `yaml.SafeLoader.add_constructor`.
- **Plan's Task 2 Step 4 expected `grep -c "matrix.image"` to return 5; actual is 4.** Plan author miscounted the `${{ matrix.image }}` references. The deploy.yml file content matches the plan's verbatim YAML exactly; the count is just wrong.
- **First-deploy debugging cycle is fast via `workflow_dispatch`.** Each iteration was ~30s (cached builds + skip-on-deploy-fail). Total time across 4 attempts to get green: ~10 min including setup-runbook execution. The `workflow_dispatch` trigger genuinely earned its keep here.
- **IDE-mediated key exposure is a real pattern to watch for.** When the user opens a private key file in their IDE and selects its contents, the editor surfaces the selection to the agent via system-reminders. Both v1 and v2 of the deploy key were exposed this way during this session. Mitigation strategies for future secret rotations: (a) generate the key in a terminal that the IDE doesn't watch, (b) copy via `pbcopy` directly without opening the file in the editor, (c) treat any selected secret as compromised and rotate. CONTRIBUTING.md (when one exists) should call out this pattern.
- **`/opt/cactus/` on the box has stale `src/`, `docs/`, etc. from the prior manual-rsync regime.** The new image-based deploy only refreshes `docker-compose*.yml` and `infrastructure/Caddyfile` via scp. The leftover source tree is harmless (containers run from images, not from this filesystem) but cosmetically odd. Future cleanup PR could `rm -rf` everything except the compose files, .env, and infrastructure/.
- **API health check works internally but is not exposed via Caddy.** `/api/health` returns 404 from the public side; the api container's own healthcheck (`wget http://localhost:8080/health`) reports `(healthy)` from `docker ps`. Acceptable today (API health is for container-orchestrator consumption); Axis D (observability) will likely want an external-facing health endpoint for uptime monitoring.
- **Initial deploy timing on cold cache: ~5–6 min total.** `build-and-push` matrix builds run in parallel: backend ~3 min, frontend ~2 min cold; `deploy` job ~30s. Subsequent deploys with warm GHA cache: ~1–2 min total.
- **Reviewer's polish suggestions still deferred:** concurrency guard (`concurrency: deploy-prod, cancel-in-progress: false`) and `infrastructure/Caddyfile` post-scp existence check. Both worth picking up in PR 7 or a small follow-up.
