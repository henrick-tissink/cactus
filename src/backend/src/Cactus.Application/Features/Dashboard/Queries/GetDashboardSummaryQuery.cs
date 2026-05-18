using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Dashboard.Queries;

public record GetDashboardSummaryQuery : IRequest<DashboardSummaryResult>;

public record DashboardSummaryResult(
    decimal MonthlyIncome,
    decimal TotalSpent,
    List<BucketStatusDto> Buckets,
    int UnclassifiedCount,
    List<RecentTransactionDto> RecentTransactions,
    DateTime? LastSyncAt
);

public record BucketStatusDto(
    MacroCategoryType Type,
    string Name,
    decimal Allocated,
    decimal Spent,
    decimal Remaining
);

public record RecentTransactionDto(
    Guid Id,
    string Description,
    decimal Amount,
    DateTime TransactionDate,
    bool IsClassified,
    string? CategoryName
);

public class GetDashboardSummaryQueryHandler : IRequestHandler<GetDashboardSummaryQuery, DashboardSummaryResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetDashboardSummaryQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<DashboardSummaryResult> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var now = DateTime.UtcNow;

        // Get current month's spending plan
        var spendingPlan = await _context.SpendingPlans
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Year == now.Year && s.Month == now.Month && s.IsActive, cancellationToken);

        var monthlyIncome = spendingPlan?.MonthlyIncome ?? 0;

        // Get macro categories
        var macroCategories = await _context.MacroCategories
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync(cancellationToken);

        // Get current month transactions
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1);

        var userAccounts = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        var transactions = await _context.Transactions
            .Where(t => userAccounts.Contains(t.AccountId) &&
                       t.TransactionDate >= startOfMonth &&
                       t.TransactionDate < endOfMonth &&
                       t.Type == TransactionType.Debit)
            .Include(t => t.MacroCategory)
            .Include(t => t.Category)
            .ToListAsync(cancellationToken);

        var buckets = new List<BucketStatusDto>();

        foreach (var macro in macroCategories)
        {
            var allocated = monthlyIncome * (macro.Type switch
            {
                MacroCategoryType.Needs => spendingPlan?.NeedsPercentage ?? 50,
                MacroCategoryType.Wants => spendingPlan?.WantsPercentage ?? 30,
                MacroCategoryType.Goals => spendingPlan?.GoalsPercentage ?? 20,
                _ => 0
            }) / 100;

            var spent = transactions
                .Where(t => t.MacroCategoryId == macro.Id)
                .Sum(t => Math.Abs(t.Amount));

            buckets.Add(new BucketStatusDto(
                macro.Type,
                macro.Name,
                allocated,
                spent,
                allocated - spent
            ));
        }

        var totalSpent = buckets.Sum(b => b.Spent);

        var unclassifiedCount = await _context.Transactions
            .Where(t => userAccounts.Contains(t.AccountId) && !t.IsClassified)
            .CountAsync(cancellationToken);

        var lastSyncAt = userAccounts.Count == 0
            ? (DateTime?)null
            : await _context.Transactions
                .Where(t => userAccounts.Contains(t.AccountId))
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => (DateTime?)t.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

        var recentTransactions = await _context.Transactions
            .Where(t => userAccounts.Contains(t.AccountId))
            .OrderByDescending(t => t.TransactionDate)
            .Take(10)
            .Include(t => t.Category)
            .Select(t => new RecentTransactionDto(
                t.Id,
                t.Description,
                t.Type == TransactionType.Credit ? t.Amount : -t.Amount,
                t.TransactionDate,
                t.IsClassified,
                t.Category != null ? t.Category.Name : null
            ))
            .ToListAsync(cancellationToken);

        // Lazily persist monthly summary
        if (spendingPlan != null)
        {
            var existingSummary = await _context.MonthlySummaries
                .FirstOrDefaultAsync(m => m.SpendingPlanId == spendingPlan.Id, cancellationToken);

            var macroNeedsId = macroCategories.FirstOrDefault(m => m.Type == MacroCategoryType.Needs)?.Id;
            var macroWantsId = macroCategories.FirstOrDefault(m => m.Type == MacroCategoryType.Wants)?.Id;
            var macroGoalsId = macroCategories.FirstOrDefault(m => m.Type == MacroCategoryType.Goals)?.Id;

            var needsSpent = transactions.Where(t => t.MacroCategoryId == macroNeedsId).Sum(t => Math.Abs(t.Amount));
            var wantsSpent = transactions.Where(t => t.MacroCategoryId == macroWantsId).Sum(t => Math.Abs(t.Amount));
            var goalsSpent = transactions.Where(t => t.MacroCategoryId == macroGoalsId).Sum(t => Math.Abs(t.Amount));

            if (existingSummary != null)
            {
                existingSummary.TotalIncome = monthlyIncome;
                existingSummary.TotalExpenses = totalSpent;
                existingSummary.NeedsSpent = needsSpent;
                existingSummary.WantsSpent = wantsSpent;
                existingSummary.GoalsSpent = goalsSpent;
                existingSummary.Surplus = monthlyIncome - totalSpent;
                existingSummary.CalculatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.MonthlySummaries.Add(new Domain.Entities.MonthlySummary
                {
                    SpendingPlanId = spendingPlan.Id,
                    TotalIncome = monthlyIncome,
                    TotalExpenses = totalSpent,
                    NeedsSpent = needsSpent,
                    WantsSpent = wantsSpent,
                    GoalsSpent = goalsSpent,
                    Surplus = monthlyIncome - totalSpent,
                    CalculatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        return new DashboardSummaryResult(
            monthlyIncome,
            totalSpent,
            buckets,
            unclassifiedCount,
            recentTransactions,
            lastSyncAt
        );
    }
}
