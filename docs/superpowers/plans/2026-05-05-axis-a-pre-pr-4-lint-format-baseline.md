# Axis A Pre-PR 4 — Lint + Format Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `npm run lint` and `dotnet format --verify-no-changes` exit 0 on `main` so PR 4 can land green. Six frontend ESLint errors fixed, ESLint config updated to ignore `coverage/`, and the backend `dotnet format` baseline established.

**Architecture:** Each fix is the smallest correct refactor — no behavior changes beyond what the rule violation implies. Three of the React-hook fixes use the React 19-recommended idioms: derive state during render (VerifyEmail), prev-prop tracking with conditional `setState` during render (SpendingPlan), and split state into "auto" + "user override" (Transactions). One is a pure deletion (Settings — the effect was redundant given the `useState` initializer already captured the same data). The two unused-`err` errors are mechanical `} catch (err) {` → `} catch {`.

**Tech Stack:** React 19 · TypeScript 5.9 (strict, `verbatimModuleSyntax`) · ESLint 9 (flat config) · `eslint-plugin-react-hooks` 7.x · .NET 8 / dotnet format

**Branch:** `axis-a/pre-pr-4-lint-format-baseline`

**Spec reference:** `docs/superpowers/specs/2026-05-05-axis-a-pr-4-ci-design.md` § Pre-PR

**Prerequisite for:** PR 4 (CI workflow). PR 4's `frontend-test` job runs `npm run lint` and the `backend-test` job runs `dotnet format --verify-no-changes`; both fail on `main` today.

---

## File structure (all modified, none new)

```
src/frontend/
├── eslint.config.js              (modify — add `coverage` to globalIgnores)
└── src/pages/
    ├── Login.tsx                 (modify — drop unused `err` binding)
    ├── Register.tsx              (modify — drop unused `err` binding)
    ├── Settings.tsx              (modify — delete redundant useEffect)
    ├── SpendingPlan.tsx          (modify — prev-prop tracking idiom)
    ├── Transactions.tsx          (modify — split state, delete useMemo side effect)
    └── VerifyEmail.tsx           (modify — derive initial status from `token`)

src/backend/
└── (multiple files)              (modify — `dotnet format` whitespace/import-order baseline)
```

