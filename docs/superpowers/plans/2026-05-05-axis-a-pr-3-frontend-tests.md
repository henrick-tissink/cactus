# Axis A PR 3 — Frontend Vitest + MSW + Page Smoke Tests

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the frontend test runner. After this PR merges, `npm test` runs Vitest with React Testing Library + MSW under jsdom and executes ~12 tests covering Login, Dashboard, Transactions, and Goals — establishing the frontend coverage baseline that PR 7 will lock as a gate.

**Architecture:** Vitest is configured via a dedicated `vitest.config.ts` (separate from `vite.config.ts` to keep dev-server concerns from leaking into tests). A central `src/test/setup.ts` registers `@testing-library/jest-dom` matchers, starts the MSW Node server, and resets handlers + the zustand auth store between tests. A custom `renderWithProviders` helper wraps components in `QueryClientProvider` (fresh `QueryClient` per test, `retry: false`) and `MemoryRouter`, so each page-level test can render in isolation without booting the full `App` shell. MSW v2 (`http`/`HttpResponse`) provides default handlers for every `/api/*` endpoint the four pages call; individual tests override handlers via `server.use(...)` to assert error or empty-state paths.

**Tech Stack:** Vitest 2.x · @testing-library/react 16.x (React 19 compatible) · @testing-library/jest-dom 6.x · @testing-library/user-event 14.x · MSW 2.x · jsdom 25.x · @vitest/coverage-v8 · TypeScript 5.9 (strict, `verbatimModuleSyntax`)

**Branch:** `axis-a/pr-3-frontend-tests`

**Spec reference:** `docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md` § PR 3 ("Frontend Vitest + MSW + smoke tests for Login, Dashboard, Transactions, Goals — `npm test` green; 12–20 tests").

**Frontend baseline:** Per spec (`§ Coverage strategy`, line 293), the frontend coverage baseline is measured *at the end of PR 3*. The gate is locked into `vitest.config.ts` during PR 7 (`floor(measured) − 2`). PR 3's job is only to produce the baseline number; do not add `coverage.thresholds` here.

---

## File structure (new files this PR creates)

```
src/frontend/
├── vitest.config.ts                    (new — Vitest config, separate from vite.config.ts)
├── package.json                        (modified — add devDeps + test scripts)
├── tsconfig.app.json                   (modified — add vitest globals to types)
└── src/
    ├── test/                            (new — test infra)
    │   ├── setup.ts                     (jest-dom + MSW lifecycle + zustand reset)
    │   ├── render.tsx                   (renderWithProviders helper)
    │   └── mocks/
    │       ├── handlers.ts              (default MSW handlers)
    │       └── server.ts                (setupServer wrapper)
    └── pages/
        ├── Login.test.tsx               (3 tests)
        ├── Dashboard.test.tsx           (3 tests)
        ├── Transactions.test.tsx        (3 tests)
        └── Goals.test.tsx               (3 tests)
```

