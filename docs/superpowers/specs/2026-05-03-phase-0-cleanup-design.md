# Phase 0 — Foundation Cleanup

**Date:** 2026-05-03
**Parent:** [2026-05-03-100x-roadmap.md](2026-05-03-100x-roadmap.md)
**Status:** Draft, awaiting user review
**Effort:** ~1 hour
**Depth:** Solid (these stay in place forever)

---

## Goal

Clean up the deck before Axis A (Confidence) — remove leftover scaffold, kill the warning noise in prod logs, externalize secrets, and put the repo under version control. None of this needs design discussion; each item has one obvious right answer. Listing them with the chosen answer so the user can object before I execute.

## Why now (not later)

- Repo not under git → can't ship Axis A's CI without it.
- Hardcoded dev secrets in `docker-compose.yml` → can't safely add new collaborators or commit confidently.
- `WeatherForecastController` + `UseHttpsRedirection` warning → noise that pollutes Axis B's log shipping if left in.
- Dead `onGoalCompleted` wiring in `Goals.tsx` → confuses anyone reading the file (including me writing Axis C's spec).

## Items

### 1. Delete `WeatherForecastController` + DTO

- Files: `src/backend/src/Cactus.Api/Controllers/WeatherForecastController.cs`, `WeatherForecast.cs` (or wherever the DTO lives — verify before delete).
- Verification: nothing in `src/frontend/src` calls `/WeatherForecast`; the dotnet project builds without these.

### 2. Remove `app.UseHttpsRedirection()` from `Program.cs`

- One-line removal in `src/backend/src/Cactus.Api/Program.cs`.
- Justification: Caddy redirects 80→443 at the edge in prod. The middleware can't determine the HTTPS port (no `https_port` config), so it logs `Failed to determine the https port for redirect` on every request. Dev frontend hits HTTP directly; nothing in our setup needs this middleware.

### 3. Wrap `AddSwaggerGen` behind `IsDevelopment()`

- In `Program.cs`, wrap the `builder.Services.AddSwaggerGen()` call in `if (builder.Environment.IsDevelopment())`. The `UseSwagger`/`UseSwaggerUI` calls are already conditional; the registration is the last bit leaking into prod (harmless but unnecessary). Trims a small startup cost.

### 4. Goals.tsx — remove dead `onGoalCompleted` wiring

**Decision: option C (remove dead wiring), not a real fix.**

The current code has:
- A `GoalCard` prop `onGoalCompleted?: () => void` (declared, never invoked).
- The parent passes a callback at line 244 that would set up the next-goal-suggestion prompt.
- The callback never fires because the modal's `onSuccess` doesn't know whether the update completed the goal.

A *real* fix needs to change `UpdateProgressModal`'s `onSuccess` signature to pass back the new goal state, then the parent decides whether to trigger the prompt. That's not Phase 0 trivial — it's a small feature with edge cases (what if the user marks a goal complete via a different path? what about non-primary goals?). It belongs in Axis C with proper tests behind it.

What Phase 0 does:
- Remove the `onGoalCompleted?` prop from `GoalCard`'s type.
- Remove the dead callback at lines 244–250.
- Remove the `PrimaryGoalPromptModal` rendering at lines 317–326 (it can never fire).
- Remove the `showPrimaryPrompt` and `suggestedNextGoal` state.
- **Also delete** `getNextSuggestedGoal` function and `PrimaryGoalPromptModal` component definitions — TypeScript `noUnusedLocals` (enabled in `tsconfig.app.json`) would fail the build with these as dead code. Axis C re-implements both as part of properly wiring the next-goal flow with tests.

### 5. Externalize secrets in `docker-compose.yml`

Currently the base file hardcodes `cactus_dev` and `DockerDevSecretKey_...`. Change to:

- `POSTGRES_USER`, `POSTGRES_DB`: keep as static `cactus` (not secrets, simplifies dev).
- `POSTGRES_PASSWORD`: `${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}` — required.
- `Jwt__Key`: `${JWT_KEY:?JWT_KEY must be set}` — required.
- Same for `docker-compose.dev.yml` (today also has hardcoded values).

Add `.env.example` (committed) with safe dev defaults:
```
POSTGRES_PASSWORD=cactus_dev
JWT_KEY=DevOnlySecretKey_DoNotUseInProduction_AtLeast32Chars!
```

Add `.env` (NOT committed) by copying `.env.example` for local dev. Existing prod `.env` on the server stays untouched.

Document the bootstrap inline as a comment at the top of `.env.example`: "Copy this file to `.env` and adjust values for local dev. Required for `docker compose up`." (Skip creating a top-level README.md — that belongs to a later docs polish pass, not Phase 0.)

### 6. Initialize git, push to GitHub

- `git init` at repo root (`/Users/henricktissink/Sauce/cactus`).
- `.gitignore` covering: `node_modules/`, `bin/`, `obj/`, `dist/`, `.vs/`, `.idea/`, `.env` (and `.env.local` etc.), `*.docx`, `screenshots/`, `*.user`, `.DS_Store`. Allow `.env.example`.
- Initial commit.
- Repo: name `cactus`, **private** (contains business logic + future user data flows).
- Push: requires `gh auth login` (the user runs this interactively via `! gh auth login` in the chat). Once authenticated, I run `gh repo create cactus --private --source=. --push`.

If the user delays auth: do everything else in Phase 0; push as the very last thing once they auth.

## Out of scope for Phase 0

- Real fix for the next-goal-suggestion flow (Axis C).
- Renaming or restructuring `appsettings.json` (out of scope; safe as-is).
- Adding tests (Axis A).
- Adding CI (Axis A).
- Removing `appsettings.Development.json` from the repo (it's `DoNotUseInProduction`-prefixed; keeping in git so new devs get a working local config).

## Success criteria

- `docker compose up` fails fast with a clear error if `.env` is missing.
- Prod API logs no longer contain `Failed to determine the https port for redirect`.
- `git status` returns clean from root; `git log` has at least one commit.
- GitHub repo `cactus` exists (private), and `git push` from the dev box succeeds.
- Frontend build is still green (no TS errors after the Goals.tsx pruning).
- Backend build is still green (no missing types after WeatherForecast deletion).

## Execution order

Sequential because some steps depend on others:

1. Item 5 (`.env.example` + compose updates) — preserves working local dev.
2. Item 6 first half (`git init` + `.gitignore` + initial commit) — capture state before mutations.
3. Items 1, 2, 3, 4 (code edits in any order).
4. Verify backend + frontend still build (`docker compose build`).
5. Commit code edits with a clear message.
6. Item 6 second half (`gh repo create` + push) — after user runs `! gh auth login`.

Total wall-clock target: under 1 hour (excluding GH auth wait).
