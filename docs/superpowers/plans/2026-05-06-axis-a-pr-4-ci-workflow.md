# Axis A PR 4 — CI Workflow + Prettier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `.github/workflows/ci.yml` (4 jobs: backend-test, frontend-test, backend-build, frontend-build) and minimal Prettier configuration to the frontend so every PR is gated by lint + format + type-check + tests + build for both projects, with coverage uploaded to Codecov.

**Architecture:** A single PR-time workflow with four parallel jobs, all on `ubuntu-latest`. Frontend Prettier is configured via `.prettierrc.json` at the frontend root with `prettier --check` wired into both an npm script and the workflow's `frontend-test` job. No `eslint-config-prettier` integration — the existing ESLint config has no formatting rules to disable. Codecov upload is tokenless (repo is public) and tagged with `flags: backend|frontend` so PR 7's gate can distinguish project coverage.

**Tech Stack:** GitHub Actions · Codecov · Prettier 3.x · `actions/setup-node@v4` · `actions/setup-dotnet@v4` · `docker/build-push-action@v6` · `codecov/codecov-action@v4`

**Branch:** `axis-a/pr-4-ci-workflow`

**Spec reference:** `docs/superpowers/specs/2026-05-05-axis-a-pr-4-ci-design.md` (parent: `docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md` § PR 4)

**Prerequisite:** Pre-PR 4 (lint + dotnet format baseline) — already merged. Both gates exit 0 on `main`. PR 4 can therefore be a pure CI-config change.

**Verification mode:** Local sanity-checks every script the workflow runs, but the *workflow itself* can only be verified by pushing — the first CI run on the open PR is the real test. Iterate on the same PR if it fails.

---

## File structure

```
.github/
└── workflows/
    └── ci.yml                            (new — 4-job CI pipeline)

src/frontend/
├── .prettierrc.json                      (new — minimal formatting rules)
├── .prettierignore                       (new — ignore dist/coverage/node_modules)
└── package.json                          (modify — add prettier devDep + 2 scripts)
```

**Total new files:** 3. **Total modified files:** 1 (`package.json` only). If Task 3's pre-flight `prettier --check` reports 0–5 file drift, those frontend files are added to PR 4 as in-flight format fixups (logged in the report); if drift is >5 files, STOP and the controller decides whether to retighten rules or escalate.

---

## Task 0: Worktree + branch

The controller creates the worktree before dispatching the implementer.

Working directory for all subsequent tasks: `/Users/henricktissink/Sauce/cactus/.worktrees/axis-a-pr-4`
Branch: `axis-a/pr-4-ci-workflow` (branched from `main`).

If executing inline:

```bash
cd /Users/henricktissink/Sauce/cactus
git worktree add .worktrees/axis-a-pr-4 -b axis-a/pr-4-ci-workflow main
cd .worktrees/axis-a-pr-4/src/frontend
npm install
```

All subsequent paths are relative to the worktree root.

---

## Task 1: Install Prettier + add format scripts

**Files:**
- Modify: `src/frontend/package.json`

- [ ] **Step 1: Install Prettier as devDep**

From the worktree root:

```bash
cd src/frontend
npm install --save-dev prettier@^3.4.2
```

Version pinned to `^3.4.2` — current stable line at writing time, compatible with React 19/TS 5.9.

- [ ] **Step 2: Add scripts to `package.json`**

Edit `src/frontend/package.json`. The `"scripts"` block currently reads (after pre-PR 4):

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

Replace with:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\""
}
```

- [ ] **Step 3: Verify install**

```bash
npx prettier --version
```
Expected: prints something like `3.4.x`.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/package.json src/frontend/package-lock.json
git commit -m "chore(frontend): add prettier devDep + format scripts"
```

---

## Task 2: Create Prettier config files

**Files:**
- Create: `src/frontend/.prettierrc.json`
- Create: `src/frontend/.prettierignore`

These rules are chosen to mirror the existing codebase's de-facto style (single quotes, semis, 2-space indent) so the format gate becomes meaningful for *future* changes without churning what's there.

- [ ] **Step 1: Write `.prettierrc.json`**

Create `src/frontend/.prettierrc.json` with this exact content:

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

- [ ] **Step 2: Write `.prettierignore`**

Create `src/frontend/.prettierignore` with this exact content:

```
dist
coverage
node_modules
package-lock.json
```

