using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Common;
using Cactus.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Infrastructure.Data;

public class CactusDbContext : DbContext, IApplicationDbContext
{
    public CactusDbContext(DbContextOptions<CactusDbContext> options) : base(options)
    {
    }

    // Auth
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OnboardingResponse> OnboardingResponses => Set<OnboardingResponse>();
    public DbSet<UserDebt> UserDebts => Set<UserDebt>();

    // Bank Integration
    public DbSet<BankConnection> BankConnections => Set<BankConnection>();
    public DbSet<StitchToken> StitchTokens => Set<StitchToken>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<SyncHistory> SyncHistory => Set<SyncHistory>();

    // Categories
    public DbSet<MacroCategory> MacroCategories => Set<MacroCategory>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<UserCategory> UserCategories => Set<UserCategory>();
    public DbSet<SubCategory> SubCategories => Set<SubCategory>();

    // Transactions
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<RecurringPattern> RecurringPatterns => Set<RecurringPattern>();
    public DbSet<CategorizationRule> CategorizationRules => Set<CategorizationRule>();

    // Budgeting
    public DbSet<SpendingPlan> SpendingPlans => Set<SpendingPlan>();
    public DbSet<BudgetAllocation> BudgetAllocations => Set<BudgetAllocation>();
    public DbSet<MonthlySummary> MonthlySummaries => Set<MonthlySummary>();

    // Goals
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<GoalProgress> GoalProgress => Set<GoalProgress>();
    public DbSet<GoalMilestone> GoalMilestones => Set<GoalMilestone>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CactusDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    if (entry.Entity.Id == Guid.Empty)
                        entry.Entity.Id = Guid.NewGuid();
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
