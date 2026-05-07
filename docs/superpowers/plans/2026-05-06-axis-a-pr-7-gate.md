# Axis A PR 7 — Branch Protection + Codecov Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `codecov.yml` configuring per-flag (backend/frontend) project + patch coverage status checks with `target: auto` self-ratcheting and `threshold: 1%` drift tolerance. Bump `codecov/codecov-action@v4` → `@v5` in `ci.yml`. After merge, you complete two GitHub UI runbooks (branch protection + Codecov bot install) — both documented in the spec.

**Architecture:** Codecov gate via `codecov.yml`'s `coverage.status.{project,patch}` blocks scoped per flag, with paths in the `flags:` block separating backend/frontend ownership. Branch protection itself is configured in the GitHub repo Settings UI — not committed to the repo (GitHub's design, not ours). Both Codecov upload steps in `ci.yml` get the action version bump as a single atomic edit pair.

**Tech Stack:** Codecov YAML config · `codecov/codecov-action@v5` · GitHub branch protection rules

**Branch:** `axis-a/pr-7-gate`

**Spec reference:** `docs/superpowers/specs/2026-05-06-axis-a-pr-7-gate-design.md`

**Final PR of Axis A.** After this merges, the foundation phase is complete and the next session should pivot to product features (Axes B–F per the 100x roadmap).

---

## File structure

```
codecov.yml                            (new, repo root — flag definitions + project/patch status)
.github/workflows/ci.yml               (modify — bump codecov-action @v4 → @v5 at lines 43 and 83)
```

**Total new files:** 1. **Total modified files:** 1.

---

## Task 0: Worktree + branch

The controller creates the worktree before dispatching.

Working directory: `/Users/henricktissink/Sauce/cactus/.worktrees/axis-a-pr-7`
Branch: `axis-a/pr-7-gate` (branched from `main`).

If executing inline:

```bash
cd /Users/henricktissink/Sauce/cactus
git worktree add .worktrees/axis-a-pr-7 -b axis-a/pr-7-gate main
cd .worktrees/axis-a-pr-7
```

---

## Task 1: Create `codecov.yml`

**Files:**
- Create: `codecov.yml` (repo root)

- [ ] **Step 1: Verify no codecov.yml exists**

```bash
ls codecov.yml .codecov.yml 2>&1
```
Expected: both lines say "No such file or directory." If either exists, STOP and report — the plan assumes a clean state.

- [ ] **Step 2: Write `codecov.yml`**

Create `codecov.yml` at the repo root with this exact content:

```yaml
codecov:
  require_ci_to_pass: true

coverage:
  status:
    project:
      backend:
        flags: [backend]
        target: auto
        threshold: 1%
      frontend:
        flags: [frontend]
        target: auto
        threshold: 1%
    patch:
      backend:
        flags: [backend]
        target: auto
        threshold: 1%
      frontend:
        flags: [frontend]
        target: auto
        threshold: 1%

flags:
  backend:
    paths:
      - src/backend/
  frontend:
    paths:
      - src/frontend/

comment:
  layout: "header, diff, flags, files"
  behavior: default
  require_changes: false
```

