using Cactus.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<OnboardingResponse> OnboardingResponses { get; }
    DbSet<UserDebt> UserDebts { get; }
    DbSet<BankConnection> BankConnections { get; }
    DbSet<StitchToken> StitchTokens { get; }
    DbSet<Account> Accounts { get; }
    DbSet<SyncHistory> SyncHistory { get; }
    DbSet<MacroCategory> MacroCategories { get; }
    DbSet<Category> Categories { get; }
    DbSet<UserCategory> UserCategories { get; }
    DbSet<SubCategory> SubCategories { get; }
    DbSet<Transaction> Transactions { get; }
    DbSet<RecurringPattern> RecurringPatterns { get; }
    DbSet<CategorizationRule> CategorizationRules { get; }
    DbSet<SpendingPlan> SpendingPlans { get; }
    DbSet<BudgetAllocation> BudgetAllocations { get; }
    DbSet<MonthlySummary> MonthlySummaries { get; }
    DbSet<Goal> Goals { get; }
    DbSet<GoalProgress> GoalProgress { get; }
    DbSet<GoalMilestone> GoalMilestones { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
