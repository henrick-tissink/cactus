# Axis A PR 2 — Application-Layer Unit Tests

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `Cactus.Application.Tests` with handler-level unit tests covering Auth, Goals, Accounts, Transactions, and SpendingPlans. After this PR merges, `Cactus.Application` has ≥35% line coverage from its own test project, establishing the backend baseline gate (set in PR 7).

**Architecture:** New test project at `src/backend/tests/Cactus.Application.Tests/`. A single `HandlerTestBase` provides a real `CactusDbContext` over a per-test **SQLite in-memory** database (created via `EnsureCreated`, no migrations) — chosen over EF Core in-memory provider for closer-to-real EF behavior, and over Testcontainers for speed. Service-layer dependencies (`IPasswordHasher`, `IJwtService`, `IEmailService`, `ICurrentUserService`) are mocked with **NSubstitute**. Test data via **Bogus**. The test project references `Cactus.Infrastructure` to use the real `CactusDbContext` — a pragmatic clean-architecture compromise that avoids re-implementing 22 entity configurations.

**Tech Stack:** .NET 8 target / .NET 10 SDK · xUnit · FluentAssertions · NSubstitute · Bogus · `Microsoft.EntityFrameworkCore.Sqlite` · `coverlet.collector` · References `Cactus.Application` + `Cactus.Domain` + `Cactus.Infrastructure`

**Branch:** `axis-a/pr-2-application-tests`

**Spec reference:** `docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md` § PR 2 ("≥35% line coverage on `Cactus.Application`").

**Environment quirk reminder:** Local has only .NET 9/10 runtimes; tests need `DOTNET_ROLL_FORWARD=LatestMajor` prefixed. CI is unaffected.

---

## File structure (new files this PR creates)

```
src/backend/tests/Cactus.Application.Tests/
├── Cactus.Application.Tests.csproj
├── _Common/
│   ├── HandlerTestBase.cs      (SQLite in-memory CactusDbContext, IDisposable cleanup)
│   └── TestDataFactory.cs      (Bogus generators for User, Goal, Account, Transaction, SpendingPlan)
├── Auth/
│   ├── RegisterCommandHandlerTests.cs        (2 tests: happy + duplicate email)
│   ├── LoginCommandHandlerTests.cs           (2 tests: happy + wrong password)
│   └── RefreshTokenCommandHandlerTests.cs    (2 tests: happy + invalid/expired token)
├── Goals/
│   ├── CreateGoalCommandHandlerTests.cs      (1 test: happy)
│   ├── UpdateGoalProgressCommandHandlerTests.cs (2 tests: happy + completes-on-target)
│   └── GetGoalsQueryHandlerTests.cs          (1 test: filters to current user)
├── Accounts/
│   ├── CreateAccountCommandHandlerTests.cs   (1 test: happy)
│   └── GetAccountsQueryHandlerTests.cs       (1 test: filters to current user)
├── Transactions/
│   ├── CreateTransactionCommandHandlerTests.cs  (1 test: happy)
│   └── GetTransactionsQueryHandlerTests.cs   (1 test: date filter)
└── SpendingPlans/
    └── GetCurrentSpendingPlanQueryHandlerTests.cs  (1 test: returns active plan)
```

Modified files:
- `src/backend/Cactus.slnx` — add the new test project under `/tests/`.

**Total tests in this PR:** ~14 across 11 handler test files, covering 11 handlers in 5 feature areas.

---

## Task 0: Worktree + branch

Worktree is created by the controller (not the implementer). The implementer starts from the worktree path on the named branch.

Working directory for all subsequent tasks: `/Users/henricktissink/Sauce/cactus/.worktrees/axis-a-pr-2`
Branch: `axis-a/pr-2-application-tests`

---

## Task 1: Scaffold the test project + packages

**Files:**
- Create: `src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj`
- Modify: `src/backend/Cactus.slnx`

- [ ] **Step 1: Create the csproj**

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
    <RootNamespace>Cactus.Application.Tests</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.1" />
    <PackageReference Include="xunit" Version="2.9.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="FluentAssertions" Version="6.12.2" />
    <PackageReference Include="NSubstitute" Version="5.3.0" />
    <PackageReference Include="Bogus" Version="35.6.1" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.10" />
    <PackageReference Include="coverlet.collector" Version="6.0.2">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\Cactus.Application\Cactus.Application.csproj" />
    <ProjectReference Include="..\..\src\Cactus.Domain\Cactus.Domain.csproj" />
    <ProjectReference Include="..\..\src\Cactus.Infrastructure\Cactus.Infrastructure.csproj" />
  </ItemGroup>

