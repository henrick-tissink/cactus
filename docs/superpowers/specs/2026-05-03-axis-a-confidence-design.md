# Axis A — Confidence

**Date:** 2026-05-03
**Parent:** [2026-05-03-100x-roadmap.md](2026-05-03-100x-roadmap.md)
**Status:** Draft, awaiting user review
**Effort:** 4–5 days
**Depth:** Solid (foundation-first ratcheted)

---

## Goal

No untested change ever reaches prod again. Today a single TypeScript error reached the production build. After Axis A, that fails in CI within 5 minutes of opening a PR, never on the box.

## Approach: foundation-first ratcheted

The roadmap's "≥80% coverage" target is correct as a destination. Achieving it on the existing 124-file untested codebase is 1–2 weeks of test-writing, not 2–3 days. So:

- **What lands in Axis A** (4–5 days): full test infrastructure, CI pipeline, deploy automation, pre-commit hooks, branch protection, **and** an initial coverage gate set just below today's measured coverage (after PR 1 establishes the baseline). The gate prevents regression from day one.
- **What ratchets afterward**: every subsequent axis (B, C, D, E, F) lands tests for the surface it touches. Whenever measured coverage crosses a 5% threshold (40 → 50 → 60 → 70 → 80), the gate bumps. By the end of Axis F, coverage targets are met without ever blocking other axes.

"Solid" therefore means *the gate is solid*, not that coverage is 80% on day one.

## Stack (locked)

### Backend testing
- **xUnit** + **FluentAssertions** + **Bogus** (test data factories)
- **Microsoft.AspNetCore.Mvc.Testing** + `WebApplicationFactory<Program>` for HTTP integration tests
- **Testcontainers.PostgreSql** for real Postgres per test assembly (NOT EF in-memory — too many discrepancies with EF Core 8 + Postgres semantics)
- **Respawn** for inter-test database reset
- **coverlet.collector** for coverage; output as Cobertura XML

### Frontend testing
- **Vitest** + `@vitest/coverage-v8`
- **@testing-library/react** + **@testing-library/user-event**
- **MSW** (Mock Service Worker) for API mocking
- **happy-dom** for DOM (faster than jsdom; switch to jsdom only if a test hits a feature happy-dom misses)

### CI/CD
- **GitHub Actions**
- Container registry: **GitHub Container Registry (ghcr.io)** under the same repo
- Image tagging: `:latest` (mutable, current main) + `:sha-<7-char-sha>` (immutable, for rollback)
- Deploy: SSH to server, update `IMAGE_TAG` in `/opt/cactus/.env`, `docker compose pull && docker compose up -d --no-build`

### Pre-commit
- **Husky** (root-level) + **lint-staged**
- Frontend: `eslint --fix` + `prettier --write` on staged `.ts`/`.tsx`
- Backend: `dotnet format --verify-no-changes --include <staged .cs files>`

### Branch protection
- `main` requires PR + green CI (`backend-test`, `frontend-test`, `backend-build`, `frontend-build`)
- Approval requirement skipped (solo dev); re-enable when collaborators arrive

### Coverage tooling
- Backend gate: `dotnet test /p:Threshold=N /p:ThresholdType=line` per project (`Cactus.Application.Tests` → measures `Cactus.Application`; `Cactus.Api.Tests` → measures `Cactus.Api`)
- Frontend gate: Vitest `coverage.thresholds` in `vitest.config.ts`
- Coverage diff visible in PRs via **Codecov** free tier (or, fallback, a GH Action that comments coverage delta)

## Architecture

### Backend test project layout

```
src/backend/tests/
├── Cactus.Application.Tests/
│   ├── Cactus.Application.Tests.csproj
│   ├── Auth/
│   │   ├── RegisterCommandHandlerTests.cs
│   │   └── LoginCommandHandlerTests.cs
│   ├── Goals/
│   │   ├── CreateGoalCommandHandlerTests.cs
│   │   ├── UpdateGoalProgressHandlerTests.cs
│   │   └── SetPrimaryGoalHandlerTests.cs
│   ├── Accounts/
│   ├── Transactions/
│   ├── SpendingPlans/
│   └── _Common/
│       ├── TestDataFactory.cs (Bogus generators)
│       └── HandlerTestBase.cs (mocks IUserContext, ICurrentTime, etc.)
└── Cactus.Api.Tests/
    ├── Cactus.Api.Tests.csproj
    ├── Fixtures/
    │   ├── CactusApiFactory.cs (WebApplicationFactory<Program> + Testcontainer)
    │   └── DatabaseFixture.cs (per-collection Testcontainer + Respawn)
    ├── Auth/
    │   └── AuthEndpointTests.cs
    ├── Accounts/
    ├── Goals/
    └── _Common/
        └── ApiTestBase.cs (HttpClient helper, JWT helper)
```

