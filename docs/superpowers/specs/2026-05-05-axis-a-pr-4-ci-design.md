# Axis A PR 4 — CI Workflow Design (refinement)

**Date:** 2026-05-05
**Status:** Draft, awaiting user review
**Parent spec:** `docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md` § PR 4

---

## Why this doc exists

The parent Axis A design doc sketches a CI workflow shape but leaves several decisions open: how to handle the pre-existing lint errors that block a green merge, the exact Prettier integration depth, whether `dotnet format` is gated, Codecov upload scope, and concurrency/caching defaults. This refinement locks those decisions and decomposes the work into one tiny pre-PR plus PR 4 proper.

This doc is a refinement, not a re-spec. The parent doc remains authoritative on the broader Axis A goals and PR sequencing.

---

## Decision summary

| # | Decision | Choice |
|---|----------|--------|
| 1 | Lint-error remediation strategy | Pre-PR (`fix: lint + format baseline before CI`) before PR 4 — keeps PR 4 atomic |
| 2 | Prettier integration depth | Minimal — `.prettierrc.json` + `format:check` script. No `eslint-config-prettier` (current ESLint config has no formatting rules to disable) |
| 3 | Backend format gate | Yes — `dotnet format --verify-no-changes` runs in `backend-test`. Symmetric to frontend `lint` |
| 4 | Codecov scope | Upload both backend and frontend coverage in PR 4. Repo is public; tokenless upload works |
| 5 | OS / Node / .NET / caching / concurrency | `ubuntu-latest`; Node 22; .NET 8.0.x; npm + NuGet caches; `cancel-in-progress: true` per ref |

---

## Pre-PR — `fix: lint + format baseline before CI`

A small, focused PR that exists solely to make `npm run lint` and `dotnet format --verify-no-changes` exit 0 on `main` so PR 4 can land green. Reviewable in seconds.

### Frontend lint fixes (6 errors)

Located via `npm run lint` output:

| Where | Error | Fix |
|-------|-------|-----|
| `src/pages/Login.tsx:96` | `'err' is defined but never used` | Replace `} catch (err) {` with `} catch {` (modern TS allows this) |
| `src/pages/Register.tsx:57` | `'err' is defined but never used` | Same — drop the binding |
| `src/pages/ForgotPassword.tsx:16` | `Calling setState synchronously within an effect can trigger cascading renders` | Move the `setState` outside the effect or guard with prior-state comparison; case-by-case inspection |
| `src/pages/ResetPassword.tsx:52` | Same | Same |
| `src/pages/VerifyEmail.tsx:12` | Same | Same |
| `src/pages/Transactions.tsx:582` | `Calling setState from useMemo may trigger an infinite loop` | Refactor: replace `useMemo` with `useEffect` for the side effect, or derive the value without state — must inspect to choose |

The 4 hook-rule errors are real React anti-patterns; the implementer must understand each call site before applying a fix. The 2 unused-`err` errors are mechanical.

### Frontend ESLint config tweak

Add `coverage` to global ignores in `eslint.config.js` so post-`test:coverage` lint runs don't trip on generated HTML reports.

### Backend format baseline

Run `dotnet format src/backend/Cactus.slnx` once. This applies whitespace + import-ordering changes only (no semantic changes — `dotnet format --verify-no-changes` exits 0 afterward). Inspect diff before commit; if >100 lines, split per project for reviewability.

### Pre-PR success criteria

- `cd src/frontend && npm run lint` exits 0
- `dotnet format src/backend/Cactus.slnx --verify-no-changes` exits 0
- All existing tests green: `npm test` (12 frontend), `dotnet test src/backend/Cactus.slnx` (full backend suite)
- No behavioral regressions in the 4 React pages whose hooks were touched (manual smoke recommended)

### What this PR does NOT do