</Project>
```

- [ ] **Step 2: Add to solution**

```bash
cd src/backend
dotnet sln Cactus.slnx add tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --solution-folder /tests/
```

Expected: `Project 'tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj' added to the solution.`

- [ ] **Step 3: Restore and build**

```bash
dotnet restore tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj
dotnet build tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --no-restore -c Debug
```

Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`.

- [ ] **Step 4: Commit**

```bash
git add src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj src/backend/Cactus.slnx
git commit -m "test(application): scaffold Cactus.Application.Tests project with NSubstitute + Bogus + SQLite"
```

---

## Task 2: HandlerTestBase + TestDataFactory

**Files:**
- Create: `src/backend/tests/Cactus.Application.Tests/_Common/HandlerTestBase.cs`
- Create: `src/backend/tests/Cactus.Application.Tests/_Common/TestDataFactory.cs`

The base class owns a SQLite in-memory connection (must be kept open for the lifetime of the test) and a `CactusDbContext` over it. Tests inherit and use `Context` directly to seed data and verify side effects.

- [ ] **Step 1: Create `HandlerTestBase.cs`**

```csharp
using Cactus.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Tests._Common;

/// <summary>
/// Base class for handler unit tests. Owns a SQLite in-memory database for the
/// lifetime of the test class instance. EF schema is created via
/// <c>EnsureCreated</c> from the model (no migrations applied — Postgres-specific
/// migration SQL is intentionally bypassed).
/// </summary>
public abstract class HandlerTestBase : IDisposable
{
    private readonly SqliteConnection _connection;
    protected CactusDbContext Context { get; }

    protected HandlerTestBase()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<CactusDbContext>()
            .UseSqlite(_connection)
            .Options;

        Context = new CactusDbContext(options);
        Context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
        GC.SuppressFinalize(this);
    }
}
```

- [ ] **Step 2: Create `TestDataFactory.cs`**

```csharp
using Bogus;
using Cactus.Domain.Entities;

namespace Cactus.Application.Tests._Common;

/// <summary>
/// Bogus-backed factories for domain entities. Keep generators deterministic
/// (fixed seeds) so test runs are reproducible.
/// </summary>
public static class TestDataFactory
{
    private const int Seed = 42;

    public static User User(string? email = null) =>
        new Faker<User>()
            .UseSeed(Seed)
            .RuleFor(u => u.Email, f => email ?? f.Internet.Email().ToLower())
            .RuleFor(u => u.PasswordHash, f => f.Random.AlphaNumeric(60))
            .RuleFor(u => u.FirstName, f => f.Name.FirstName())
            .RuleFor(u => u.LastName, f => f.Name.LastName())
            .RuleFor(u => u.IsOnboardingComplete, false)
            .Generate();

    public static Goal Goal(Guid userId) =>
        new Faker<Goal>()
            .UseSeed(Seed)
            .RuleFor(g => g.UserId, userId)
            .RuleFor(g => g.Name, f => f.Lorem.Sentence(3))
            .RuleFor(g => g.GoalType, GoalType.EmergencyFund)
            .RuleFor(g => g.TargetAmount, f => f.Random.Decimal(1000m, 100000m))
            .RuleFor(g => g.CurrentAmount, 0m)
            .RuleFor(g => g.IsActive, true)
            .RuleFor(g => g.IsCompleted, false)
            .Generate();

    public static Account Account(Guid userId) =>
        new Faker<Account>()
            .UseSeed(Seed)
            .RuleFor(a => a.UserId, userId)
            .RuleFor(a => a.Name, f => f.Finance.AccountName())
            .RuleFor(a => a.AccountType, AccountType.Cheque)
            .RuleFor(a => a.Balance, f => f.Random.Decimal(0m, 50000m))
            .RuleFor(a => a.Currency, "ZAR")
            .RuleFor(a => a.IsActive, true)
            .RuleFor(a => a.IsManual, true)
            .Generate();
}
```

