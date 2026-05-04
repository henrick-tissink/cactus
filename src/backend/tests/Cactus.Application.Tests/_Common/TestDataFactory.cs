using Bogus;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;

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