Modified files:
- `src/frontend/package.json` — add devDeps (`vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, `jsdom`, `@types/node` already exists), add `"test"` and `"test:coverage"` scripts.
- `src/frontend/tsconfig.app.json` — extend `types` array with `vitest/globals` so `describe`/`it`/`expect` resolve under `noUnusedLocals`/`strict`.
- `src/frontend/.gitignore` — add `coverage/` (the directory `vitest --coverage` writes to).

**Total tests in this PR:** 12 across 4 page test files.

---

## Task 0: Worktree + branch

The worktree is created by the controller, not the implementer. The implementer starts from the worktree path on the named branch.

Working directory for all subsequent tasks: `/Users/henricktissink/Sauce/cactus/.worktrees/axis-a-pr-3`
Branch: `axis-a/pr-3-frontend-tests` (branched from `main`).

If executing inline (no controller), create the worktree manually first:

```bash
cd /Users/henricktissink/Sauce/cactus
git worktree add .worktrees/axis-a-pr-3 -b axis-a/pr-3-frontend-tests main
cd .worktrees/axis-a-pr-3
```

All paths in subsequent tasks are relative to this worktree root.

---

## Task 1: Install dev dependencies + add test scripts

**Files:**
- Modify: `src/frontend/package.json`

- [ ] **Step 1: Install runtime test dependencies**

Run from the worktree root:

```bash
cd src/frontend
npm install --save-dev \
  vitest@^2.1.8 \
  @vitest/coverage-v8@^2.1.8 \
  @testing-library/react@^16.1.0 \
  @testing-library/jest-dom@^6.6.3 \
  @testing-library/user-event@^14.5.2 \
  msw@^2.7.0 \
  jsdom@^25.0.1
```

These versions are pinned to match the existing toolchain (React 19 + Vite 7 + TypeScript 5.9). `@testing-library/react` v16 is the first version with React 19 support; `vitest` 2.x pairs with Vite 7.

- [ ] **Step 2: Add test scripts to `package.json`**

Edit the `"scripts"` block in `src/frontend/package.json` so it reads exactly:

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

`vitest run` (one-shot) is the script used in CI; `test:watch` is for local iteration. CI in PR 4 will invoke `npm test -- --coverage` per the spec workflow; that maps to `vitest run --coverage` via the npm `--` flag.

- [ ] **Step 3: Verify install**

Run: `npx vitest --version`
Expected: prints something like `vitest/2.1.x ...`. If it errors, the install failed.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/package.json src/frontend/package-lock.json
git commit -m "chore(frontend): add vitest + RTL + MSW dev dependencies"
```

---

## Task 2: Add coverage directory to .gitignore

**Files:**
- Modify: `src/frontend/.gitignore` (or root `.gitignore` — whichever already covers `node_modules` for the frontend)

- [ ] **Step 1: Locate the existing frontend gitignore**

Run: `cat src/frontend/.gitignore 2>/dev/null || echo "no frontend gitignore"`
Run: `grep -n "frontend" .gitignore 2>/dev/null`

Expected: the frontend has its own `.gitignore` (Vite scaffolds one). If not, fall back to the repo-root `.gitignore`.

- [ ] **Step 2: Append `coverage/` if absent**

If `src/frontend/.gitignore` exists and does not already contain `coverage`, append:

```
# Vitest coverage output
coverage/
```

If only the root `.gitignore` is in play, append the same lines there with the path prefixed: `src/frontend/coverage/`.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/.gitignore
git commit -m "chore(frontend): ignore vitest coverage output"
```

---

## Task 3: Create `vitest.config.ts`

**Files:**
- Create: `src/frontend/vitest.config.ts`

- [ ] **Step 1: Write the config**

Create `src/frontend/vitest.config.ts` with this exact content:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],
      include: ['src/pages/**', 'src/api/**', 'src/store/**'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        'src/test/**',
        'src/main.tsx',
      ],
    },
  },
});
```

Notes:
- `tailwindcss()` is intentionally NOT included — tests render React components by `className` strings; processing Tailwind in jsdom adds latency with no value.
- `css: false` makes CSS imports return empty modules (avoids parsing `index.css` if anything pulls it in transitively).
- `include` for coverage targets the surfaces this PR exercises. PR 7 may broaden it; do not pre-emptively widen here.

- [ ] **Step 2: Commit (placeholder — config alone won't run yet)**

Skip committing here; we'll commit after the setup file exists in Task 5 (otherwise the config references a non-existent file and any `vitest` invocation between commits errors).

---

## Task 4: Add Vitest globals to TypeScript config

**Files:**
- Modify: `src/frontend/tsconfig.app.json`

- [ ] **Step 1: Edit `tsconfig.app.json` `types` array**

Find the line:

```json
"types": ["vite/client"],
```

Change it to:

```json
"types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"],
```

This makes `describe`, `it`, `expect`, and the `toBeInTheDocument`-style matchers visible to the TypeScript compiler so that `tsc -b` (run by `npm run build`) does not flag test files as errors. (`include` already covers `src`, so `*.test.tsx` files are in scope.)

- [ ] **Step 2: Verify type-check still passes**

Run: `npx tsc -b`
Expected: zero output, exit 0. If errors mention `Cannot find type definition file for 'vitest/globals'`, the Task 1 install failed — re-run it.

- [ ] **Step 3: Commit (deferred)**

Defer the commit until Task 5 lands; tsconfig + setup file are paired changes.

---

## Task 5: Create test setup file

**Files:**
- Create: `src/frontend/src/test/setup.ts`

- [ ] **Step 1: Write the setup file**

```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';
import { useAuthStore } from '../store/authStore';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
});

afterAll(() => {
  server.close();
});
```

Why each line:
- `'@testing-library/jest-dom/vitest'` — registers matchers like `toBeInTheDocument()` against Vitest's `expect`.
- `onUnhandledRequest: 'error'` — surfaces any test that hits an endpoint without an MSW handler instead of silently 404ing.
- `cleanup()` — RTL doesn't auto-cleanup with Vitest; required to unmount between tests.
- `localStorage.clear()` — `apiClient` stores tokens here; bleed-over breaks 401-refresh logic.
- `useAuthStore.setState(...)` — zustand state is module-global; reset to logged-out per test.

- [ ] **Step 2: (no run yet — server.ts is built next)**

---

## Task 6: Create MSW server + default handlers

**Files:**
- Create: `src/frontend/src/test/mocks/server.ts`
- Create: `src/frontend/src/test/mocks/handlers.ts`

- [ ] **Step 1: Write `server.ts`**

```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

- [ ] **Step 2: Write `handlers.ts`**

These are the *default* (happy-path) handlers. Tests override per-test with `server.use(http.get('/api/...', () => ...))`.

```ts
import { http, HttpResponse } from 'msw';
import type { GoalDto, MacroCategoryWithCategories, TransactionsResult } from '../../types';
import { GoalType, MacroCategoryType, TransactionType } from '../../types';

const dashboardSummary = {
  monthlyIncome: 50000,
  totalSpent: 12000,
  buckets: [
    { type: MacroCategoryType.Needs, name: 'Needs', allocated: 25000, spent: 8000, remaining: 17000 },
    { type: MacroCategoryType.Wants, name: 'Wants', allocated: 15000, spent: 4000, remaining: 11000 },
    { type: MacroCategoryType.Goals, name: 'Goals', allocated: 10000, spent: 0, remaining: 10000 },
  ],
  unclassifiedCount: 0,
  recentTransactions: [
    {
      id: 'tx-1',
      description: 'Woolworths',
      amount: -450,
      transactionDate: '2026-05-01T00:00:00Z',
      isClassified: true,
      categoryName: 'Groceries',
    },
  ],
};

const goalsList: GoalDto[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund',
    goalType: GoalType.EmergencyFund,
    targetAmount: 30000,
    currentAmount: 5000,
    progressPercentage: 16.67,
    priority: 1,
    isActive: true,
    isCompleted: false,
    isPrimary: true,
    milestones: [],
  },
];

const transactionsResult: TransactionsResult = {
  items: [
    {
      id: 'tx-1',
      accountId: 'acc-1',
      accountName: 'FNB Cheque',
      amount: 450,
      type: TransactionType.Debit,
      description: 'Woolworths',
      transactionDate: '2026-05-01T00:00:00Z',
      isClassified: true,
      isManual: false,
      macroCategoryName: 'Needs',
      categoryName: 'Groceries',
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

const categories: MacroCategoryWithCategories[] = [
  {
    id: 'macro-needs',
    type: MacroCategoryType.Needs,
    name: 'Needs',
    description: 'Essential expenses',
    categories: [],
  },
];

export const handlers = [
  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'fail@example.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({
      userId: 'u-1',
      email: body.email,
      firstName: 'Test',
      lastName: 'User',
      isOnboardingComplete: true,
      isEmailVerified: true,
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
    });
  }),

  // Dashboard
  http.get('/api/dashboard/summary', () => HttpResponse.json(dashboardSummary)),

  // Goals
  http.get('/api/goals', () => HttpResponse.json(goalsList)),
  http.get('/api/goals/recommended-sequence', () => HttpResponse.json([])),

  // Transactions
  http.get('/api/transactions', () => HttpResponse.json(transactionsResult)),

  // Accounts (Transactions page fetches this for filter dropdown)
  http.get('/api/accounts', () => HttpResponse.json([])),

  // Categories (Transactions page fetches this for classify modal)
  http.get('/api/categories', () => HttpResponse.json(categories)),
];
```

- [ ] **Step 3: Commit Tasks 3–6 together**

```bash
git add src/frontend/vitest.config.ts \
        src/frontend/tsconfig.app.json \
        src/frontend/src/test/setup.ts \
        src/frontend/src/test/mocks/server.ts \
        src/frontend/src/test/mocks/handlers.ts
