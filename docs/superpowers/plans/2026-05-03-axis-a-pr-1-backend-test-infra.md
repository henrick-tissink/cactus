# Axis A PR 1 — Backend Test Infrastructure + Auth Integration Tests

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `Cactus.Api.Tests` xUnit project with Testcontainers Postgres + WebApplicationFactory, prove it works with three Auth integration tests (register success, login success, login wrong password). After this PR merges, every subsequent backend PR has a place to add tests against a real Postgres.

**Architecture:** New test project at `src/backend/tests/Cactus.Api.Tests/`. A single xUnit collection fixture (`CactusApiFactory`) owns one `Testcontainers.PostgreSqlContainer` and a `WebApplicationFactory<Program>` that overrides the `ConnectionStrings:DefaultConnection` and `Jwt:Key` configuration so the API binds to the testcontainer DB and a known dev JWT key. Per-test isolation via `Respawn` (truncate all non-EF tables between tests). One container boot per test-run, milliseconds per reset.

**Tech Stack:** .NET 8 target / .NET 10 SDK · xUnit · FluentAssertions · `Microsoft.AspNetCore.Mvc.Testing` · `Testcontainers.PostgreSql` · `Respawn` · `coverlet.collector` · Docker (required to run tests locally)

**Branch:** `axis-a/pr-1-backend-test-infra`

**Spec reference:** `docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md` § "Backend test project layout" + § "Decomposition into PRs" PR 1.

---

## File structure (new files this PR creates)

```
src/backend/tests/Cactus.Api.Tests/
├── Cactus.Api.Tests.csproj          (test project)
├── Fixtures/
│   ├── CactusApiFactory.cs          (WAF<Program> + Testcontainers + config override)
│   └── CactusCollection.cs          (xUnit collection definition)
├── _Common/
│   └── ApiTestBase.cs               (per-test Respawn reset + helpers)
├── SmokeTests.cs                    (proves WAF + container boot end-to-end)
└── Auth/
    └── AuthEndpointTests.cs         (3 tests: register OK, login OK, login wrong-password)
```

Modified files:
- `src/backend/src/Cactus.Api/Program.cs` — append `public partial class Program { }` so `WebApplicationFactory<Program>` can resolve the entry-point type.
- `src/backend/Cactus.slnx` — add `<Folder Name="/tests/">` containing the new test project.

---

## Task 0: Create feature branch

- [ ] **Step 1: Create branch from main**

```bash
cd /Users/henricktissink/Sauce/cactus
git checkout main
git pull --ff-only origin main
git checkout -b axis-a/pr-1-backend-test-infra
```

Expected: `Switched to a new branch 'axis-a/pr-1-backend-test-infra'`.

---

## Task 1: Create the test project + add packages

**Files:**
- Create: `src/backend/tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj`
- Modify: `src/backend/Cactus.slnx`

- [ ] **Step 1: Create the directory and csproj**

Create `src/backend/tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj` with this exact content:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
    <RootNamespace>Cactus.Api.Tests</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.1" />
    <PackageReference Include="xunit" Version="2.9.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="FluentAssertions" Version="6.12.2" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.10" />
    <PackageReference Include="Testcontainers.PostgreSql" Version="4.0.0" />
    <PackageReference Include="Respawn" Version="6.2.1" />
    <PackageReference Include="coverlet.collector" Version="6.0.2">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\Cactus.Api\Cactus.Api.csproj" />
  </ItemGroup>

</Project>
```

(FluentAssertions pinned to 6.12.x — 7.x changed licensing; 6.12 stays MIT-licensed.)

- [ ] **Step 2: Add the test project to the solution**

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet sln Cactus.slnx add tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --solution-folder /tests/
```

Expected: `Project 'tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj' added to the solution.`