- [ ] **Step 3: No commit yet**

The next task (Task 3) runs `prettier --check` and may need to absorb 0–5 file fixups. Commit those together with this config so the history shows "config + initial conformance" as one logical step.

---

## Task 3: Pre-flight `prettier --check` and absorb minor drift

**Files:**
- Possibly modify: 0–5 frontend source files (if Prettier disagrees with existing formatting)

**Why this task exists:** The Prettier rules in Task 2 were chosen to match observed codebase style, but no human has actually run `prettier --check` against the codebase before. There may be small drift (one trailing comma here, one bracket spacing there) that needs to be reformatted in this PR so `format:check` exits 0 at merge time.

- [ ] **Step 1: Run `prettier --check`**

```bash
cd src/frontend
npm run format:check
```

Capture the output. Possible results:
- **Exit 0**: codebase matches the rules exactly. Skip to Task 4.
- **Exit 1**: prints "Code style issues found in N files." Note the file list.

- [ ] **Step 2: Decision branch on drift size**

- If **N ≤ 5 files**: proceed to Step 3 (reformat in-flight).
- If **N > 5 files**: STOP and report DONE_WITH_CONCERNS with the file list. The controller will decide whether to:
  - (a) Tighten rules in `.prettierrc.json` to match existing style more closely (e.g., switch `trailingComma` from `"es5"` to `"none"`).
  - (b) Accept the larger reformat in this PR (split into a per-file or per-directory commit run for reviewability).
  - (c) Move the reformat into a separate "format baseline" follow-up PR.

  Do NOT reformat unilaterally if N > 5.

- [ ] **Step 3: Reformat (if N ≤ 5)**

```bash
npm run format
```

This rewrites the offending files in place. Inspect the diff:

```bash
git diff --stat
```

Confirm:
- Total line count is small (~10–30 lines per file is typical for trivial drift).
- No semantic changes (only whitespace, quote style, trailing commas).

- [ ] **Step 4: Re-run check**

```bash
npm run format:check
```
Expected: exit 0.

- [ ] **Step 5: Commit Tasks 2 + 3 together**

```bash
git add src/frontend/.prettierrc.json src/frontend/.prettierignore
# If Task 3 reformatted files, also include them:
git add -u src/frontend/src
git commit -m "chore(frontend): add prettier config + initial conformance"
```

If Task 3 made no changes (N=0), the commit only includes the two new config files; same message is fine.

---

## Task 4: Create the CI workflow file

**Files:**
- Create: `.github/workflows/ci.yml`

This is the meat of the PR. The workflow has four jobs: `backend-test`, `frontend-test`, `backend-build`, `frontend-build`. All run on every PR and every push to a non-`main` branch.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml` with this exact content:

```yaml
name: CI

on:
  pull_request:
  push:
    branches-ignore:
      - main

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  backend-test:
    name: Backend test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
          cache: true
          cache-dependency-path: src/backend/**/packages.lock.json

      - name: Restore
        run: dotnet restore src/backend/Cactus.slnx

      - name: Verify formatting
        run: dotnet format src/backend/Cactus.slnx --verify-no-changes --severity error

      - name: Build
        run: dotnet build src/backend/Cactus.slnx --no-restore -c Release

      - name: Test
        run: |
          dotnet test src/backend/Cactus.slnx --no-build -c Release \
            --collect:"XPlat Code Coverage" \
            --results-directory ./coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          directory: ./coverage
          flags: backend
          fail_ci_if_error: false

  frontend-test:
    name: Frontend test
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

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Type-check
        run: npx tsc -b

      - name: Test (with coverage)
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          directory: src/frontend/coverage
          flags: frontend
          fail_ci_if_error: false

  backend-build:
    name: Backend Docker build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: src/backend
          push: false

  frontend-build:
    name: Frontend Docker build
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
- `fail_ci_if_error: false` on the Codecov steps — uploading is best-effort; a Codecov outage shouldn't fail CI. PR 7 will tighten this when the gate goes live.
- `setup-dotnet` caches based on `packages.lock.json`. None exist yet in this repo; cache will degrade gracefully (first runs slower, no failure). PR 7 may add `<RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>` if cache misses become annoying.
- Concurrency group `ci-${{ github.ref }}` ensures rapid pushes cancel the previous in-flight run on the same branch. New PRs and pushes to other branches run independently.
- Triggers exclude `push: { branches: [main] }` because main's pipeline (PR 6's `deploy.yml`) handles main pushes. PRs into main still run via the `pull_request` trigger.
- Jobs are intentionally separate (not depending on each other via `needs:`) so all four run in parallel — total CI time is bounded by the slowest job.