- Add CI workflow (that's PR 4)
- Add Prettier (that's PR 4)
- Lock branch protection (that's PR 7)

---

## PR 4 — `Axis A PR 4: CI workflow + Prettier config`

Lands the actual CI pipeline plus the minimal Prettier configuration.

### File inventory

| File | Status | Purpose |
|------|--------|---------|
| `.github/workflows/ci.yml` | new | 4-job CI pipeline |
| `src/frontend/.prettierrc.json` | new | Formatting rules — match existing de-facto style |
| `src/frontend/.prettierignore` | new | Ignore `dist`, `coverage`, `node_modules`, lock files |
| `src/frontend/package.json` | modify | Add `prettier` devDep + `format` / `format:check` scripts |

### Workflow shape (`ci.yml`)

```yaml
name: CI
on:
  pull_request:
  push:
    branches-ignore: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
          cache: true
          cache-dependency-path: src/backend/**/packages.lock.json
      - run: dotnet restore src/backend/Cactus.slnx
      - run: dotnet format src/backend/Cactus.slnx --verify-no-changes --severity error
      - run: dotnet build src/backend/Cactus.slnx --no-restore -c Release
      - run: |
          dotnet test src/backend/Cactus.slnx --no-build -c Release \
            --collect:"XPlat Code Coverage" --results-directory ./coverage
      - uses: codecov/codecov-action@v4
        with:
          directory: ./coverage
          flags: backend

  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
          cache-dependency-path: src/frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npx tsc -b
      - run: npm test -- --coverage
      - run: npm run build
      - uses: codecov/codecov-action@v4
        with:
          directory: src/frontend/coverage
          flags: frontend

  backend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: src/backend
          push: false

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: src/frontend
          push: false
```

Notes:
- `setup-dotnet` cache is configured but degrades gracefully if `packages.lock.json` files don't exist yet — first runs are slower, no failure.
- `dotnet format --severity error` only fails CI on errors (not info/warning suggestions). The pre-PR baseline ensures clean state at merge time.
- `codecov/codecov-action@v4` uses tokenless upload for public repos. If reliability becomes a problem after merge, add `CODECOV_TOKEN` to repo secrets and reference via `with: token: ${{ secrets.CODECOV_TOKEN }}`.
- The two `*-build` jobs are deliberately separate from `*-test` so test failures don't block discovering build breakages.

### Prettier configuration

`src/frontend/.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

These mirror the existing codebase's de-facto style as observed in `Login.tsx`, `Dashboard.tsx`, `Transactions.tsx`, `Goals.tsx`, etc. Choosing them this way produces zero or near-zero diff when `prettier --check` runs against the current source — the format gate becomes meaningful for *future* changes without churning what's there.

`src/frontend/.prettierignore`:

```
dist
coverage
node_modules
package-lock.json
```

`package.json` script additions:

```json
"format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
"format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\""
```

### Verification of the pre-existing-style assumption

Before committing the `.prettierrc.json`, run `npx prettier --check 'src/**/*.{ts,tsx,css,json}'` against the codebase. If it reports more than ~5 files needing format changes, treat the diff as part of the pre-PR (Q1's option A scope expands slightly) rather than letting Prettier reformat the world inside PR 4. This keeps PR 4 atomic.

If 0–5 files drift, run `prettier --write` on those files and include the changes in PR 4 itself — small enough to review in-flight.

### Out of scope

- Branch protection rules (PR 7)
- Codecov gate / threshold (PR 7 — this PR just uploads)
- Husky / lint-staged / pre-commit hooks (PR 5)
- Deploy workflow / Docker push to GHCR (PR 6)
- Multi-OS matrix
- Dependabot / Renovate
- Build-artifact upload beyond coverage
- Speeding up cold-start runs (no-cache or no-restore optimizations)

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| `dotnet format` baseline diff is unexpectedly large | Low–Medium (codebase is small and consistently authored) | Inspect diff before commit; split per project if >100 lines |
| Codecov tokenless upload flakes intermittently | Medium | If it fails twice on consecutive `main` runs, add `CODECOV_TOKEN` secret and switch to authenticated upload — single-line change. Build the GH Actions PR-comment fallback only if Codecov becomes systemically unreliable |
| `setup-dotnet` cache miss because no `packages.lock.json` exists yet | High (first runs) | Acceptable; PR 7 can add lock files if cache misses become noticeable. CI still works, just slower |
| The 4 React-hook fixes in the pre-PR change runtime behavior | Low–Medium | Pre-PR success criteria require manual smoke of the 4 affected pages before merge. Each fix is a localized refactor |
| Prettier rules drift from de-facto codebase style and produce a large reformatting diff | Low (rules chosen to match observed style) | Pre-flight `prettier --check`; absorb 0–5 file fixups into PR 4, route larger drift back into the pre-PR |
| Concurrency cancel-in-progress kills a long-running test suite mid-flight on rapid pushes | Low | Acceptable — saved minutes outweigh the cost of one re-run; the canceled run would have been superseded anyway |

---

## Success criteria

**Pre-PR done when:**
- `npm run lint` exits 0 from `src/frontend/`
- `dotnet format src/backend/Cactus.slnx --verify-no-changes` exits 0
- All previously-passing tests still pass
- Manual smoke of the 4 React pages with hook fixes shows no behavioral regression

**PR 4 done when (per parent spec):**
- All 4 CI jobs run on every PR and complete in <5 min on green
- Codecov shows both backend and frontend coverage after PR 4 merges
- A deliberately-broken PR (introduced unused var or failing test) fails CI in <5 min — *user verification step after PR 4 merges, not part of the PR itself*

---

## Open questions

None remaining. All five decisions in the table at the top are locked.