git commit -m "test(frontend): vitest + MSW infrastructure"
```

- [ ] **Step 4: Sanity check — run vitest with no tests**

Run: `npx vitest run`
Expected: prints `No test files found, exiting with code 1` (or similar). This confirms vitest loads the config without crashing. Exit code 1 here is fine — we'll have tests after Task 8.

---

## Task 7: Create `renderWithProviders` helper

**Files:**
- Create: `src/frontend/src/test/render.tsx`

- [ ] **Step 1: Write the helper**

```tsx
import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { initialRoute = '/', ...options }: RenderWithProvidersOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}
```

Why a fresh `QueryClient` per render: stale data and cached queries leak across tests otherwise, causing surprising "this test passes alone but fails after the previous one" bugs.

Why `MemoryRouter` over `BrowserRouter`: jsdom defaults to `http://localhost/`; `BrowserRouter` would write to `window.location` and bleed across tests. `MemoryRouter` is fully in-memory.

- [ ] **Step 2: Commit**

```bash
git add src/frontend/src/test/render.tsx
git commit -m "test(frontend): add renderWithProviders helper"
```

---

## Task 8: Login page tests

**Files:**
- Create: `src/frontend/src/pages/Login.test.tsx`
- Test: `src/frontend/src/pages/Login.tsx` (no modification)