**Unit tests (`Cactus.Application.Tests`)**: handler logic with mocked dependencies (IRepository or DbContext). No DB. ~50–100 tests across all handlers.

**Integration tests (`Cactus.Api.Tests`)**: full HTTP pipeline against a real Postgres in a container. Use `[Collection]` to share one container per test assembly; `Respawn` resets DB state between tests. ~30–50 tests covering critical-path flows (register → login → create goal → update progress → list).

### Frontend test layout

```
src/frontend/src/
├── test/
│   ├── setup.ts (vitest globals + MSW startup)
│   ├── mocks/
│   │   ├── server.ts (MSW node server)
│   │   └── handlers.ts (default API handlers)
│   └── utils/
│       └── render.tsx (custom render with QueryClientProvider, Router, etc.)
└── pages/
    ├── Login.tsx
    ├── Login.test.tsx          ← new
    ├── Dashboard.tsx
    ├── Dashboard.test.tsx       ← new
    ├── Transactions.tsx
    ├── Transactions.test.tsx    ← new
    └── Goals.tsx
        Goals.test.tsx           ← new
```

Vitest discovers `*.test.tsx` colocated with source. Initial scope: 1 smoke test per critical page (renders without crashing) + 1 interactive test per page (form submit, filter change, modal open). ~12–20 tests total in PR 3.

### CI workflow shape

`.github/workflows/ci.yml` (runs on PR, push to non-main):

```yaml
jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '8.0.x' }
      - run: dotnet restore src/backend/Cactus.slnx
      - run: dotnet build src/backend/Cactus.slnx --no-restore -c Release
      - run: dotnet test src/backend/Cactus.slnx --no-build -c Release
              --collect:"XPlat Code Coverage"
              --results-directory ./coverage
      - uses: codecov/codecov-action@v4
        with: { directory: ./coverage }

  frontend-test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: src/frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm', cache-dependency-path: src/frontend/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc -b
      - run: npm test -- --coverage
      - run: npm run build
      - uses: codecov/codecov-action@v4
        with: { directory: src/frontend/coverage }

  backend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with: { context: src/backend, push: false }

  frontend-build:
    # similar to backend-build
```