- [ ] **Step 2: Validate YAML syntax locally**

```bash
# From repo root:
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML OK"
```
Expected: `YAML OK`. If it errors, the YAML is malformed — fix indentation.

If `python3` or `yaml` isn't available, fall back to:
```bash
cat .github/workflows/ci.yml | grep -E "^[a-z]" | head
```
At minimum confirm `name:`, `on:`, `concurrency:`, `permissions:`, `jobs:` appear at column 0.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add PR-time workflow for backend + frontend test/build"
```

---

## Task 5: Local pre-push verification

**Files:**
- None (verification only)

Run every command the workflow will run, locally, to confirm the workflow shape is sound. If anything fails locally, the CI run will fail too — fix it before pushing.

- [ ] **Step 1: Frontend pipeline**

From `src/frontend/`:

```bash
npm ci
npm run lint
npm run format:check
npx tsc -b
npm run test:coverage
npm run build
```

Expected: all 6 commands exit 0. Test count: 12/12 passing. Build produces `dist/`. Coverage produces `coverage/lcov.info`.

If `npm ci` reports peer-dep conflicts with the new `prettier@^3.4.2` install, those are real install-time issues that would also break CI — STOP and report.

- [ ] **Step 2: Backend pipeline**

From repo root:

```bash
dotnet restore src/backend/Cactus.slnx
dotnet format src/backend/Cactus.slnx --verify-no-changes --severity error
dotnet build src/backend/Cactus.slnx --no-restore -c Release
dotnet test src/backend/Cactus.slnx --no-build -c Release \
  --collect:"XPlat Code Coverage" \
  --results-directory ./coverage-local
```

Use `DOTNET_ROLL_FORWARD=LatestMajor` prefix on each command if "no .NET 8 runtime found" errors appear locally. (Per pre-PR 4 post-execution notes: needed for `dotnet test` on the dev machine; not needed in CI.)

Expected: all 4 commands exit 0. Test count: 28 passing (24 Application + 4 Api). Coverage written to `./coverage-local`.

- [ ] **Step 3: Docker builds**

From repo root:

```bash
docker buildx build --load src/backend
docker buildx build --load src/frontend
```

Expected: both builds succeed. (`--load` ensures the image is built locally without pushing.)

If Docker isn't running or `buildx` isn't installed locally, this step can be skipped with a note in the report — the CI runner has both. Don't push if other steps failed though.

- [ ] **Step 4: Clean up**

```bash
rm -rf coverage-local
```

(The `coverage/` directories from `npm run test:coverage` and `dotnet test` are gitignored already; no commit needed.)

- [ ] **Step 5: No commit**

Verification only.

---

## Task 6: Push branch + open PR + observe first CI run

**Files:**
- None (process step)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin axis-a/pr-4-ci-workflow
```