- [ ] **Step 1: Write the failing test file**

```tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { LoginPage } from './Login';

describe('LoginPage', () => {
  it('renders the email and password fields', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('logs in successfully and stores tokens', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'hunter2');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('test-access');
    });
    expect(localStorage.getItem('refreshToken')).toBe('test-refresh');
  });

  it('shows an error message when credentials are rejected', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ message: 'bad' }, { status: 401 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'fail@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
```

Why the regex `/^password$/i`: there are two password-related elements (the field + the show/hide button labeled "Show password"). Anchoring matches the field exactly.

- [ ] **Step 2: Run the tests — expect them to pass**

Run: `npx vitest run src/pages/Login.test.tsx`
Expected: 3 tests, all green.

If the first test fails with "Unable to find element with label 'Email'": the `htmlFor`/`id` pair on the input is correct in the source (line 130/135), so this would indicate a render-tree problem — check that `MemoryRouter` is in scope (login uses `<Link>`).

If the success test times out: the MSW handler isn't intercepting. Verify `apiClient.baseURL` is `/api` (it is — `src/api/client.ts:3`) and that the handler path matches `/api/auth/login` exactly.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/pages/Login.test.tsx
git commit -m "test(frontend): Login page smoke + auth flow tests"
```

---

## Task 9: Dashboard page tests

**Files:**
- Create: `src/frontend/src/pages/Dashboard.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { DashboardPage } from './Dashboard';

describe('DashboardPage', () => {
  it('shows a loading state initially', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('renders the monthly summary once data resolves', async () => {
    renderWithProviders(<DashboardPage />);

    // Default handler returns income 50000, spent 12000 → remaining 38000
    expect(await screen.findByText('R38,000')).toBeInTheDocument();
    expect(screen.getByText(/spending plan/i)).toBeInTheDocument();
  });

  it('shows the onboarding checklist when there are no transactions or income', async () => {
    server.use(
      http.get('/api/dashboard/summary', () =>
        HttpResponse.json({
          monthlyIncome: 0,
          totalSpent: 0,
          buckets: [],
          unclassifiedCount: 0,
          recentTransactions: [],
        })
      ),
      http.get('/api/goals', () => HttpResponse.json([]))
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/let's get your finances in order/i)
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/import your first bank statement/i)
    ).toBeInTheDocument();
  });
});
```

Number formatting note: `Number(38000).toLocaleString()` in en-US returns `"38,000"`; in jsdom the default locale is en-US. The expected string `R38,000` therefore matches the rendered output `R{remaining.toLocaleString()}` at `Dashboard.tsx:303`. If a future Node default changes the locale, these tests will break visibly — fine; they're brittle in a useful way.

- [ ] **Step 2: Run the tests**

Run: `npx vitest run src/pages/Dashboard.test.tsx`
Expected: 3 tests green.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/pages/Dashboard.test.tsx
git commit -m "test(frontend): Dashboard page smoke + summary + onboarding tests"
```

---

## Task 10: Transactions page tests