`.github/workflows/deploy.yml` (runs on push to main):

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: src/backend
          push: true
          tags: |
            ghcr.io/henrick-tissink/cactus-api:latest
            ghcr.io/henrick-tissink/cactus-api:sha-${{ github.sha }}
      - uses: docker/build-push-action@v6
        with:
          context: src/frontend
          push: true
          tags: |
            ghcr.io/henrick-tissink/cactus-frontend:latest
            ghcr.io/henrick-tissink/cactus-frontend:sha-${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
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

### Deploy mechanics: switching to image-based

`docker-compose.prod.yml` gets two new lines per service:

```yaml
services:
  api:
    image: ghcr.io/henrick-tissink/cactus-api:${IMAGE_TAG:-latest}
    pull_policy: always
    # existing prod overrides remain
  frontend:
    image: ghcr.io/henrick-tissink/cactus-frontend:${IMAGE_TAG:-latest}
    pull_policy: always
```

Server-side prerequisite (one-time): `docker login ghcr.io -u henrick-tissink -p <PAT>` with a PAT scoped to `read:packages`. Stored in `/root/.docker/config.json`. Document this in the spec.

`/opt/cactus/.env` gains `IMAGE_TAG=...` (defaulted to `latest` until first deploy).

### Pre-commit hook details

Root-level `package.json` (new file) for repo-level tooling:

```json
{
  "name": "cactus-monorepo",
  "private": true,
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9",
    "lint-staged": "^15"
  },
  "lint-staged": {
    "src/frontend/**/*.{ts,tsx}": [
      "bash -c 'cd src/frontend && npx eslint --fix \"$@\"' --",
      "bash -c 'cd src/frontend && npx prettier --write \"$@\"' --"
    ]
  }
}
```

`.husky/pre-commit`:

```bash
#!/usr/bin/env sh
npx lint-staged

# Format check on staged .cs files only (fast — runs on diff, not whole tree)
staged_cs=$(git diff --cached --name-only --diff-filter=ACM | grep '\.cs$' | sed 's|^src/backend/||' || true)
if [ -n "$staged_cs" ]; then
  (cd src/backend && dotnet format --verify-no-changes --include $staged_cs) || {
    echo "dotnet format violations. Run: cd src/backend && dotnet format Cactus.slnx"
    exit 1
  }
fi
```

### Branch protection setup (one-time)

```bash
gh api repos/henrick-tissink/cactus/branches/main/protection \
  --method PUT \
  --raw-field required_status_checks='{"strict":true,"contexts":["backend-test","frontend-test","backend-build","frontend-build"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews= \
  --field restrictions=
```

Documented in the spec; executed once during PR 7.

### Coverage strategy

- **Baselines are measured after the bulk of initial tests land**: backend baseline at end of PR 2; frontend baseline at end of PR 3. (PR 1's coverage is too thin to be representative.)
- **Initial gate** = `floor(measured)` − 2% per project. Locked into csproj `<Threshold>` and `vitest.config.ts` during PR 7.
- **Ratchet rule**: when measured coverage crosses a multiple of 5 (e.g. 38% → 40%), the next PR bumps the gate.
- **Codecov PR comment** shows diff coverage so we know whether a PR added or removed.

## Decomposition into PRs

Each PR independently reviewable. Numbered in execution order; later PRs depend on earlier.

| PR | Scope | Done when |
|----|-------|-----------|
| **1** | Backend test project skeleton + Testcontainers + first integration tests for Auth (register, login happy/sad path) | `dotnet test` green; container boots in ≤10 s |
| **2** | `Cactus.Application.Tests` + unit tests for Auth, Goals, Accounts, Transactions, SpendingPlans handlers | Coverage ≥35% on `Cactus.Application` |
| **3** | Frontend Vitest + MSW + smoke tests for Login, Dashboard, Transactions, Goals | `npm test` green; 12–20 tests |
| **4** | `ci.yml` workflow (PR-time: backend-test, frontend-test, backend-build, frontend-build); ESLint + Prettier configs | Open a deliberate-fail PR — it fails in <5 min |
| **5** | Husky + lint-staged at root; pre-commit format/lint on staged files; root `package.json` | Commit with malformed code is rejected |
| **6** | `deploy.yml` workflow + `docker-compose.prod.yml` image references + GHCR auth on server + initial successful deploy | Merging a PR to main redeploys prod within 10 min |
| **7** | Branch protection on main + Codecov integration + initial coverage gate | A PR reducing coverage below the gate fails CI |

## Success criteria (verbatim from roadmap, plus the ratchet)

- A deliberately-broken PR (unused var or failing test) is blocked by CI within 5 minutes.
- A merge to main lands in prod within 10 minutes with no manual steps (after first-time secret setup).
- Initial backend gate ≥ baseline − 2%; initial frontend gate ≥ baseline − 2%.
- Coverage gate cannot regress without an explicit gate-lowering PR.

**End-state target** (delivered across the program, not Axis A): ≥80% line coverage per backend project and ≥60% on critical frontend pages.

## Out of scope for Axis A

- E2E tests with Playwright — deferred to Axis C.
- Mutation testing.
- Load tests.
- Performance budgeting (deferred to Axis C).
- Renaming the `tests/` directory or restructuring source tree.
- Migration off ASP.NET 8 / Postgres 16.
- Self-hosted CI runners (GH-hosted is sufficient for now).

## Risks & open questions

- **Testcontainers cold start adds ~5 s per test assembly run on CI.** Mitigation: collection-scoped fixture so the container boots once for all integration tests in `Cactus.Api.Tests`.
- **`appleboy/ssh-action` reliability**: third-party action. Acceptable for solo project; if it flakes, replace with native `ssh -i <key>` step using `webfactory/ssh-agent`.
- **Server-side GHCR authentication is a manual one-time step.** Documented; runbook executed during PR 6.
- **Codecov free tier limits** for private repos. If hit, fall back to GH Actions PR comment summarizing line/branch coverage from coverlet/v8 reports.
- **Husky 9 vs 8** — Husky 9 changed installation from `husky install` to `husky`. Spec uses 9.x syntax.
- **Open question — should Codecov be replaced upfront with self-hosted reporting?** Default: keep Codecov; switch only if free tier blocks.
- **Pre-commit hook scope** assumes you have node + dotnet installed locally. New devs need to `cd src/frontend && npm install` (which triggers `husky install` via the root `package.json`'s `prepare` script — note: root install must happen via `npm install` at repo root). Document in the post-Phase-0 README we'll add in C.

## Status & next step

Awaiting user review of this spec. Once approved, I'll invoke `superpowers:writing-plans` to produce the implementation plan, starting with PR 1 (backend test infrastructure).