Pushing the branch with `.github/workflows/ci.yml` triggers the workflow's `push` trigger. The CI will start running on the branch immediately.

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Axis A PR 4: CI workflow + Prettier config" --body "$(cat <<'EOF'
## Summary
- Adds `.github/workflows/ci.yml` with 4 parallel jobs (backend-test, frontend-test, backend-build, frontend-build) running on every PR and push (except to `main`).
- Adds minimal Prettier config (`src/frontend/.prettierrc.json`) + `format` / `format:check` scripts; CI's frontend job runs `npm run format:check`.
- Codecov upload (tokenless, repo is public) for both backend (.NET coverlet) and frontend (vitest lcov) coverage. Flags: `backend`, `frontend`. PR 7 will lock the gate.
- Concurrency: in-progress runs on the same ref are cancelled when a new push arrives.

## Why
Per Axis A § PR 4: "No untested change ever reaches prod again. Today a single TypeScript error reached the production build. After Axis A, that fails in CI within 5 minutes of opening a PR, never on the box." This PR makes that real for everything subsequent.

## Verification (per spec)
- [x] All scripts run locally on this branch:
  - Frontend: `npm ci && npm run lint && npm run format:check && npx tsc -b && npm run test:coverage && npm run build` — all green
  - Backend: `dotnet restore && dotnet format --verify-no-changes --severity error && dotnet build && dotnet test` — all green (28/28 tests pass)
  - Docker: `docker buildx build src/backend` and `src/frontend` — both succeed
- [ ] CI run on this PR completes in <5 min and all 4 jobs are green (verified live on the PR)
- [ ] **Verification step deferred to user (post-merge):** open a deliberately-broken PR (introduce an unused var or a failing test) and confirm CI fails in <5 min

## Out of scope (per spec)
- Branch protection rules (PR 7)
- Codecov gate / coverage thresholds (PR 7)
- Husky / lint-staged pre-commit hooks (PR 5)
- Deploy workflow (`deploy.yml`) and Docker push to GHCR (PR 6)

## Caveats
- `setup-dotnet` cache requires `packages.lock.json` files, which don't exist yet — first runs will be slower but still functional.
- If Codecov tokenless upload becomes flaky, add a `CODECOV_TOKEN` secret and reference it via `with: token: ${{ secrets.CODECOV_TOKEN }}`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh auth status` reports not logged in, the user must `gh auth login` interactively before this step. The push in Step 1 uses git's stored credentials and works without `gh`.

- [ ] **Step 3: Watch the first CI run**

The push from Step 1 triggers the workflow on the branch, AND opening the PR in Step 2 also triggers it on the PR. They may de-duplicate via concurrency, or two runs may appear briefly.

```bash
gh run list --branch axis-a/pr-4-ci-workflow --limit 5
```

Watch for completion:
```bash
gh run watch
```

(Or visit the PR URL and refresh the Checks tab.)

- [ ] **Step 4: Iterate if jobs fail**

Most likely failure modes and how to handle:
1. **`actions/setup-dotnet@v4` warns about missing lock files**: warning only, not a failure. Ignore.
2. **`dotnet format` exits non-zero** even though local was green: format check is environment-sensitive in some edge cases (CRLF vs LF on Windows-authored files); we set `endOfLine: "lf"` in Prettier but `dotnet format` is C#-side. If this fires, inspect the failing files and either fix locally + push, or relax the severity to `info` temporarily and tighten in a follow-up.
3. **`docker/build-push-action@v6` fails on missing build context**: confirm `src/backend/Dockerfile` and `src/frontend/Dockerfile` exist (they do at HEAD of `main`).
4. **Codecov upload fails with rate-limit or auth error**: `fail_ci_if_error: false` means CI still passes. Document in the PR comments and address in a follow-up if needed.

For any unexpected failure, push a fix to the same branch:

```bash
# Edit the offending file
git add .github/workflows/ci.yml
git commit -m "ci: fix <specific failure>"
git push
```

Concurrency will cancel the in-flight run and start a fresh one.

- [ ] **Step 5: Report PR URL + CI outcome**

Once all 4 jobs are green on the PR, report:
- PR URL
- Total CI run time (target: <5 min)
- Codecov status (uploaded both projects? or skipped due to upload failure?)

---

## Self-review checklist

**Spec coverage** (against `2026-05-05-axis-a-pr-4-ci-design.md`):

| Spec line | Plan task |
|-----------|-----------|
| `.github/workflows/ci.yml` | Task 4 |
| 4 jobs (backend-test, frontend-test, backend-build, frontend-build) | Task 4 |
| Triggers: `pull_request` + `push: branches-ignore: [main]` | Task 4 |
| Concurrency `cancel-in-progress: true` per ref | Task 4 |
| `setup-node@v4` Node 22 + npm cache | Task 4 |
| `setup-dotnet@v4` .NET 8.0.x + NuGet cache | Task 4 |
| `dotnet format --verify-no-changes` in backend-test | Task 4 |
| `npm run lint` + `npm run format:check` in frontend-test | Task 4 |
| Codecov upload both projects (tokenless) with `flags` | Task 4 |
| `docker/build-push-action@v6` with `push: false` | Task 4 |
| `.prettierrc.json` + `.prettierignore` + `format` / `format:check` scripts | Tasks 1, 2 |
| Pre-flight `prettier --check` to absorb 0–5 file drift | Task 3 |
| Local sanity-check before push | Task 5 |
| Open PR + watch first CI run | Task 6 |

**Placeholder scan:** No "TBD"/"implement later"/"add validation"/"similar to Task N." Task 3's "STOP and report DONE_WITH_CONCERNS if N > 5" is a real branching condition with a concrete threshold. Task 6 step 4 lists the four most likely failure modes with concrete diagnostic steps — not a hand-wave.

**Type/name consistency:**
- Workflow job names (`backend-test`, `frontend-test`, `backend-build`, `frontend-build`) match the spec's table.
- `flags: backend` / `flags: frontend` Codecov labels match the spec's PR 7 reference.
- `concurrency.group: ci-${{ github.ref }}` matches the spec verbatim.
- `format` and `format:check` script names used identically across Task 1 (definition), Task 3 (pre-flight), Task 5 (local verification), Task 4 (workflow consumes `npm run format:check`).

**Risks flagged in the plan:**
- Task 3: drift size unknown until `prettier --check` runs. Decision branch handles small (≤5) and large (>5) cases.
- Task 4: workflow correctness can only be verified post-push. Task 5 mitigates by running every script the workflow calls, locally.
- Task 6: if CI fails on first push, iteration on the same PR is the planned path — not blocking.
- Local-environment quirks (`DOTNET_ROLL_FORWARD=LatestMajor`) are flagged but irrelevant in CI.

---

## Post-execution notes (added 2026-05-06)

- **Task 3 — Prettier drift was 21 files, not the expected ≤5.** Codebase had never been formatted; the implementer correctly STOPPED at the safety gate. Controller authorized option (a) — apply `npm run format`, confirm cosmetic-only (404 insertions / 287 deletions, no semantic edits across spot-checked files), and commit in two parts: `chore(frontend): add prettier config` (config files only) + `chore(frontend): apply prettier format conformance` (21 reformatted files). The 2-commit split kept the rules change reviewable in isolation from the larger reformat.
- **Task 4 — Codecov action version is one major behind.** Code-quality reviewer flagged `codecov/codecov-action@v4`; v5 has been GA since Q4 2024. Tokenless OSS upload still works but deprecation warnings will eventually fire. Tracked for PR 7 alongside the gate wire-up.
- **Task 6 — first CI run failed at `actions/setup-dotnet@v4` cache step.** `cache: true` with `cache-dependency-path: src/backend/**/packages.lock.json` is a hard error (not a warning) when zero matching lock files exist. The code-quality reviewer flagged this as a *warning* concern; reality was harder — fail-fast. Fix: stripped `cache: true` and `cache-dependency-path:` from the backend setup-dotnet step. Frontend's `setup-node` cache kept (real `package-lock.json` exists). Single follow-up commit `db73d99 ci: disable NuGet cache (no lock files yet — defer to PR 7)` resolved it; second CI run was 4/4 green in 95 seconds. Lesson for future setup-dotnet usage: `cache: true` requires a confirmed-existing dependency file, not a wildcard glob over a may-or-may-not-exist set.
- **Prettier resolved to 3.8.3, not 3.4.x.** `^3.4.2` semver caret allowed up to <4.0.0; npm pulled the latest (3.8.3 at the time). Behavior identical; flagged for accuracy.
- **`prettier --check` glob excludes root configs.** `src/**/*.{ts,tsx,css,json}` matches files under `src/frontend/src/` only. Root-level `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `tsconfig*.json` are unformatted. Acceptable for now (they change rarely); if a future contributor touches them, format won't be applied. PR 5 (husky/lint-staged) or a small follow-up PR can widen the glob.
- **CI total runtime on green: ~95 seconds.** Well under the spec's <5 min target. Backend test job is the slowest (~80s — NuGet restore from scratch is the bottleneck without caching). PR 7's lock-file generation could shave 30s+ off the cold-start time.
- **`actions/setup-node@v4`'s npm cache works correctly** because `src/frontend/package-lock.json` exists. No fix needed there; only the .NET side hit the missing-lock-file issue.
- **Verification step from the spec — "deliberately-broken PR fails CI in <5 min" — remains a user-side post-merge verification.** Not yet performed; the green CI run on this PR's HEAD demonstrates the happy path works, but the failure path (a typo or unused var fails CI quickly) is still uneverified by external test.
- **Workflow correctly does nothing on push-to-main.** This is intentional per the spec (PR 6's `deploy.yml` will own the main pipeline). If a user merges and expects CI to re-fire on main, that's a UX gap until PR 6 lands.