**Files:**
- Create: `src/frontend/src/pages/Transactions.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { TransactionsPage } from './Transactions';

describe('TransactionsPage', () => {
  it('renders a transaction row from the API', async () => {
    renderWithProviders(<TransactionsPage />);

    expect(
      await screen.findByText(/woolworths/i)
    ).toBeInTheDocument();
  });

  it('toggles the filters panel when the Filters button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionsPage />);

    expect(screen.queryByLabelText(/^account$/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /filters/i }));

    expect(await screen.findByLabelText(/^account$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^status$/i)).toBeInTheDocument();
  });

  it('opens the Add Transaction modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionsPage />);

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    expect(
      await screen.findByRole('heading', { name: /add transaction/i })
    ).toBeInTheDocument();
  });
});
```

Why anchored regexes: the page has multiple `Account` strings (the filter label + the column header in the modal); `/^account$/i` matches the label exactly. Same logic for `^status$`.

The "Add Transaction" assertion uses `findByRole('heading', ...)` to disambiguate from the trigger button (which has the same accessible name).

- [ ] **Step 2: Run the tests**

Run: `npx vitest run src/pages/Transactions.test.tsx`
Expected: 3 tests green. If the first test times out, check that `MSWHandlerError: unhandled GET request` doesn't appear — the page also fetches `/api/accounts` and `/api/categories`; both have default handlers in Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/pages/Transactions.test.tsx
git commit -m "test(frontend): Transactions page smoke + filters + add modal tests"
```

---

## Task 11: Goals page tests

**Files:**
- Create: `src/frontend/src/pages/Goals.test.tsx`

- [ ] **Step 1: Inspect the New-Goal trigger before writing tests**

Run: `grep -n -i "new goal\|create goal\|add goal\|setShowCreateModal(true)" src/frontend/src/pages/Goals.tsx | head -10`

Capture the exact button text the page uses to open the create modal. Use that text in the regex below; if it differs from "New Goal" or "Create Goal", update the test accordingly. (Plan author saw `setShowCreateModal(true)` wired to a button; the visible label is what the test must match.)

- [ ] **Step 2: Write the test file**

```tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { GoalsPage } from './Goals';

describe('GoalsPage', () => {
  it('renders the user\'s goal from the API', async () => {
    renderWithProviders(<GoalsPage />);

    expect(await screen.findByText(/emergency fund/i)).toBeInTheDocument();
  });

  it('shows an empty/zero state when there are no goals', async () => {
    server.use(
      http.get('/api/goals', () => HttpResponse.json([])),
      http.get('/api/goals/recommended-sequence', () => HttpResponse.json([]))
    );

    renderWithProviders(<GoalsPage />);

    // Loading skeleton should disappear; "Emergency Fund" must NOT appear.
    await waitFor(() => {
      expect(screen.queryByText(/emergency fund/i)).not.toBeInTheDocument();
    });
  });

  it('opens the create-goal modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GoalsPage />);

    await screen.findByText(/emergency fund/i);

    // Use the label captured in Step 1 if different from "New Goal".
    const trigger = screen.getByRole('button', { name: /new goal/i });
    await user.click(trigger);

    // Assert the modal opened — match a stable element inside it.
    // If the implementer finds the modal heading is "Create a new goal" or
    // similar, swap the regex accordingly.
    expect(
      await screen.findByRole('heading', { name: /goal/i })
    ).toBeInTheDocument();
  });
});
```

This test file is the one most likely to need a small label tweak — Goals.tsx is 742 lines and the plan author only inspected the first 120. The implementer **must** open the file to confirm:
1. The button text that opens the modal (Step 1).
2. The modal heading text used inside the create form.

If the modal-heading assertion is too generic and matches the page's `<h1>Goals</h1>`, narrow the selector to a more specific element inside the modal (e.g., a "Goal name" input or the "Cancel"/"Create" footer button).

- [ ] **Step 3: Run the tests**

Run: `npx vitest run src/pages/Goals.test.tsx`
Expected: 3 tests green. If test 3 fails because the button label differs, update the regex per Step 1's findings and re-run.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/pages/Goals.test.tsx
git commit -m "test(frontend): Goals page smoke + empty state + create modal tests"
```

---

## Task 12: Full-suite smoke + coverage baseline

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: 12 tests passed across 4 files. No "unhandled request" warnings (those would indicate a missing MSW handler).

- [ ] **Step 2: Run with coverage**

Run: `npm run test:coverage`
Expected: same 12 tests pass. A coverage table prints to stdout. `coverage/lcov.info` exists.

- [ ] **Step 3: Record the baseline**

