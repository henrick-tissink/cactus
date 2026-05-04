using Bogus;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;

namespace Cactus.Application.Tests._Common;

/// <summary>
/// Bogus-backed factories for domain entities. Each call returns an entity with
/// fresh randomized values so multi-entity test fixtures don't collide on unique
/// indexes (e.g., User.Email). For deterministic test data, pass values
/// explicitly via the optional parameters.
/// </summary>
public static class TestDataFactory
{
    public static User User(string? email = null) =>
        new Faker<User>()
            .RuleFor(u => u.Email, f => email ?? f.Internet.Email().ToLower())
            .RuleFor(u => u.PasswordHash, f => f.Random.AlphaNumeric(60))
            .RuleFor(u => u.FirstName, f => f.Name.FirstName())
            .RuleFor(u => u.LastName, f => f.Name.LastName())
            .RuleFor(u => u.IsOnboardingComplete, false)
            .Generate();

    public static Goal Goal(Guid userId) =>
        new Faker<Goal>()
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
            .RuleFor(a => a.UserId, userId)
            .RuleFor(a => a.Name, f => f.Finance.AccountName())
            .RuleFor(a => a.AccountType, AccountType.Cheque)
            .RuleFor(a => a.Balance, f => f.Random.Decimal(0m, 50000m))
            .RuleFor(a => a.Currency, "ZAR")
            .RuleFor(a => a.IsActive, true)
            .RuleFor(a => a.IsManual, true)
            .Generate();
}
