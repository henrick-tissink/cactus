# Axis A PR 7 — Branch Protection + Codecov Gate

**Date:** 2026-05-06
**Status:** Draft, awaiting user review
**Parent spec:** `docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md` § PR 7

---

## Why this doc exists

The parent Axis A design assigns PR 7 the scope "Branch protection on main + Codecov integration + initial coverage gate. Done when: a PR reducing coverage below the gate fails CI." This refinement locks the three open decisions: how strict to make branch protection (option A: PR required + linear history + 2 status checks), what shape the Codecov gate takes (option A: `target: auto` + threshold), and whether to bundle deferred polish (option A: strict scope, only Codecov v5 upgrade rides along since we're touching Codecov anyway).

This is the final PR of Axis A. After merge, the foundation phase is complete.

---

## Decision summary

| # | Decision | Choice |
|---|----------|--------|
| 1 | Branch protection strictness | **Strict.** Require PR before merge; require `Backend test` + `Frontend test` checks green; require linear history; admin bypass allowed |
| 2 | Codecov gate shape | **`target: auto` + `threshold: 1%`** per flag. Self-ratcheting; every PR's coverage becomes the new floor with 1% drift permitted |
| 3 | Bundled polish items | **Strict scope.** Only `codecov/codecov-action@v4` → `@v5` rides along (we're touching Codecov anyway). Concurrency guard on `deploy.yml`, lock files, v3 key rotation, etc. all stay deferred |

---

## Architecture

A new `codecov.yml` at the repo root configures per-flag coverage status checks (`backend` and `frontend`) using `target: auto` semantics — base coverage becomes the implicit floor, with `threshold: 1%` permitted drift. Patch-level status checks enforce the same standard on new code in each PR's diff, preventing the "add new untested file but average stays the same" loophole. Two two-line edits in `ci.yml` bump the Codecov upload action from `@v4` to `@v5`.

Branch protection on `main` is configured once via the GitHub repo Settings UI (the user's action — `gh` CLI is not authenticated this session and the GitHub API call requires admin auth). The protection rule requires PR + linear history + green `Backend test` + green `Frontend test`, with admin bypass enabled for emergencies.

Codecov bot installation on the repo (one click in the Codecov marketplace listing) is a separate one-time setup. Tokenless upload already works for public repos; the bot install only adds PR comments — status checks function regardless.

---

## File inventory

| File | Status | Purpose |
|---|---|---|
| `codecov.yml` | new (repo root) | Per-flag project + patch status checks; `auto` target with 1% threshold |
| `.github/workflows/ci.yml` | modify | Bump Codecov upload action `@v4` → `@v5` (one line per upload step, two total) |

**Total new files:** 1. **Total modified files:** 1.

Branch protection and Codecov bot installation are GitHub UI actions, not file changes.

---

## `codecov.yml` content

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

**Behavioral notes:**

- `target: auto` resolves to "the base branch's coverage at the comparison point." Codecov updates this automatically as `main` advances. No hardcoded threshold to maintain.
- `threshold: 1%` permits up to 1 percentage point of drift below the base before failing. Absorbs noise from refactors that touch covered lines without adding tests; tighter (e.g. `0%`) creates churn for non-substantive changes.
- `flags.{backend,frontend}.paths` scopes file ownership: `src/backend/` files contribute only to the `backend` flag's coverage; `src/frontend/` files only to `frontend`. Critical when one PR touches both projects — each gets its own gate evaluated independently.
- `patch` status enforces that NEW code added in the PR's diff meets the same `auto + 1% threshold` standard. Prevents adding 100 lines of untested code if those lines happen to be in a directory whose project average doesn't drop much.
- `require_changes: false` makes the bot post a comment on every PR even when coverage is unchanged. Useful for transparency on small PRs.

**Measured baselines at time of writing** (from the local cobertura runs):

- `Cactus.Application`: 39.01% line-rate
- `Cactus.Api`: 17.13%
- `Cactus.Domain`: 48.76%
- `Cactus.Infrastructure`: 70.43% (high — integration tests exercise repos via real DB)
- Frontend `src/pages/`: 25.26% (PR 3 baseline)

These become the de-facto floor on PR 7's merge to `main`. The auto-target system ratchets from there.

---

## `ci.yml` change

Two edits, structurally identical:

```yaml
# In backend-test job, the Codecov upload step:
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v5      # was @v4
  with:
    directory: ./coverage
    flags: backend
    fail_ci_if_error: false
```

```yaml
# In frontend-test job, the Codecov upload step:
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v5      # was @v4
  with:
    directory: src/frontend/coverage
    flags: frontend
    fail_ci_if_error: false
```

The `with:` inputs (`directory`, `flags`, `fail_ci_if_error`) remain valid in v5. `directory` was renamed to `files` semantically but the v5 action accepts the legacy alias. No other changes needed.

`fail_ci_if_error: false` from PR 4 stays — Codecov upload errors should not fail CI. The status check is what enforces the gate; if upload fails, the status check stays "expected" and merge blocks until it resolves (acceptable safety posture).

---

## Branch protection runbook (you do this — once, after PR 7 first CI run)

GitHub → repo → **Settings** → **Branches** → **Add branch protection rule**.

Configure:

- **Branch name pattern:** `main`
- ☑ **Require a pull request before merging**
  - Required approving reviews: **0** (solo developer)
  - ☐ Dismiss stale pull request approvals (irrelevant at 0)
- ☑ **Require status checks to pass before merging**
  - ☑ **Require branches to be up to date before merging** (forces rebase before merge)
  - **Required status checks:** start typing each name; select from the dropdown:
    - `Backend test`
    - `Frontend test`
  - ⚠ These names only appear in the dropdown after CI has run them at least once on a PR. The PR 7 push triggers CI, which produces both jobs; only after that first run can you select them. Save the rule with no checks first if you must, then edit and add them once visible.
- ☑ **Require linear history** (no merge commits — enforces squash or rebase)
- ☐ Allow force pushes
- ☐ Allow deletions
- ☑ **Allow specified actors to bypass required pull requests** → add yourself
- Click **Create**

Then under **Settings → General → Pull Requests:**

- ☑ Allow squash merging
- ☐ Allow merge commits (uncheck — incompatible with linear history)
- ☐ Allow rebase merging (your call — also compatible, but you've been squash-merging since PR 3 and that's the de-facto pattern)

---

## Codecov bot installation runbook (you, also one-time)

1. Visit https://github.com/marketplace/codecov
2. Click **Set up a plan** (Free for OSS / public repos)
3. Select organization: your personal account
4. Repository access: select `henrick-tissink/cactus` only
5. Confirm

After install, Codecov starts processing uploaded coverage reports and posting PR comments. The first comment appears on PR 7's own next push (or any subsequent push triggering CI).

If install fails or Codecov shows "no coverage data" on the dashboard: tokenless upload from public repos sometimes needs a manual `CODECOV_TOKEN` repo secret. Generate one at https://codecov.io/gh/henrick-tissink/cactus/settings, add to GitHub secrets as `CODECOV_TOKEN`, and update both `codecov-action@v5` steps with `with: token: ${{ secrets.CODECOV_TOKEN }}`. This is fallback-only; try without first.

---

## Success criteria

After PR 7 merges and you've completed the two runbooks:

- `codecov.yml` lives at repo root; visible at https://app.codecov.io/gh/henrick-tissink/cactus → Settings.
- The Codecov bot posts a coverage comment on every PR, showing project + patch coverage per flag.
- A test PR that drops coverage by >1% on either project gets a **red `codecov/project/{backend,frontend}`** status check.
- A test PR adding new untested code gets a **red `codecov/patch/{backend,frontend}`** status check.
- Direct pushes to `main` are **rejected** with a "protected branch" error.
- A PR with a red status check has its **merge button disabled** until checks pass (or admin bypasses).
- Linear history is enforced — no merge commits land on `main`.

**End-state verification (you, post-merge):**

Create a tiny throwaway PR that adds a brand-new untested `.tsx` file. Watch CI run, confirm Codecov posts a red `codecov/patch/frontend` status, confirm merge is blocked. Close the PR without merging.

---

## Out of scope (explicitly)

- Concurrency guard on `deploy.yml` — deferred to a future polish PR or opportunistic touch.
- `packages.lock.json` for backend + re-enabling `setup-dotnet`'s NuGet cache — deferred.
- v3 SSH key rotation — deferred to post-PR-7 cleanup (handled outside the PR flow).
- Coverage threshold tightening beyond `auto` — happens organically as `main`'s coverage ratchets up.
- Required PR approvers > 0 — solo project.
- CODEOWNERS file — no team.
- Deploy success as a required status check — `Deploy` workflow runs post-merge on `main`, so it can't gate the merge itself. Future Axis D work may add a pre-merge smoke check.
- Slack/Discord deploy notifications — Axis D.
- The "deliberately-broken PR" verification from PR 4's spec — already proven via PR 4's first-deploy `setup-dotnet` failure (CI caught it, fix landed in 1 commit, second run was green).

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Status checks `Backend test` / `Frontend test` aren't yet in the dropdown when configuring branch protection | High (first-time setup) | Push PR 7 first, let CI run once, then configure. The runbook sequences correctly. |
| Codecov bot install fails or `codecov.yml` doesn't load | Medium | Tokenless upload still works; status checks still function via the API. PR comments are nice-to-have. Add `CODECOV_TOKEN` secret as fallback. |
| `target: auto` on first ever Codecov upload has no base coverage to compare | Low | Codecov treats first upload as the base; subsequent PRs compare against it. PR 7 produces the first authoritative base. |
| `codecov-action@v5` has a subtle behavior change | Low | `fail_ci_if_error: false` means upload errors don't fail CI. If gate behavior surprises you, adjust thresholds or revert action to `@v4` in a small follow-up. |
| Solo-dev "PR required" friction on quick fixes | Medium (real but minor) | Admin bypass enabled. Use it sparingly to avoid eroding the gate's value. |
| `threshold: 1%` is too lenient and hides slow coverage decay | Low | The ratchet cycle naturally tightens over time as `main`'s coverage rises. If decay becomes visible, lower threshold to 0.5% in a small follow-up. |
| `threshold: 1%` is too strict and creates noise on cosmetic refactors | Low | Same — adjust later if churn is real. |
| Branch protection prevents `gh release` or other automation | N/A today | No release automation in scope. |

---

## Open questions

None remaining. All three decisions in the table at the top are locked.