Read the printed `% Lines` for the `pages/` directory. This is the **frontend coverage baseline** referenced in the design doc § Coverage strategy (line 293). Record it in the PR description; PR 7 will lock the gate at `floor(baseline) − 2`.

The baseline is informational at this point — do not add `coverage.thresholds` to `vitest.config.ts` in this PR.

- [ ] **Step 4: Verify build still passes**

Run: `npm run build`
Expected: `tsc -b` produces no errors and `vite build` succeeds. This confirms the test files type-check cleanly under the existing `strict + verbatimModuleSyntax` settings.

- [ ] **Step 5: Verify lint still passes**

Run: `npm run lint`
Expected: zero errors. If the new test files trip ESLint rules (e.g., `react-refresh/only-export-components` complains about non-component exports in `render.tsx`), add a focused ESLint disable comment at the top of `render.tsx` rather than weakening the rule globally.

- [ ] **Step 6: Final commit (only if anything changed in Step 5's lint fix)**

```bash
git add -u
git commit -m "test(frontend): satisfy lint on test helper exports"
```

---

## Task 13: Open the PR

**Files:**
- None (process step)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin axis-a/pr-3-frontend-tests
```

If `gh auth status` reports "not logged in", stop and tell the user to run `gh auth login` in the terminal — do not attempt to authenticate non-interactively from inside the agent.

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Axis A PR 3: Frontend Vitest + MSW + page smoke tests" --body "$(cat <<'EOF'
## Summary
- Vitest + React Testing Library + MSW configured under jsdom (`vitest.config.ts`).
- 12 tests across 4 critical pages (Login, Dashboard, Transactions, Goals).
- Establishes the **frontend coverage baseline** referenced in the Axis A design doc § Coverage strategy. PR 7 will lock the gate at `floor(baseline) − 2`.

## Frontend coverage baseline (from `npm run test:coverage`)
- `src/pages/`: **<fill in from Task 12 step 3>%** lines

## Test plan
- [x] `npm test` green (12/12)
- [x] `npm run test:coverage` green; `coverage/lcov.info` produced
- [x] `npm run build` green (TypeScript still happy with new test types)
- [x] `npm run lint` green
- [ ] CI runs once PR 4 lands the workflow file

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Report PR URL back to the user.**

---

## Self-review checklist

**Spec coverage (against `2026-05-03-axis-a-confidence-design.md` § PR 3):**

| Spec line | Plan coverage |
|-----------|---------------|
| "Vitest + React Testing Library" | Task 1 (install) + Task 3 (config) |
| "MSW for API mocking" | Task 6 (handlers + server) |
| "Smoke tests for: login, dashboard, transactions list, goals" | Tasks 8, 9, 10, 11 |
| "1 smoke test per critical page + 1 interactive test per page" | Each page has 1 smoke + ≥1 interactive |
| "~12–20 tests total in PR 3" | Exactly 12 tests |
| "Vitest discovers `*.test.tsx` colocated with source" | `vitest.config.ts include: ['src/**/*.test.{ts,tsx}']`; tests live in `src/pages/*.test.tsx` |
| "frontend baseline at end of PR 3" | Task 12 step 3 records baseline; gate locked in PR 7 (out of scope here) |

**Placeholder scan:** No "TBD"/"implement later"/"add validation"/"similar to Task N" left in the plan. Goals.test.tsx step 1 explicitly tells the implementer to look up two labels in the source — that's directed reading, not a placeholder for missing decisions.

**Type consistency check:**
- `renderWithProviders` signature `(ui: ReactElement, options?: { initialRoute?: string }) → { queryClient, ...renderResult }` — used identically in Tasks 8–11.
- `server` exported as a named export from `./mocks/server` — used identically in Tasks 8, 9, 11 (Task 10 does not need it; only default handlers).
- MSW pattern `http.post('/api/auth/login', ...)` — same path style used in handlers.ts and per-test overrides.
- `MacroCategoryType` / `TransactionType` / `GoalType` referenced via the existing `as const` exports in `src/types/index.ts` — no new types invented.

**Risks / known fragilities flagged in the plan:**
- Task 11 (Goals modal): plan author did not read the full 742-line `Goals.tsx`. Step 1 in Task 11 directs the implementer to confirm two labels before relying on them. Acceptable trade-off: keeps this plan from baking in a guess.
- Task 9 number-formatting: `toLocaleString()` is locale-sensitive. en-US is jsdom default; documented inline so a future locale change produces a readable failure.