(If any property name in the Domain entities differs from what's used here — e.g., `GoalType.EmergencyFund` enum or `AccountType.Cheque` — adjust to match. The implementer should `cat src/backend/src/Cactus.Domain/Entities/Goal.cs` and `Account.cs` first to verify.)

- [ ] **Step 3: Build**

```bash
cd src/backend
dotnet build tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --no-restore -c Debug
```

Expected: 0 errors. (Compile errors here likely indicate property-name mismatches in `TestDataFactory`. Fix those by aligning to the actual entity properties.)

- [ ] **Step 4: Commit**

```bash
git add src/backend/tests/Cactus.Application.Tests/_Common/
git commit -m "test(application): HandlerTestBase (SQLite in-memory) + TestDataFactory (Bogus)"
```

---

## Task 3: Smoke test — verify the SQLite + DbContext setup actually works

**Files:**
- Create: `src/backend/tests/Cactus.Application.Tests/SmokeTests.cs`

A 3-line test that exercises the full plumbing before writing handler tests on top.

- [ ] **Step 1: Write the smoke test**

```csharp
using Cactus.Application.Tests._Common;
using FluentAssertions;
using Xunit;

namespace Cactus.Application.Tests;

public class SmokeTests : HandlerTestBase
{
    [Fact]
    public async Task DbContext_can_create_and_query_user()
    {
        var user = TestDataFactory.User("smoke@example.test");
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        var fetched = await Context.Users.FindAsync(user.Id);
        fetched.Should().NotBeNull();
        fetched!.Email.Should().Be("smoke@example.test");
    }
}
```

- [ ] **Step 2: Run the test**

```bash
cd src/backend
DOTNET_ROLL_FORWARD=LatestMajor dotnet test tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~SmokeTests"
```

Expected: `Passed: 1, Failed: 0, Total: 1`.

If `EnsureCreated` fails due to a Postgres-specific column type in fluent configs (`HasColumnType("uuid")` etc.):
- Verify which entity config is breaking from the test output stack trace.
- The fix is to wrap that config behind a provider check (e.g., `if (!Database.IsSqlite())`) — but this is a backend-side change outside this PR's scope. If hit, report **BLOCKED** with the failing entity name and stop.

- [ ] **Step 3: Commit**

```bash
git add src/backend/tests/Cactus.Application.Tests/SmokeTests.cs
git commit -m "test(application): smoke test — DbContext + SQLite in-memory works"
```

---

## Task 4: Auth handler tests (Register, Login)

**Files:**
- Create: `src/backend/tests/Cactus.Application.Tests/Auth/RegisterCommandHandlerTests.cs`
- Create: `src/backend/tests/Cactus.Application.Tests/Auth/LoginCommandHandlerTests.cs`

Reference handler: `src/backend/src/Cactus.Application/Features/Auth/Commands/RegisterCommand.cs` and `LoginCommand.cs`. Read both before writing tests so the request/response shapes are correct.

- [ ] **Step 1: Read the handlers** so test assertions align with actual return shapes.

```bash
cat src/backend/src/Cactus.Application/Features/Auth/Commands/RegisterCommand.cs
cat src/backend/src/Cactus.Application/Features/Auth/Commands/LoginCommand.cs
```

- [ ] **Step 2: Write `RegisterCommandHandlerTests.cs`**

```csharp
using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Auth.Commands;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Auth;

public class RegisterCommandHandlerTests : HandlerTestBase
{
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtService _jwtService = Substitute.For<IJwtService>();
    private readonly IEmailService _emailService = Substitute.For<IEmailService>();

    private RegisterCommandHandler BuildHandler()
    {
        _passwordHasher.Hash(Arg.Any<string>()).Returns("hashed-password");
        _jwtService.GenerateAccessToken(Arg.Any<User>()).Returns("access-token");
        _jwtService.GenerateRefreshToken().Returns("refresh-token-value");
        return new RegisterCommandHandler(Context, _passwordHasher, _jwtService, _emailService);
    }

    [Fact]
    public async Task Register_with_new_email_persists_user_and_returns_tokens()
    {
        var handler = BuildHandler();

        var result = await handler.Handle(
            new RegisterCommand("new@example.test", "Password123!", "Alice", "Adams"),
            CancellationToken.None);

        result.Email.Should().Be("new@example.test");
        result.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("refresh-token-value");
        Context.Users.Should().ContainSingle(u => u.Email == "new@example.test");
        await _emailService.Received(1).SendEmailVerificationAsync(
            "new@example.test", Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Register_with_existing_email_throws_invalid_operation()
    {
        Context.Users.Add(TestDataFactory.User("dup@example.test"));
        await Context.SaveChangesAsync(default);
        var handler = BuildHandler();

        var act = () => handler.Handle(
            new RegisterCommand("dup@example.test", "Password123!", null, null),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Email already registered");
    }
}
```

- [ ] **Step 3: Write `LoginCommandHandlerTests.cs`**

```csharp
using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Auth.Commands;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Auth;

public class LoginCommandHandlerTests : HandlerTestBase
{
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtService _jwtService = Substitute.For<IJwtService>();

    private LoginCommandHandler BuildHandler()
    {
        _jwtService.GenerateAccessToken(Arg.Any<User>()).Returns("access-token");
        _jwtService.GenerateRefreshToken().Returns("refresh-token-value");
        return new LoginCommandHandler(Context, _passwordHasher, _jwtService);
    }

    [Fact]
    public async Task Login_with_valid_credentials_returns_tokens()
    {
        var user = TestDataFactory.User("alice@example.test");
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);
        _passwordHasher.Verify(user.PasswordHash, "Password123!").Returns(true);
        var handler = BuildHandler();

        var result = await handler.Handle(
            new LoginCommand("alice@example.test", "Password123!"),
            CancellationToken.None);

        result.AccessToken.Should().Be("access-token");
        result.Email.Should().Be("alice@example.test");
    }

    [Fact]
    public async Task Login_with_wrong_password_throws_unauthorized()
    {
        var user = TestDataFactory.User("alice@example.test");
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);
        _passwordHasher.Verify(Arg.Any<string>(), "WrongPassword!").Returns(false);
        var handler = BuildHandler();

        var act = () => handler.Handle(
            new LoginCommand("alice@example.test", "WrongPassword!"),
            CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
```

(`LoginCommandHandler`'s constructor signature may differ — verify from the handler file. The `IPasswordHasher.Verify` signature similarly — adjust if the actual method name is `VerifyHashedPassword` or similar.)

- [ ] **Step 4: Run the auth tests**

```bash
cd src/backend
DOTNET_ROLL_FORWARD=LatestMajor dotnet test tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~Auth"
```

Expected: `Passed: 4, Failed: 0, Total: 4`.

- [ ] **Step 5: Commit**

```bash
git add src/backend/tests/Cactus.Application.Tests/Auth/
git commit -m "test(application): Auth handler tests (Register, Login — happy + sad paths)"
```

---

## Task 5: Goals handler tests (Create, UpdateProgress, GetGoals)

**Files:**
- Create: `src/backend/tests/Cactus.Application.Tests/Goals/CreateGoalCommandHandlerTests.cs`
- Create: `src/backend/tests/Cactus.Application.Tests/Goals/UpdateGoalProgressCommandHandlerTests.cs`
- Create: `src/backend/tests/Cactus.Application.Tests/Goals/GetGoalsQueryHandlerTests.cs`

- [ ] **Step 1: Read the handlers**

```bash
cat src/backend/src/Cactus.Application/Features/Goals/Commands/CreateGoalCommand.cs
cat src/backend/src/Cactus.Application/Features/Goals/Commands/UpdateGoalProgressCommand.cs
cat src/backend/src/Cactus.Application/Features/Goals/Queries/GetGoalsQuery.cs
```

Note the constructor dependencies, request/response shapes, and how user-scoping is done (probably via `ICurrentUserService.UserId`).

- [ ] **Step 2: Write the three test files**

The pattern is the same as Auth — extend `HandlerTestBase`, mock dependencies with NSubstitute, seed via `TestDataFactory`, assert on `Context` state and returned DTOs.

For **`CreateGoalCommandHandlerTests`**: 1 test — happy path creates a Goal record. Mock `ICurrentUserService` to return a known user id; pre-seed that user in `Context`.

For **`UpdateGoalProgressCommandHandlerTests`**: 2 tests:
- happy path increments `CurrentAmount` and creates a `GoalProgress` row
- crossing 100% sets `IsCompleted = true` and `CompletedAt`

For **`GetGoalsQueryHandlerTests`**: 1 test — seed two users with goals, verify the handler returns only the requesting user's goals.

Each test file follows this skeleton (adapt method names + assertions):

```csharp
using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Goals.Commands; // or Queries
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Goals;

public class XxxHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task Some_specific_behavior()
    {
        // arrange — seed via Context + TestDataFactory, configure NSubstitute mocks
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        // act
        var handler = new XxxHandler(Context, _currentUser);
        var result = await handler.Handle(new XxxRequest(...), CancellationToken.None);

        // assert
        result.Should()....;
        Context.Goals.Should()....;
    }
}
```

- [ ] **Step 3: Run all Application tests**

```bash
cd src/backend
DOTNET_ROLL_FORWARD=LatestMajor dotnet test tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj
```

Expected: 8 passing (1 smoke + 4 auth + 3 goals).

If a goal test fails because `ICurrentUserService` is not the actual interface name, or because the handler takes additional dependencies, read the handler and adjust. Do NOT alter handler code.

- [ ] **Step 4: Commit**

```bash
git add src/backend/tests/Cactus.Application.Tests/Goals/
git commit -m "test(application): Goals handler tests (Create, UpdateProgress, GetGoals)"
```

---

## Task 6: Accounts handler tests (Create, GetAccounts)

**Files:**
- Create: `src/backend/tests/Cactus.Application.Tests/Accounts/CreateAccountCommandHandlerTests.cs`
- Create: `src/backend/tests/Cactus.Application.Tests/Accounts/GetAccountsQueryHandlerTests.cs`

- [ ] **Step 1: Read the handlers**

```bash
cat src/backend/src/Cactus.Application/Features/Accounts/Commands/CreateAccountCommand.cs
cat src/backend/src/Cactus.Application/Features/Accounts/Queries/GetAccountsQuery.cs
```

- [ ] **Step 2: Write both test files**

`CreateAccountCommandHandlerTests`: 1 test — given a logged-in user, creates an Account row scoped to that user.

`GetAccountsQueryHandlerTests`: 1 test — seed two users with accounts, verify the query returns only the requesting user's accounts.

Use the skeleton from Task 5; adapt to Accounts.

- [ ] **Step 3: Run**

```bash
cd src/backend
DOTNET_ROLL_FORWARD=LatestMajor dotnet test tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~Accounts"
```

Expected: `Passed: 2`.

- [ ] **Step 4: Commit**

```bash
git add src/backend/tests/Cactus.Application.Tests/Accounts/
git commit -m "test(application): Accounts handler tests (Create, GetAccounts)"
```

---

## Task 7: Transactions handler tests (Create, GetTransactions)

**Files:**
- Create: `src/backend/tests/Cactus.Application.Tests/Transactions/CreateTransactionCommandHandlerTests.cs`
- Create: `src/backend/tests/Cactus.Application.Tests/Transactions/GetTransactionsQueryHandlerTests.cs`

- [ ] **Step 1: Read handlers**

```bash
cat src/backend/src/Cactus.Application/Features/Transactions/Commands/CreateTransactionCommand.cs
cat src/backend/src/Cactus.Application/Features/Transactions/Queries/GetTransactionsQuery.cs
```

- [ ] **Step 2: Write tests**

`CreateTransactionCommandHandlerTests`: 1 test — creates a Transaction row scoped to the user's account. Seed the user + account first.

`GetTransactionsQueryHandlerTests`: 1 test — seed transactions across two date ranges, verify the date filter returns only the requested window.

- [ ] **Step 3: Run, commit**

```bash
DOTNET_ROLL_FORWARD=LatestMajor dotnet test tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~Transactions"

git add src/backend/tests/Cactus.Application.Tests/Transactions/
git commit -m "test(application): Transactions handler tests (Create, GetTransactions)"
```

---

## Task 8: SpendingPlans handler test

**Files:**
- Create: `src/backend/tests/Cactus.Application.Tests/SpendingPlans/GetCurrentSpendingPlanQueryHandlerTests.cs`

- [ ] **Step 1: Read the handler**

```bash
ls src/backend/src/Cactus.Application/Features/SpendingPlans/
cat src/backend/src/Cactus.Application/Features/SpendingPlans/Queries/*.cs
```

(If the query is named differently from `GetCurrentSpendingPlan`, use the actual name.)

- [ ] **Step 2: Write the test**

1 test: returns the user's active spending plan (skipping inactive ones).

- [ ] **Step 3: Run + commit**

```bash
DOTNET_ROLL_FORWARD=LatestMajor dotnet test tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~SpendingPlans"

git add src/backend/tests/Cactus.Application.Tests/SpendingPlans/
git commit -m "test(application): SpendingPlans handler test"
```

---

## Task 9: Run full suite + measure coverage

- [ ] **Step 1: Run everything**

```bash
cd src/backend
DOTNET_ROLL_FORWARD=LatestMajor dotnet test tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj
```

Expected: ~14 tests passing, total wall-clock <10 s (no container — SQLite in-memory is fast).

- [ ] **Step 2: Collect coverage**

```bash
DOTNET_ROLL_FORWARD=LatestMajor dotnet test tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj \
  --collect:"XPlat Code Coverage" \
  --results-directory ./coverage
```

Find the generated `coverage.cobertura.xml` (under `coverage/<guid>/`) and read its `line-rate` attribute on the `<package name="Cactus.Application">` element. That's the line coverage as a fraction (e.g., `0.42` = 42%).

```bash
find coverage -name "coverage.cobertura.xml" -exec grep -oE 'name="Cactus.Application"[^>]*line-rate="[0-9.]+"' {} \;
```

Expected: line-rate ≥ 0.35 (35%).

If below 35%, identify which handler families are most under-covered (`reportgenerator` for HTML or just read the XML), and add 1-2 targeted tests in the lowest-coverage area — but only enough to clear the threshold. Do not over-engineer.

If well above 35% (say 50%+), great. The gate is set in PR 7 based on this measurement.

- [ ] **Step 3: Note coverage in commit message**

```bash
git commit --allow-empty -m "test(application): coverage measurement — line-rate=X.XX on Cactus.Application"
```

(Replace `X.XX` with the actual measured fraction.)

---

## Task 10: Push + open PR (do NOT merge)

- [ ] **Step 1: Push**

```bash
git push -u origin axis-a/pr-2-application-tests
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Axis A PR 2: Application-layer unit tests" --body "$(cat <<'EOF'
## Summary

Stands up \`Cactus.Application.Tests\` with handler-level unit tests for Auth, Goals,
Accounts, Transactions, and SpendingPlans. Establishes the backend coverage baseline
on \`Cactus.Application\` (target ≥35%, set as gate in PR 7).

Spec: \`docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md\` § PR 2.
Plan: \`docs/superpowers/plans/2026-05-04-axis-a-pr-2-application-tests.md\`.

## Stack

- xUnit + FluentAssertions + NSubstitute (mocks) + Bogus (test data)
- SQLite in-memory + real \`CactusDbContext\` (via Cactus.Infrastructure reference) — chosen over EF in-memory provider for closer EF behavior and over Testcontainers for speed
- coverlet.collector for coverage

## What's tested (~14 tests across 11 handlers)

- **Auth:** Register (happy + duplicate), Login (happy + wrong password)
- **Goals:** CreateGoal, UpdateGoalProgress (happy + completes-on-target), GetGoals (user-scoped)
- **Accounts:** CreateAccount, GetAccounts (user-scoped)
- **Transactions:** CreateTransaction, GetTransactions (date filter)
- **SpendingPlans:** GetCurrentSpendingPlan

## Coverage measured

\`Cactus.Application\` line-rate: **X.XX** (≥0.35 target).

## Out of scope

- CI workflow gating these (PR 4).
- Coverage gate enforcement (PR 7).
- Tests for the other ~20 handlers (Insights, Onboarding, Categories, Dashboard, Refresh tokens, etc.) — added as needed in subsequent PRs.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: STOP. Do not merge.** The controller will dispatch the final review, then merge.

---

## Self-review checklist

After this plan was written, I checked it against the Axis A spec § PR 2 and found:

- ✅ Spec PR 2 done-when "Coverage ≥35% on `Cactus.Application`" — covered by Task 9.
- ✅ Spec § "Backend testing" stack — xUnit + FluentAssertions + Bogus, plus NSubstitute (added here for service mocks).
- ✅ Spec § "Backend test project layout" — `_Common/`, per-feature subdirectories.
- ⚠️  CI workflow not added — PR 4.
- ⚠️  Coverage gate not enforced — PR 7. PR 2 just measures.
- ⚠️  ~20 additional handlers not tested. Coverage measurement at the end of this PR establishes whether more handlers need tests in this PR or can wait.

## Out of scope for this plan

- Tests for Insights, Onboarding, Categories, Dashboard, RefreshToken, ChangePassword, ResetPassword, etc.
- Validators (FluentValidation tests are typically unit tests against the validator class — defer if any are added later).
- CI workflow (PR 4).
- Coverage gating (PR 7).
- Testing across providers (Postgres-vs-SQLite divergence) — caught by PR 1's integration tests if it matters.