- [ ] **Step 3: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('codecov.yml'))" && echo "YAML OK"
```
Expected: `YAML OK`. If parsing errors, fix indentation.

- [ ] **Step 4: Validate Codecov-specific schema via Codecov's public validator**

```bash
curl -s -X POST --data-binary @codecov.yml https://codecov.io/validate
```

Expected: response body starts with `Valid!` followed by a normalized echo of the config. If response is `Error:` or any non-validation message, the YAML has a Codecov-schema violation — read the error and fix.

(This endpoint requires no auth and is safe to hit. It's Codecov's documented self-service validator: https://docs.codecov.com/docs/codecov-yaml#validate-your-codecovyml)

- [ ] **Step 5: Commit**

```bash
git add codecov.yml
git commit -m "ci: add codecov.yml with auto-target gate per flag"
```

---

## Task 2: Bump `codecov-action@v4` → `@v5` in `ci.yml`

**Files:**
- Modify: `.github/workflows/ci.yml` at lines 43 and 83

- [ ] **Step 1: Confirm the two action references exist at the expected lines**

```bash
grep -n "codecov-action" .github/workflows/ci.yml
```
Expected output (line numbers may shift slightly if ci.yml has been touched since the plan was written):
```
43:        uses: codecov/codecov-action@v4
83:        uses: codecov/codecov-action@v4
```

If neither match exists or there are more than 2 hits, STOP and report — the file structure may have drifted.

- [ ] **Step 2: Edit both occurrences**

Use a single `sed` to update both lines atomically:

```bash
sed -i.bak 's|uses: codecov/codecov-action@v4|uses: codecov/codecov-action@v5|g' .github/workflows/ci.yml
rm .github/workflows/ci.yml.bak
```

(macOS/BSD `sed` requires the `-i.bak` suffix; the `.bak` file is removed afterward.)

- [ ] **Step 3: Verify the change**

```bash
grep -n "codecov-action" .github/workflows/ci.yml
```
Expected: 2 hits, both `@v5`. No remaining `@v4` references.

- [ ] **Step 4: Validate YAML still parses**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML OK"
```
Expected: `YAML OK`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: bump codecov-action v4 -> v5 in both upload steps"
```

---

## Task 3: Local pre-push verification

**Files:**
- None (verification only)

The Codecov gate's behavior can only be fully tested post-merge (the action runs in CI, not locally). What CAN be verified locally: YAML validity, Codecov schema validity, no regression in the existing CI pipeline.

- [ ] **Step 1: Both YAML files parse**

```bash
python3 -c "import yaml; yaml.safe_load(open('codecov.yml')); yaml.safe_load(open('.github/workflows/ci.yml')); print('both YAML files parse')"
```
Expected: `both YAML files parse`.

- [ ] **Step 2: Codecov validator returns Valid**

```bash
curl -s -X POST --data-binary @codecov.yml https://codecov.io/validate | head -3
```
Expected: starts with `Valid!`.

- [ ] **Step 3: Run frontend CI parity (from `src/frontend/`)**

```bash
npm ci
npm run lint
npm run format:check
npx tsc -b
npm run test:coverage
npm run build
```
All 6 should exit 0. Tests: 12/12.

- [ ] **Step 4: Run backend CI parity (from worktree root, with `DOTNET_ROLL_FORWARD=LatestMajor` for test)**

```bash
dotnet restore src/backend/Cactus.slnx
dotnet format src/backend/Cactus.slnx --verify-no-changes --severity error
dotnet build src/backend/Cactus.slnx --no-restore -c Release
dotnet test src/backend/Cactus.slnx --no-build -c Release --collect:"XPlat Code Coverage" --results-directory ./coverage-local
```
All 4 should exit 0. Tests: 28/28.

Cleanup:
```bash
rm -rf coverage-local
```

- [ ] **Step 5: No commit**

Verification only.

---

## Task 4: Push branch + open PR + watch CI

**Files:**
- None (process step)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin axis-a/pr-7-gate
```