**Total source files modified:** 6 frontend pages + 1 ESLint config + N backend files (where N depends on `dotnet format`'s output; expected small).

---

## Task 0: Worktree + branch

The controller creates the worktree before dispatching the implementer. The implementer starts from the worktree path on the named branch.

Working directory for all subsequent tasks: `/Users/henricktissink/Sauce/cactus/.worktrees/axis-a-pre-pr-4`
Branch: `axis-a/pre-pr-4-lint-format-baseline` (branched from `main`).

If executing inline:

```bash
cd /Users/henricktissink/Sauce/cactus
git worktree add .worktrees/axis-a-pre-pr-4 -b axis-a/pre-pr-4-lint-format-baseline main
cd .worktrees/axis-a-pre-pr-4/src/frontend
npm install
```

All subsequent paths are relative to the worktree root.

---

## Task 1: Drop unused `err` bindings (Login + Register)

**Files:**
- Modify: `src/frontend/src/pages/Login.tsx:96`
- Modify: `src/frontend/src/pages/Register.tsx:57`

- [ ] **Step 1: Verify the lint errors exist**

Run: `cd src/frontend && npx eslint src/pages/Login.tsx src/pages/Register.tsx 2>&1 | grep "err"`
Expected: 2 errors, one per file, both `'err' is defined but never used`.

- [ ] **Step 2: Edit Login.tsx**

Replace:
```tsx
    } catch (err) {
      setError('Invalid email or password');
```

With:
```tsx
    } catch {
      setError('Invalid email or password');
```

(Modern TypeScript permits omitting the catch binding entirely. The rest of the catch block is unchanged.)

- [ ] **Step 3: Edit Register.tsx**

Replace:
```tsx
    } catch (err) {
      setError('Email already registered or invalid data');
```

With:
```tsx
    } catch {
      setError('Email already registered or invalid data');
```

- [ ] **Step 4: Verify lint passes for these two files**

Run: `cd src/frontend && npx eslint src/pages/Login.tsx src/pages/Register.tsx`
Expected: exit 0, zero output.

- [ ] **Step 5: Run the existing PR 3 Login tests to confirm no regression**

Run: `cd src/frontend && npx vitest run src/pages/Login.test.tsx`
Expected: 3/3 pass. (Register has no test file in PR 3.)

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/pages/Login.tsx src/frontend/src/pages/Register.tsx
git commit -m "fix(frontend): drop unused err bindings in auth catch blocks"
```

---

## Task 2: Settings.tsx — delete redundant useEffect

**Files:**
- Modify: `src/frontend/src/pages/Settings.tsx:14-21`

**Why this fix:** The `useState` initializer at line 9 (`useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' })`) already captures the user's name on mount. The `useEffect` at lines 14–21 re-syncs whenever `user` changes — but Settings is rendered inside `<ProtectedRoute>` which guarantees `user !== null` at mount, and the only in-page mutation of `user` is via the same form's save mutation (`onSuccess` calls `setUser`), where the form already reflects the new values that the user just typed. The effect is redundant and the lint rule correctly flags it.

- [ ] **Step 1: Verify the error**

Run: `cd src/frontend && npx eslint src/pages/Settings.tsx`
Expected: 1 error at `16:7` ("Calling setState synchronously within an effect").

- [ ] **Step 2: Edit Settings.tsx**

Delete lines 14–21 entirely:

```tsx
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);
```

Also remove the now-unused import. Change line 1 from:

```tsx
import { useState, useEffect } from 'react';
```

to:

```tsx
import { useState } from 'react';
```

- [ ] **Step 3: Verify lint passes for this file**

Run: `cd src/frontend && npx eslint src/pages/Settings.tsx`
Expected: exit 0.

- [ ] **Step 4: Verify build still passes**

Run: `cd src/frontend && npx tsc -b`
Expected: exit 0, no output.

- [ ] **Step 5: Manual smoke (controller's responsibility — note in report)**

Settings.tsx has no automated test in PR 3. The implementer should report that the dev server should be smoked manually post-merge: log in, visit `/settings`, confirm the profile form is pre-populated with the current user's name. (No automated test needed for this PR — out of scope.)

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/pages/Settings.tsx
git commit -m "fix(frontend): remove redundant user-sync useEffect in Settings"
```

---

## Task 3: SpendingPlan.tsx — prev-prop tracking refactor

**Files:**
- Modify: `src/frontend/src/pages/SpendingPlan.tsx:50-59`

**Why this fix:** The effect re-syncs the local form state from `plan` whenever `plan` changes (after a save mutation invalidates the query and the new plan arrives). The form is editable, so a pure derived value won't work. The React 19-recommended pattern is "store information from previous renders" — track `prevPlan` in state and conditionally `setState` during render when it changes. This eliminates the effect without losing the sync behavior.

- [ ] **Step 1: Verify the error and read context**

Run: `cd src/frontend && npx eslint src/pages/SpendingPlan.tsx`
Expected: 1 error at `52:7`.

Read `src/pages/SpendingPlan.tsx:1-70` to confirm the surrounding state setup is:

```tsx
const [percentages, setPercentages] = useState({...});
const [income, setIncome] = useState(...);
// ...
useEffect(() => {
  if (plan) {
    setPercentages({...});
    setIncome(plan.monthlyIncome);
  }
}, [plan]);
```

If the actual code differs from this shape, STOP and report DONE_WITH_CONCERNS.

- [ ] **Step 2: Replace the useEffect with prev-prop tracking**

Find the block:

```tsx
  // Update local state when plan loads
  useEffect(() => {
    if (plan) {
      setPercentages({
        needs: plan.needsPercentage,
        wants: plan.wantsPercentage,
        goals: plan.goalsPercentage,
      });
      setIncome(plan.monthlyIncome);
    }
  }, [plan]);
```

Replace with:

```tsx
  // Sync local form state when a new plan arrives. The conditional
  // setState during render is the React 19-recommended pattern (replaces
  // useEffect-with-setState which the lint rule flags).
  const [prevPlanId, setPrevPlanId] = useState<string | undefined>(plan?.id);
  if (plan && plan.id !== prevPlanId) {
    setPrevPlanId(plan.id);
    setPercentages({
      needs: plan.needsPercentage,
      wants: plan.wantsPercentage,
      goals: plan.goalsPercentage,
    });
    setIncome(plan.monthlyIncome);
  }
```

Then check whether `useEffect` is still imported and used elsewhere in this file. If `useEffect` was only used here, remove it from the import on line 1. If other `useEffect` calls remain, leave the import.

Run: `grep -c "useEffect" src/frontend/src/pages/SpendingPlan.tsx`
If the count is 1 (just the import), remove `useEffect` from the import. If >1, leave it.

- [ ] **Step 3: Verify lint passes**

Run: `cd src/frontend && npx eslint src/pages/SpendingPlan.tsx`
Expected: exit 0.

- [ ] **Step 4: Verify build still passes**

Run: `cd src/frontend && npx tsc -b`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/SpendingPlan.tsx
git commit -m "fix(frontend): replace plan-sync useEffect with prev-prop tracking"
```

---

## Task 4: VerifyEmail.tsx — derive initial status from token

**Files:**
- Modify: `src/frontend/src/pages/VerifyEmail.tsx:8-19`

**Why this fix:** The effect's only synchronous `setState` is `setStatus('error')` for the no-token case. That's pure derivation from `token` (a search param, immutable for the lifecycle of this component). Move it into the `useState` initializer so the effect only handles the async API call.

- [ ] **Step 1: Verify the error**

Run: `cd src/frontend && npx eslint src/pages/VerifyEmail.tsx`
Expected: 1 error at `12:7`.

- [ ] **Step 2: Refactor**

Find:

```tsx
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    apiClient.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);
```

Replace with:

```tsx
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error'
  );

  useEffect(() => {
    if (!token) return;

    apiClient.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);
```

- [ ] **Step 3: Verify lint passes**

Run: `cd src/frontend && npx eslint src/pages/VerifyEmail.tsx`
Expected: exit 0.

- [ ] **Step 4: Verify build still passes**

Run: `cd src/frontend && npx tsc -b`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/VerifyEmail.tsx
git commit -m "fix(frontend): derive VerifyEmail initial status from token presence"
```

---

## Task 5: Transactions.tsx — split applyToSimilar into auto + user-override

**Files:**
- Modify: `src/frontend/src/pages/Transactions.tsx` — locally, around the `ClassifyModal` component (the `applyToSimilar` `useState` is at ~line 547; the offending `useMemo` is at lines 580-584; the checkbox `onChange` is at ~line 853).

**Why this fix:** `useMemo(() => { setState(...) }, [...])` is a real anti-pattern that can cause infinite loops. The intent is "default `applyToSimilar` to true when there's a similar-transactions count and a high-confidence suggestion." That's pure derived state. Splitting `applyToSimilar` into an auto-computed value (derived during render) plus a user-override slot (only set when the user toggles the checkbox) eliminates the side effect.

- [ ] **Step 1: Read the surrounding code**

Run: `grep -n "applyToSimilar\|setApplyToSimilar\|useMemo" src/frontend/src/pages/Transactions.tsx | head -30`

Confirm the three relevant call sites:
1. The `useState(false)` declaration (somewhere around line 547).
2. The `useMemo` block at lines 580–584 that side-effects `setApplyToSimilar(true)`.
3. The checkbox `onChange` (around line 853) that calls `setApplyToSimilar(e.target.checked)`.
4. The `applyToSimilar` reads (in the `classifyMutation` and the submit-button label).

If the line numbers differ from what's listed (the file has shifted since the plan author last read it), STOP and report DONE_WITH_CONCERNS — the refactor depends on knowing exactly what to replace.

- [ ] **Step 2: Replace the `useState` declaration**

Find:

```tsx
  const [applyToSimilar, setApplyToSimilar] = useState(false);
```

Replace with:

```tsx
  const [userOverrideApplyToSimilar, setUserOverrideApplyToSimilar] =
    useState<boolean | null>(null);
```

- [ ] **Step 3: Delete the offending `useMemo` and add derived value**

Find:

```tsx
  // Set applyToSimilar default based on whether there are similar transactions
  useMemo(() => {
    if (similarCount && similarCount.count > 0 && bestSuggestion) {
      setApplyToSimilar(true);
    }
  }, [similarCount, bestSuggestion]);
```

Replace with:

```tsx
  // Derive the effective applyToSimilar value: user override takes precedence;
  // otherwise auto-enable when similar transactions and a high-confidence
  // suggestion are both present. Replaces a useMemo-with-side-effect that the
  // react-hooks rule flagged as a potential infinite-loop source.
  const autoApplyToSimilar = !!(
    similarCount && similarCount.count > 0 && bestSuggestion
  );
  const applyToSimilar = userOverrideApplyToSimilar ?? autoApplyToSimilar;
```

(The `applyToSimilar` const replaces what was previously the `useState` value, so existing reads of `applyToSimilar` further down — in `classifyMutation`'s POST body and in the checkbox `checked={applyToSimilar}` prop and in the submit-button label conditional — keep working unchanged.)

- [ ] **Step 4: Update the checkbox onChange**

Find the checkbox (around line 853):

```tsx
                <input
                  type="checkbox"
                  checked={applyToSimilar}
                  onChange={(e) => setApplyToSimilar(e.target.checked)}
                  ...
                />
```

Change `onChange` to call the override setter:

```tsx
                <input
                  type="checkbox"
                  checked={applyToSimilar}
                  onChange={(e) => setUserOverrideApplyToSimilar(e.target.checked)}
                  ...
                />
```

- [ ] **Step 5: Search for any other `setApplyToSimilar` references**

Run: `grep -n "setApplyToSimilar" src/frontend/src/pages/Transactions.tsx`
Expected: zero matches. If any remain, replace with `setUserOverrideApplyToSimilar`.

- [ ] **Step 6: Verify lint passes**

Run: `cd src/frontend && npx eslint src/pages/Transactions.tsx`
Expected: exit 0.

- [ ] **Step 7: Verify build still passes**

Run: `cd src/frontend && npx tsc -b`
Expected: exit 0.

- [ ] **Step 8: Run the PR 3 Transactions tests**

Run: `cd src/frontend && npx vitest run src/pages/Transactions.test.tsx`
Expected: 3/3 pass. The PR 3 tests don't touch the classify modal, so they shouldn't regress — but rendering is also being checked.

- [ ] **Step 9: Commit**

```bash
git add src/frontend/src/pages/Transactions.tsx
git commit -m "fix(frontend): replace useMemo side-effect with derived applyToSimilar"
```

---

## Task 6: ESLint config — ignore `coverage/`

**Files:**
- Modify: `src/frontend/eslint.config.js`

- [ ] **Step 1: Read current config**

Run: `cat src/frontend/eslint.config.js`
Expected: a flat-config file with `globalIgnores(['dist'])` near the top.

- [ ] **Step 2: Edit**

Find:

```js
  globalIgnores(['dist']),
```

Replace with:

```js
  globalIgnores(['dist', 'coverage']),
```

- [ ] **Step 3: Verify**

```bash
cd src/frontend
npm run test:coverage > /dev/null 2>&1
npm run lint
```

Expected: lint exits 0, no warnings about `coverage/lcov-report/*.js`.

(If `npm run test:coverage` would re-run all tests for verification, that's fine — it should still produce 12/12 in <5s.)

- [ ] **Step 4: Commit**

```bash
git add src/frontend/eslint.config.js
git commit -m "fix(frontend): add coverage/ to ESLint global ignores"
```

---

## Task 7: Frontend baseline verification

**Files:**
- None (verification only)

- [ ] **Step 1: Full lint**

Run: `cd src/frontend && npm run lint`
Expected: exit 0, no errors, no warnings.

- [ ] **Step 2: Full type-check**

Run: `cd src/frontend && npx tsc -b`
Expected: exit 0, no output.

- [ ] **Step 3: Full test suite**

Run: `cd src/frontend && npm test`
Expected: 12/12 tests pass across 4 files.

- [ ] **Step 4: Production build**

Run: `cd src/frontend && npm run build`
Expected: builds successfully. The pre-existing 500KB chunk warning is acceptable; no new errors.

- [ ] **Step 5: No commit**

This task is verification-only. If any step fails, stop and address before continuing.

---

## Task 8: Backend `dotnet format` baseline

**Files:**
- Modify: backend C# files (count and locations determined by the `dotnet format` run in Step 1; expected: small whitespace + import-order changes only)

**Background:** The backend has never had `dotnet format` applied. This task runs it once and commits the resulting whitespace + import-order changes. No semantic code changes.

- [ ] **Step 1: Confirm the current state**

Run: `dotnet format src/backend/Cactus.slnx --verify-no-changes 2>&1 | tail -5`
Expected: non-zero exit + a count of files needing formatting. If exit 0, the codebase is already formatted — skip to Task 9.

The local environment requires `DOTNET_ROLL_FORWARD=LatestMajor` for some `dotnet` commands (.NET 8 target on .NET 10 SDK). If the command above errors with "no .NET 8 runtime found", run:

```bash
DOTNET_ROLL_FORWARD=LatestMajor dotnet format src/backend/Cactus.slnx --verify-no-changes
```

(Use the same prefix on subsequent commands in this task if needed.)

- [ ] **Step 2: Apply formatting**

Run: `dotnet format src/backend/Cactus.slnx` (with `DOTNET_ROLL_FORWARD=LatestMajor` if required).

This modifies files in place. No output on success.

- [ ] **Step 3: Inspect the diff**

Run: `git diff --stat src/backend`
Expected: a list of changed files and line counts.

**Decision branch:**
- If the total changed-line count is **≤100 lines across ≤10 files**: proceed to Step 4 (single commit).
- If it's **>100 lines or >10 files**: stop and report DONE_WITH_CONCERNS. The controller will decide whether to split per project (`Cactus.Api`, `Cactus.Application`, `Cactus.Domain`, `Cactus.Infrastructure`) into separate commits, or accept a single large commit.

- [ ] **Step 4: Commit**

```bash
git add src/backend
git commit -m "style(backend): apply dotnet format baseline"
```

(Using `style:` rather than `fix:` because there are no semantic changes — just whitespace and import order.)

---

## Task 9: Backend baseline verification

**Files:**
- None (verification only)

- [ ] **Step 1: Verify format-clean**

Run: `dotnet format src/backend/Cactus.slnx --verify-no-changes` (with `DOTNET_ROLL_FORWARD=LatestMajor` if required).
Expected: exit 0.

- [ ] **Step 2: Verify build**

Run: `dotnet build src/backend/Cactus.slnx -c Release` (with `DOTNET_ROLL_FORWARD=LatestMajor` if required).
Expected: build succeeds, zero errors.

- [ ] **Step 3: Verify tests**

Run: `dotnet test src/backend/Cactus.slnx -c Release` (with `DOTNET_ROLL_FORWARD=LatestMajor` if required).
Expected: all backend tests pass (PR 1 + PR 2 = ~14 + 24 = ~38 tests).

- [ ] **Step 4: No commit**

Verification-only.

---

## Task 10: Open the PR

**Files:**
- None

- [ ] **Step 1: Push the branch**

```bash
git push -u origin axis-a/pre-pr-4-lint-format-baseline
```

If `gh auth status` reports not logged in, the user must run `gh auth login` interactively before the next step. The push itself uses git's stored credentials and works without `gh`.

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Axis A pre-PR 4: lint + dotnet format baseline" --body "$(cat <<'EOF'
## Summary
- Fixes 6 frontend ESLint errors so `npm run lint` exits 0.
- Adds `coverage/` to ESLint global ignores so post-`test:coverage` lint runs are clean.
- Applies the one-time `dotnet format` baseline so `dotnet format --verify-no-changes` exits 0.

## Why
- PR 4 will land `.github/workflows/ci.yml` and gate merges on lint + format. Both gates fail on `main` today; this PR clears them so PR 4 can be a pure CI-config change.

## Behavioral notes
- 4 of the 6 frontend fixes touch React hooks (Settings, SpendingPlan, VerifyEmail, Transactions). Each refactor preserves observable behavior:
  - **Settings**: deletes a redundant useEffect (the useState initializer already captures the same data).
  - **SpendingPlan**: replaces a useEffect with the React 19 prev-prop tracking idiom.
  - **VerifyEmail**: derives the initial `status` from the `token` search param.
  - **Transactions**: splits the auto-applied "apply to similar" flag into a derived value plus a user-override slot, eliminating a `useMemo` side effect that ESLint flagged as a potential infinite loop.
- The 2 `'err' is defined but never used` errors are mechanical: `} catch (err) {` → `} catch {`.
- Backend `dotnet format` produced whitespace + import-order changes only — no semantic changes.

## Test plan
- [x] `npm run lint` exits 0 from `src/frontend/`
- [x] `npm test` green (12/12)
- [x] `npm run build` succeeds
- [x] `dotnet format src/backend/Cactus.slnx --verify-no-changes` exits 0
- [x] `dotnet test src/backend/Cactus.slnx` green
- [ ] Manual smoke of Settings, SpendingPlan, VerifyEmail pages post-merge to confirm no behavioral regressions

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Report PR URL.**

---

## Self-review checklist

**Spec coverage** (against `2026-05-05-axis-a-pr-4-ci-design.md` § Pre-PR):

| Spec line | Plan task |
|-----------|-----------|
| Fix 6 frontend ESLint errors | Tasks 1–5 (1: Login+Register · 2: Settings · 3: SpendingPlan · 4: VerifyEmail · 5: Transactions) |
| Add `coverage/` to ESLint ignores | Task 6 |
| Run `dotnet format` baseline | Task 8 |
| Pre-PR success: `npm run lint` exit 0 | Task 7 step 1 |
| Pre-PR success: `dotnet format --verify-no-changes` exit 0 | Task 9 step 1 |
| Pre-PR success: tests pass on both projects | Task 7 step 3 + Task 9 step 3 |
| Manual smoke of touched pages | Called out in PR body (post-merge step) |

**Placeholder scan:** No "TBD"/"implement later"/"add validation"/"similar to Task N" in the plan. Task 8's "decision branch" on `dotnet format` diff size is a real branching condition with concrete thresholds (≤100 lines / ≤10 files), not a hand-wave. Task 5's line-number guidance includes a "if the file has shifted, STOP and report" escape hatch — directed reading, not a placeholder.

**Type consistency:**
- `userOverrideApplyToSimilar` and `setUserOverrideApplyToSimilar` used identically across Steps 2, 3, 4, 5 of Task 5.
- `prevPlanId` / `setPrevPlanId` used consistently in Task 3 step 2.
- `status` type signature in Task 4 is `'loading' | 'success' | 'error'` — same in the original code and the replacement.

**Risks flagged in the plan:**
- Task 5: line numbers depend on file state. If they've shifted, the implementer is told to STOP rather than guess.
- Task 8: format diff size is unknown until the command runs. Decision branch handles both small and large cases.
- Task 8/9: local Node + .NET environment quirk (`DOTNET_ROLL_FORWARD=LatestMajor`). CI doesn't have this issue.
- Settings.tsx, SpendingPlan.tsx, VerifyEmail.tsx have no automated tests in PR 3. Manual smoke is called out in the PR body but is a post-merge action — accepting the risk in this PR's scope.
