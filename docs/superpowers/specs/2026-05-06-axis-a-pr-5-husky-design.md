# Axis A PR 5 — Husky + lint-staged Design

**Date:** 2026-05-06
**Status:** Draft, awaiting user review
**Parent spec:** `docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md` § PR 5

---

## Why this doc exists

The parent Axis A design assigns PR 5 the scope "Husky + lint-staged at root; pre-commit format/lint on staged files; root `package.json`." This refinement locks two design decisions left open by the parent: (1) backend `dotnet format` is out of pre-commit scope (frontend-only), and (2) no pre-push hook for tests (CI is the test gate).

This is a refinement, not a re-spec. The parent doc remains authoritative on Axis A's broader goals.

---

## Decision summary

| # | Decision | Choice |
|---|----------|--------|
| 1 | `dotnet format` in pre-commit | **No.** Frontend-only. Backend drift is rare; CI's 95s loop catches it. The 5s `dotnet` JIT cold-start would tax every commit for low value. |
| 2 | Pre-push hook for tests | **No.** CI runs in 95s; pre-push tests would double-pay. Pre-commit only. |

---

## Architecture

A minimal root `package.json` exists solely to manage husky + lint-staged. `.husky/pre-commit` runs `npx lint-staged`, which:

- Runs `prettier --write` on staged `*.{ts,tsx,css,json}` files under `src/frontend/src/`.
- Runs `eslint --fix` on staged `*.{ts,tsx}` files under `src/frontend/src/`.
- Re-stages files modified by Prettier/ESLint auto-fix.
- Aborts the commit if any unfixable ESLint error remains.

Frontend `package.json` stays independent — no npm workspaces, no shared dependencies. Both Prettier and ESLint auto-discover their configs by walking upward from the file being processed, so the lint-staged commands need no explicit `--config` flag and no `cwd` gymnastics.

---

## File inventory

| File | New/Modify | Purpose |
|---|---|---|
| `package.json` (repo root) | new | husky + lint-staged devDeps; lint-staged config; `prepare` script |
| `.husky/pre-commit` | new | one-line: `npx lint-staged` |
| `.gitignore` (repo root) | modify | add `/node_modules` for the root's own install (verify it isn't already covered) |

**Total new files:** 2. **Total modified files:** at most 1 (`.gitignore`, only if root `node_modules` isn't already ignored).

---

## Configuration

### Root `package.json`

```json
{
  "name": "cactus",
  "private": true,
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^15.2.10"
  },
  "lint-staged": {
    "src/frontend/src/**/*.{ts,tsx}": [
      "prettier --write",
      "eslint --fix"
    ],
    "src/frontend/src/**/*.{css,json}": [
      "prettier --write"
    ]
  }
}
```

Notes:
- `"private": true` prevents accidental npm publish.
- `"prepare": "husky"` is npm's lifecycle hook: it auto-runs after `npm install`. Husky 9's `husky` command (no args) installs the git hooks. This means hooks are wired the moment a contributor runs `npm install` at the root for the first time.
- The two-glob shape: ts/tsx files run prettier *then* eslint sequentially (lint-staged runs commands in the listed order per glob). css/json files run prettier only.

### `.husky/pre-commit`

```
npx lint-staged
```

Husky 9 dropped the `#!/bin/sh` shebang and `husky.sh` source line — pre-commit is now a plain script with the husky wrapper handling shell setup. This is the entire file content.

### Root `.gitignore`

Verify the existing root `.gitignore` covers either `/node_modules` or `node_modules` (the unrooted form matches everywhere). If it covers `src/frontend/node_modules` specifically (rather than a general `node_modules` rule), add `/node_modules` so the root's install doesn't get tracked.

---

## Pre-commit behavior contract

When a contributor runs `git commit` with a staged change:

1. Husky's pre-commit hook fires.
2. lint-staged identifies which staged files match each glob.
3. For each matching file, lint-staged runs the configured commands sequentially.
4. If a command modifies the file (Prettier auto-format, ESLint auto-fix), lint-staged re-stages the modified content.
5. If any command exits non-zero (unfixable ESLint error, parse failure, etc.), lint-staged aborts and the commit is rejected with the command's stderr.
6. If all commands succeed, the commit proceeds.

Partial staging via `git add -p` is handled correctly: lint-staged stashes unstaged hunks before running formatters, applies the formatters to staged-only content, re-stages fixed content, then restores the stash.

---

## Success criteria (mirrors parent spec § PR 5)

- `npm install` at repo root completes successfully.
- After install, `.git/hooks/pre-commit` exists (created by husky).
- A deliberately-malformed commit is rejected: introduce an unfixable ESLint error (e.g., `setState` inside a `useMemo`), `git add`, `git commit` → commit aborts with ESLint error in stderr.
- An auto-fixable commit succeeds with formatted content: introduce trailing whitespace and double quotes in a frontend file, `git add`, `git commit` → Prettier auto-fixes, commit succeeds, the committed content shows the corrected formatting.
- A clean commit (no formatter changes needed) proceeds without modification.

---

## Out of scope

- Pre-push hooks (CI is the test gate).
- Backend `dotnet format` in pre-commit (CI catches drift).
- `commit-msg` hook / commitlint (no convention enforced today).
- Monorepo workspace consolidation (frontend `package.json` stays independent).
- Pre-existing hook bypass via `--no-verify` (intentional escape valve; not a security boundary).

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Contributor skips `npm install` at root → hooks don't install → bypass occurs silently | Medium | Acceptable. CI is the backstop. Add a one-line CONTRIBUTING.md note if/when that doc exists. |
| `git add -p` partial staging produces unexpected interactions | Low | lint-staged's stash/restore mechanism handles this; well-tested behavior in lint-staged 15.x. |
| Prettier auto-discovers a parent `.prettierrc` from outside the repo | Very Low | Prettier walks upward looking for the *closest* config; `src/frontend/.prettierrc.json` will always win for files under `src/frontend/`. |
| ESLint flat config fails to resolve from absolute path passed by lint-staged | Very Low | ESLint flat config resolution from an absolute file path works; verified by manual smoke during execution. |
| Husky 9 hooks don't fire on Windows | Low | We don't have Windows contributors. Husky 9 supports Windows via Git for Windows' bash; if it ever matters, it'll surface on the first Windows commit. |
| `eslint --fix` modifies a file in a way that breaks tests | Low | The auto-fixable rules are syntactic (unused vars, hook deps, etc.) and rarely change semantics. CI test job catches semantic regressions. |

---

## Verification of the "auto-discovery works" assumption

During execution (Task 4 of the implementation plan), the implementer must run a deliberate test:

```bash
# From repo root after `npm install` and hook install:
echo "// trailing whitespace test " >> src/frontend/src/main.tsx
git add src/frontend/src/main.tsx
git commit -m "test: smoke pre-commit"
```

Expected: Prettier removes the trailing whitespace, lint-staged re-stages the file, commit succeeds, the resulting commit's diff shows no trailing whitespace.

Then back the change out (`git revert HEAD --no-edit && git reset HEAD~1`) so the smoke test doesn't ship with the PR.

---

## Open questions

None. Both decisions in the table at the top are locked.