The push triggers `ci.yml` on the branch (per PR 4's `push: branches-ignore: [main]` trigger). The Codecov upload steps now use `@v5`; first time exercising it.

- [ ] **Step 2: Open the PR with explicit setup-runbook callouts**

```bash
gh pr create --title "Axis A PR 7: Branch protection + Codecov gate" --body "$(cat <<'EOF'
## Summary
- Adds `codecov.yml` at repo root configuring per-flag (`backend`, `frontend`) project + patch coverage status checks with `target: auto` and `threshold: 1%`. Self-ratcheting: every PR's coverage becomes the new floor with 1% permitted drift.
- Bumps `codecov/codecov-action@v4` → `@v5` in `ci.yml` (both upload steps). Existing `directory:`, `flags:`, `fail_ci_if_error:` inputs remain valid in v5.
- Strict scope: branch protection setup + Codecov bot install are GitHub UI runbooks (below).

## ⚠️ TWO ONE-TIME UI RUNBOOKS BEFORE CLOSING THE LOOP

Both are documented in `docs/superpowers/specs/2026-05-06-axis-a-pr-7-gate-design.md`. Skim that doc; it has clickable anchors.

### Runbook 1 — Branch protection
GitHub → repo → Settings → Branches → Add branch protection rule:
- Branch name pattern: `main`
- ☑ Require a pull request before merging (Required approving reviews: **0**)
- ☑ Require status checks to pass: **Backend test**, **Frontend test** (these only appear in the dropdown after CI runs once on this PR — push first, configure second)
- ☑ Require branches to be up to date before merging
- ☑ Require linear history
- ☐ Allow force pushes / deletions
- ☑ Allow specified actors to bypass required pull requests → add yourself

Then under Settings → General → Pull Requests:
- ☑ Allow squash merging
- ☐ Allow merge commits (uncheck)

### Runbook 2 — Codecov bot install
- Visit https://github.com/marketplace/codecov
- Set up a plan (Free for OSS) → install on `henrick-tissink/cactus` only
- After install, the bot starts processing uploaded coverage and posting PR comments

If the bot can't post comments due to a glitch, tokenless upload still works for public repos — status checks gate via the Codecov API regardless. Add `CODECOV_TOKEN` repo secret as fallback only if needed.

## Verification (post-merge — your responsibility)
- A test PR adding new untested code gets a red `codecov/patch/{backend,frontend}` status check
- A test PR dropping coverage > 1% gets a red `codecov/project/{backend,frontend}` status check
- Direct push to main → "protected branch" error
- Linear history enforced — no merge commits land on main

## Local verification (already done)
- [x] `codecov.yml` validated by Codecov's public validator (https://codecov.io/validate)
- [x] Frontend CI: lint + format:check + tsc + test:coverage (12/12) + build all green
- [x] Backend CI: restore + format --verify-no-changes + build + test (28/28) all green

## Out of scope (deferred to future polish PRs or opportunistic touches)
- Concurrency guard on `deploy.yml`
- `packages.lock.json` + re-enable NuGet caching
- v3 SSH key rotation (handled in post-PR-7 cleanup, separate from PR flow)
- Required PR reviewers > 0
- CODEOWNERS file

## What this completes
**This is the final PR of Axis A.** After merge + the two runbooks above, the foundation phase is complete:
- Tests on both projects
- CI gating every PR
- Pre-commit format + lint hooks
- Auto-deploy to prod on merge to main
- Branch protection + coverage gate

Next session pivots to product features (Axes B–F).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh auth status` reports not logged in, the user must `gh auth login` interactively before this step. The push uses git's stored credentials and works without `gh`.

- [ ] **Step 3: Watch CI run**

```bash
sleep 20
curl -s "https://api.github.com/repos/henrick-tissink/cactus/actions/runs?branch=axis-a/pr-7-gate&per_page=3" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for r in data.get('workflow_runs', [])[:3]:
    print(f\"#{r['run_number']} {r['name']} status={r['status']} conclusion={r['conclusion']} sha={r['head_sha'][:7]} id={r['id']}\")
"
```

Wait for completion. Expected: `ci.yml` run completes with all 4 jobs green (Backend test, Frontend test, Backend Docker build, Frontend Docker build). The `Deploy` workflow does NOT run on this PR (gated to `push: main`).

If `codecov-action@v5` has a behavior change that surfaces in the upload step, the action's stderr will say so. With `fail_ci_if_error: false`, an upload error doesn't fail the job — but the Codecov status check might stay "expected" forever, blocking merge once branch protection is configured. If you see this, fix `codecov.yml` or the action version in a follow-up commit on this same PR before merging.

- [ ] **Step 4: Report PR URL + CI outcome**

Final report includes:
- PR URL
- CI run number + outcome (4/4 green expected)
- Confirmation that the `Codecov` upload steps in both jobs completed (look at the step output in the GH Actions UI)
- Any deviations or surprises with `@v5`

---

## Self-review checklist

**Spec coverage** (against `2026-05-06-axis-a-pr-7-gate-design.md`):

| Spec line | Plan task |
|-----------|-----------|
| `codecov.yml` at repo root with per-flag project + patch status | Task 1 |
| `target: auto` + `threshold: 1%` per flag | Task 1 (verbatim YAML) |
| `flags.{backend,frontend}.paths` scope | Task 1 (verbatim YAML) |
| `comment` config with `require_changes: false` | Task 1 (verbatim YAML) |
| `codecov-action@v4` → `@v5` in `ci.yml` (both jobs) | Task 2 |
| Codecov validator confirms schema validity | Tasks 1 step 4, 3 step 2 |
| Local CI parity check | Task 3 steps 3–4 |
| Branch protection runbook in PR body | Task 4 step 2 |
| Codecov bot install runbook in PR body | Task 4 step 2 |
| Post-merge verification recipe in PR body | Task 4 step 2 |
| End-of-Axis-A note | Task 4 step 2 (PR body's "What this completes") |

**Placeholder scan:** No "TBD"/"implement later"/"add validation"/"similar to Task N." Task 1 step 4 uses Codecov's actual public validator endpoint (not a hand-wave). Task 4 step 3's diagnostic for `@v5` failure mode names the specific symptom (`codecov` status check stays "expected") and the specific recovery (fix on the same PR).

**Type/name consistency:**
- Codecov flag names `backend` and `frontend` consistent across `codecov.yml`, `ci.yml` upload step's `flags:` input, and PR body status-check name references.
- Status check names `codecov/project/{backend,frontend}` and `codecov/patch/{backend,frontend}` match Codecov's documented format.
- Branch protection rule references `Backend test` and `Frontend test` (the job *names* from `ci.yml`, not the YAML keys `backend-test` / `frontend-test`) — consistent with PR 4's actual job names.

**Risks flagged in the plan:**
- Task 2 line numbers may have shifted since plan-write time. The grep in Step 1 catches that defensively; STOP-and-report instruction is explicit.
- Task 4 step 3: `@v5` could behave differently. Symptom + recovery are documented; not a blocker.
- Branch protection requires status checks to have run at least once before they appear in the dropdown — the runbook explicitly sequences "push first, configure second."