- [ ] **Step 3: Verify slnx now lists the test project under /tests/**

```bash
grep -A1 "tests/" /Users/henricktissink/Sauce/cactus/src/backend/Cactus.slnx
```

Expected: a `<Folder Name="/tests/">` block containing `<Project Path="tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj" />`. If the folder isn't there because `dotnet sln` placed the project at the root, manually edit the file to wrap it in the `/tests/` folder.

- [ ] **Step 4: Restore + build the test project alone**

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet restore tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj
dotnet build tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --no-restore -c Debug
```

Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`. (Test classes don't exist yet, so the project builds with just package references.)

- [ ] **Step 5: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/backend/tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj src/backend/Cactus.slnx
git commit -m "test: scaffold Cactus.Api.Tests project with xUnit + Testcontainers packages"
```

---

## Task 2: Expose `Program` for WebApplicationFactory

**Files:**
- Modify: `src/backend/src/Cactus.Api/Program.cs`

The API uses top-level statements, which compile to an internal `Program` class. `WebApplicationFactory<Program>` requires `Program` to be public so the test assembly can reference it.

- [ ] **Step 1: Append the partial class declaration**

Add this at the very end of `src/backend/src/Cactus.Api/Program.cs` (after `app.Run();`):

```csharp

// Exposed for WebApplicationFactory<Program> in Cactus.Api.Tests.
public partial class Program;
```

(C# 13 file-scoped partial type uses `;` instead of `{ }` — both work; sticking with `;` for brevity.)

- [ ] **Step 2: Verify the API still builds**

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet build src/Cactus.Api/Cactus.Api.csproj --no-restore -c Debug
```

Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/backend/src/Cactus.Api/Program.cs
git commit -m "test: expose Program type for WebApplicationFactory"
```

---

## Task 3: Implement `CactusApiFactory`

**Files:**
- Create: `src/backend/tests/Cactus.Api.Tests/Fixtures/CactusApiFactory.cs`

This single class is both the WebApplicationFactory and the IAsyncLifetime that owns the Postgres testcontainer. It overrides app configuration so the API binds to the testcontainer DB and a known JWT key.

- [ ] **Step 1: Create the file with this exact content**

```csharp
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Testcontainers.PostgreSql;

namespace Cactus.Api.Tests.Fixtures;

/// <summary>
/// Boots a real Postgres container and a TestServer running the full Cactus.Api
/// pipeline. Shared across the test assembly via <see cref="CactusCollection"/>.
/// </summary>
public class CactusApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("cactus_test")
        .WithUsername("cactus")
        .WithPassword("cactus_test")
        .Build();

    public string ConnectionString => _postgres.GetConnectionString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = ConnectionString,
                ["Jwt:Key"] = "TestOnlyJwtKey_AtLeast32Characters_NeverUseInProduction!",
                ["Jwt:Issuer"] = "Cactus",
                ["Jwt:Audience"] = "CactusApp",
                ["Cors:AllowedOrigins:0"] = "http://localhost",
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
    }
}
```

- [ ] **Step 2: Build to verify**

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet build tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --no-restore -c Debug
```

Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`.

If `Program` is not visible, double-check Task 2 added the partial declaration and rebuild.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/backend/tests/Cactus.Api.Tests/Fixtures/CactusApiFactory.cs
git commit -m "test: add CactusApiFactory (WAF + Postgres testcontainer)"
```

---

## Task 4: Add the xUnit collection definition

**Files:**
- Create: `src/backend/tests/Cactus.Api.Tests/Fixtures/CactusCollection.cs`

xUnit shares a fixture across multiple test classes via `[Collection]` + `ICollectionFixture`. This means one Postgres container boot for the whole assembly.

- [ ] **Step 1: Create the file with this exact content**

```csharp
namespace Cactus.Api.Tests.Fixtures;

[CollectionDefinition(Name)]
public class CactusCollection : ICollectionFixture<CactusApiFactory>
{
    public const string Name = "Cactus";
}
```

- [ ] **Step 2: Build**

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet build tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --no-restore -c Debug
```

Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/backend/tests/Cactus.Api.Tests/Fixtures/CactusCollection.cs
git commit -m "test: add CactusCollection xUnit collection definition"
```

---

## Task 5: Smoke test — proves WAF + container + migrations work end-to-end

**Files:**
- Create: `src/backend/tests/Cactus.Api.Tests/SmokeTests.cs`

Before trusting auth tests, prove the basic pipeline (boot container → start app → run migrations → serve a request → reach the DB) works.

- [ ] **Step 1: Write the smoke test**

Create `src/backend/tests/Cactus.Api.Tests/SmokeTests.cs`:

```csharp
using System.Net;
using Cactus.Api.Tests.Fixtures;
using FluentAssertions;
using Xunit;

namespace Cactus.Api.Tests;

[Collection(CactusCollection.Name)]
public class SmokeTests
{
    private readonly CactusApiFactory _factory;

    public SmokeTests(CactusApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Health_endpoint_returns_200()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

- [ ] **Step 2: Run the smoke test**

Docker Desktop must be running (Testcontainers needs the Docker daemon).

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet test tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --filter "FullyQualifiedName~SmokeTests"
```

(Note: `--no-build` will skip rebuild only if nothing changed since the last build. Drop it if you've made edits.)

Expected: `Passed! - Failed: 0, Passed: 1, Skipped: 0, Total: 1`.

If it fails:
- "Cannot connect to Docker daemon" → start Docker Desktop, retry.
- "Could not load Program" → re-verify Task 2 added the partial class.
- Migration error → check the API logs in the test output; likely a config override missing.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/backend/tests/Cactus.Api.Tests/SmokeTests.cs
git commit -m "test: smoke test — health endpoint via WAF + testcontainer"
```

---

## Task 6: `ApiTestBase` with Respawn-based per-test DB reset

**Files:**
- Create: `src/backend/tests/Cactus.Api.Tests/_Common/ApiTestBase.cs`

Each test class that depends on the DB extends `ApiTestBase`. Before each test, Respawn truncates all non-EF tables, leaving the DB schema intact but data-free.

- [ ] **Step 1: Create the base class**

Create `src/backend/tests/Cactus.Api.Tests/_Common/ApiTestBase.cs`:

```csharp
using Cactus.Api.Tests.Fixtures;
using Npgsql;
using Respawn;
using Xunit;

namespace Cactus.Api.Tests._Common;

[Collection(CactusCollection.Name)]
public abstract class ApiTestBase : IAsyncLifetime
{
    protected CactusApiFactory Factory { get; }
    protected HttpClient Client { get; }

    private Respawner? _respawner;

    protected ApiTestBase(CactusApiFactory factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        await using var connection = new NpgsqlConnection(Factory.ConnectionString);
        await connection.OpenAsync();

        _respawner ??= await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = new[] { "public" },
            TablesToIgnore = new Respawn.Graph.Table[] { "__EFMigrationsHistory" },
        });

        await _respawner.ResetAsync(connection);
    }

    public Task DisposeAsync() => Task.CompletedTask;
}
```

(Note: `Respawn.Graph.Table` is the qualified type — Respawn's `Table` class.)

- [ ] **Step 2: Build to verify the dependency on `Npgsql` resolved**

`Npgsql` flows transitively from the API project reference. If the build complains, add an explicit `<PackageReference Include="Npgsql" Version="8.0.5" />` to the test csproj.

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet build tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --no-restore -c Debug
```

Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/backend/tests/Cactus.Api.Tests/_Common/ApiTestBase.cs
git commit -m "test: ApiTestBase with Respawn per-test DB reset"
```

---

## Task 7: First auth integration test — register happy path

**Files:**
- Create: `src/backend/tests/Cactus.Api.Tests/Auth/AuthEndpointTests.cs`

- [ ] **Step 1: Write the test**

Create `src/backend/tests/Cactus.Api.Tests/Auth/AuthEndpointTests.cs`:

```csharp
using System.Net;
using System.Net.Http.Json;
using Cactus.Api.Tests._Common;
using Cactus.Api.Tests.Fixtures;
using FluentAssertions;
using Xunit;

namespace Cactus.Api.Tests.Auth;

public class AuthEndpointTests : ApiTestBase
{
    public AuthEndpointTests(CactusApiFactory factory) : base(factory) { }

    [Fact]
    public async Task Register_with_valid_input_returns_200_and_access_token()
    {
        var response = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "henrick+test@cactus.app",
            password = "Password123!",
            firstName = "Henrick",
            lastName = "Tissink",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<RegisterResponse>();
        body.Should().NotBeNull();
        body!.Email.Should().Be("henrick+test@cactus.app");
        body.AccessToken.Should().NotBeNullOrWhiteSpace();
    }

    private record RegisterResponse(string UserId, string Email, string AccessToken);
}
```

(The test's `RegisterResponse` only declares the fields we assert on — `System.Text.Json` ignores extras. This avoids tight coupling to the full DTO shape.)

- [ ] **Step 2: Run the test**

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet test tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --filter "FullyQualifiedName~AuthEndpointTests"
```

Expected: `Passed! - Failed: 0, Passed: 1, Skipped: 0, Total: 1`.

If it fails with 400 or 500:
- 400: check the request body field names match `RegisterRequest` in `AuthController.cs` (camelCase by default).
- 500: read the test output for the API exception. Likely a migration or seed problem.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/backend/tests/Cactus.Api.Tests/Auth/AuthEndpointTests.cs
git commit -m "test: register happy path"
```

---

## Task 8: Login happy path

**Files:**
- Modify: `src/backend/tests/Cactus.Api.Tests/Auth/AuthEndpointTests.cs`

- [ ] **Step 1: Add the login test**

Append inside the `AuthEndpointTests` class, after the register test:

```csharp
    [Fact]
    public async Task Login_after_register_returns_200_and_access_token()
    {
        // register first
        await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "login+test@cactus.app",
            password = "Password123!",
            firstName = "Login",
            lastName = "Test",
        });

        // then login
        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "login+test@cactus.app",
            password = "Password123!",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
    }

    private record LoginResponse(string AccessToken);
```

- [ ] **Step 2: Run both tests**

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet test tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --filter "FullyQualifiedName~AuthEndpointTests"
```

Expected: `Passed! - Failed: 0, Passed: 2, Skipped: 0, Total: 2`.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/backend/tests/Cactus.Api.Tests/Auth/AuthEndpointTests.cs
git commit -m "test: login happy path"
```

---

## Task 9: Login wrong-password test (proves Respawn isolation)

**Files:**
- Modify: `src/backend/tests/Cactus.Api.Tests/Auth/AuthEndpointTests.cs`

This test reuses the same email as Task 7's register test. Without Respawn isolation, the second register would 400 on duplicate email. If this test passes, Respawn is working.

- [ ] **Step 1: Add the wrong-password test**

Append inside `AuthEndpointTests`:

```csharp
    [Fact]
    public async Task Login_with_wrong_password_returns_401()
    {
        // same email as the register-happy test — proves Respawn cleared state
        await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "henrick+test@cactus.app",
            password = "Password123!",
            firstName = "Henrick",
            lastName = "Tissink",
        });

        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "henrick+test@cactus.app",
            password = "WrongPassword!",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
```

- [ ] **Step 2: Run all auth tests**

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet test tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --filter "FullyQualifiedName~AuthEndpointTests"
```

Expected: `Passed! - Failed: 0, Passed: 3, Skipped: 0, Total: 3`.

If the wrong-password test returns 200, you have a real bug — the AuthController is not validating the password. Stop and investigate before proceeding.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/backend/tests/Cactus.Api.Tests/Auth/AuthEndpointTests.cs
git commit -m "test: login wrong-password returns 401 (proves Respawn isolation)"
```

---

## Task 10: Run the entire test suite

- [ ] **Step 1: Run everything (smoke + auth)**

```bash
cd /Users/henricktissink/Sauce/cactus/src/backend
dotnet test tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj
```

Expected: `Passed! - Failed: 0, Passed: 4, Skipped: 0, Total: 4`.

Container should boot once for the assembly run (look for a single "Postgres ready" line in Testcontainers logs). Total wall-clock time on a warm Docker daemon: typically 15–30 s.

- [ ] **Step 2: Capture container-boot time**

Re-run with verbose output and confirm the boot is ≤10 s after Docker is warm:

```bash
dotnet test tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj --logger "console;verbosity=normal" 2>&1 | grep -E "Postgres|started|Container"
```

If first-time pull of `postgres:16-alpine` takes longer, that's a one-time cost; subsequent runs hit the local image cache.

---

## Task 11: Open the PR

- [ ] **Step 1: Push the branch**

```bash
cd /Users/henricktissink/Sauce/cactus
git push -u origin axis-a/pr-1-backend-test-infra
```

- [ ] **Step 2: Open the PR via gh**

```bash
gh pr create --title "Axis A PR 1: backend test infrastructure + Auth integration tests" --body "$(cat <<'EOF'
## Summary

Stands up `Cactus.Api.Tests` xUnit project with Testcontainers Postgres + WebApplicationFactory.
Three Auth integration tests prove the pipeline works end-to-end.

Spec: `docs/superpowers/specs/2026-05-03-axis-a-confidence-design.md` § PR 1.
Plan: `docs/superpowers/plans/2026-05-03-axis-a-pr-1-backend-test-infra.md`.

## What's in here

- New project `src/backend/tests/Cactus.Api.Tests/` with xUnit + FluentAssertions + Testcontainers.PostgreSql + Respawn + coverlet.
- `CactusApiFactory` boots one `postgres:16-alpine` container per test-assembly run; overrides API config to point the DbContext + JWT at the testcontainer.
- `ApiTestBase` resets DB state between tests via Respawn (truncates all non-EF tables).
- 4 tests: 1 smoke (`/health`) + 3 Auth (`register OK`, `login OK`, `login wrong-password`).

## Test plan

- [ ] `dotnet test tests/Cactus.Api.Tests/Cactus.Api.Tests.csproj` from `src/backend` is green locally with Docker running.
- [ ] Container boot is ≤10 s on warm Docker.
- [ ] Wrong-password test reuses an email previously registered in another test — confirms Respawn isolation.

## What this does NOT include

- Application-layer unit tests (PR 2).
- CI workflow that runs these tests on PR (PR 4) — for now, run locally.
- Coverage gating (PR 7).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed to stdout.

- [ ] **Step 3: Self-review the PR**

Open the PR URL in a browser. Read the diff. Confirm:
- All file paths under `src/backend/tests/Cactus.Api.Tests/` (no stray files).
- `Program.cs` change is exactly the 2-line append.
- `Cactus.slnx` change adds `/tests/` folder + project entry.

- [ ] **Step 4: Merge** (no CI yet to wait on; that's PR 4)

```bash
gh pr merge --squash --delete-branch
```

Expected: branch deleted; `main` advanced.

- [ ] **Step 5: Pull main locally**

```bash
git checkout main
git pull --ff-only origin main
```

---

## Self-review checklist

After this plan was written, I checked it against the Axis A spec § PR 1 and found:

- ✅ Spec PR 1 done-when "`dotnet test` green" — covered by Task 10.
- ✅ Spec PR 1 done-when "container boots in ≤10 s" — covered by Task 10 step 2.
- ✅ Spec § "Backend test project layout" — file structure matches (`Fixtures/`, `_Common/`, `Auth/`).
- ✅ Spec § "Backend testing" stack — every package matches (xUnit, FluentAssertions, Testcontainers.PostgreSql, Respawn, coverlet.collector, Microsoft.AspNetCore.Mvc.Testing).
- ⚠️  No `Cactus.Application.Tests` project — that's PR 2's scope. This plan covers PR 1 only.
- ⚠️  Coverage gate not set here — that's PR 7. PR 1 just produces coverage data.

## Out of scope for this plan

- Application-layer unit tests (PR 2).
- Frontend Vitest (PR 3).
- GitHub Actions CI (PR 4).
- Pre-commit hooks (PR 5).
- Image-based deploy (PR 6).
- Branch protection + Codecov + coverage gate (PR 7).
