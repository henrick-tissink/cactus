using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Insights.Queries;

public record GetInsightsQuery : IRequest<InsightsResult>;

public record InsightsResult(
    List<MonthlyBreakdownDto> MonthlyBreakdowns,
    decimal AverageNeedsPercent,
    decimal AverageWantsPercent,
    decimal AverageGoalsPercent,
    decimal AverageSurplus,
    TrendDirection TrendDirection,
    List<CategoryAverageDto> CategoryAverages
);

public record MonthlyBreakdownDto(
    int Year,
    int Month,
    decimal NeedsPercent,
    decimal WantsPercent,
    decimal GoalsPercent,
    decimal TotalIncome,
    decimal TotalSpent,
    decimal Surplus
);

public record CategoryAverageDto(
    Guid CategoryId,
    string CategoryName,
    MacroCategoryType MacroCategoryType,
    decimal AverageAmount
);

public class GetInsightsQueryHandler : IRequestHandler<GetInsightsQuery, InsightsResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetInsightsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<InsightsResult> Handle(GetInsightsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var now = DateTime.UtcNow;

        // Calculate date range for last 6 months
        var startDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-5);
        var endDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);

        // Get user's accounts
        var userAccounts = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        // Get all transactions for the last 6 months
        var transactions = await _context.Transactions
            .Where(t => userAccounts.Contains(t.AccountId) &&
                       t.TransactionDate >= startDate &&
                       t.TransactionDate < endDate)
            .Include(t => t.MacroCategory)
            .Include(t => t.Category)
            .ToListAsync(cancellationToken);

        // Get spending plans for the last 6 months
        var spendingPlans = await _context.SpendingPlans
            .Where(s => s.UserId == userId && s.IsActive &&
                       (s.Year > startDate.Year || (s.Year == startDate.Year && s.Month >= startDate.Month)) &&
                       (s.Year < endDate.Year || (s.Year == endDate.Year && s.Month < endDate.Month)))
            .ToListAsync(cancellationToken);

        // Get macro categories
        var macroCategories = await _context.MacroCategories
            .ToListAsync(cancellationToken);

        // Try to read from persisted monthly summaries first
        var persistedSummaries = await _context.MonthlySummaries
            .Include(m => m.SpendingPlan)
            .Where(m => m.SpendingPlan.UserId == userId &&
                       (m.SpendingPlan.Year > startDate.Year || (m.SpendingPlan.Year == startDate.Year && m.SpendingPlan.Month >= startDate.Month)) &&
                       (m.SpendingPlan.Year < endDate.Year || (m.SpendingPlan.Year == endDate.Year && m.SpendingPlan.Month < endDate.Month)))
            .ToListAsync(cancellationToken);

        // Build monthly breakdowns
        var monthlyBreakdowns = new List<MonthlyBreakdownDto>();

        for (int i = 0; i < 6; i++)
        {
            var monthDate = startDate.AddMonths(i);
            var year = monthDate.Year;
            var month = monthDate.Month;

            // Check for persisted summary (use for past months)
            var persisted = persistedSummaries.FirstOrDefault(s =>
                s.SpendingPlan.Year == year && s.SpendingPlan.Month == month);

            if (persisted != null && !(year == now.Year && month == now.Month))
            {
                var pTotalSpent = persisted.TotalExpenses;
                var pNeedsPercent = pTotalSpent > 0 ? (persisted.NeedsSpent / pTotalSpent) * 100 : 0;
                var pWantsPercent = pTotalSpent > 0 ? (persisted.WantsSpent / pTotalSpent) * 100 : 0;
                var pGoalsPercent = pTotalSpent > 0 ? (persisted.GoalsSpent / pTotalSpent) * 100 : 0;

                monthlyBreakdowns.Add(new MonthlyBreakdownDto(
                    year, month,
                    Math.Round(pNeedsPercent, 2),
                    Math.Round(pWantsPercent, 2),
                    Math.Round(pGoalsPercent, 2),
                    persisted.TotalIncome,
                    pTotalSpent,
                    persisted.Surplus
                ));
                continue;
            }

            var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthEnd = monthStart.AddMonths(1);

            // Get transactions for this month
            var monthTransactions = transactions
                .Where(t => t.TransactionDate >= monthStart && t.TransactionDate < monthEnd)
                .ToList();

            // Calculate total spent (debits only)
            var totalSpent = monthTransactions
                .Where(t => t.Type == TransactionType.Debit)
                .Sum(t => Math.Abs(t.Amount));

            // Get income from spending plan or fallback to sum of credits
            var spendingPlan = spendingPlans
                .FirstOrDefault(s => s.Year == year && s.Month == month);

            var totalIncome = spendingPlan?.MonthlyIncome ??
                monthTransactions
                    .Where(t => t.Type == TransactionType.Credit)
                    .Sum(t => t.Amount);

            // Calculate spending per macro category
            var spentByMacro = new Dictionary<MacroCategoryType, decimal>();
            foreach (var macro in macroCategories)
            {
                var spent = monthTransactions
                    .Where(t => t.Type == TransactionType.Debit && t.MacroCategoryId == macro.Id)
                    .Sum(t => Math.Abs(t.Amount));
                spentByMacro[macro.Type] = spent;
            }

            // Calculate percentages (of total spent, not income)
            var needsPercent = totalSpent > 0 ? (spentByMacro.GetValueOrDefault(MacroCategoryType.Needs, 0) / totalSpent) * 100 : 0;
            var wantsPercent = totalSpent > 0 ? (spentByMacro.GetValueOrDefault(MacroCategoryType.Wants, 0) / totalSpent) * 100 : 0;
            var goalsPercent = totalSpent > 0 ? (spentByMacro.GetValueOrDefault(MacroCategoryType.Goals, 0) / totalSpent) * 100 : 0;

            var surplus = totalIncome - totalSpent;

            monthlyBreakdowns.Add(new MonthlyBreakdownDto(
                year,
                month,
                Math.Round(needsPercent, 2),
                Math.Round(wantsPercent, 2),
                Math.Round(goalsPercent, 2),
                totalIncome,
                totalSpent,
                surplus
            ));
        }

        // Calculate averages across all months with data
        var monthsWithData = monthlyBreakdowns.Where(m => m.TotalSpent > 0).ToList();
        var averageNeedsPercent = monthsWithData.Count > 0
            ? Math.Round(monthsWithData.Average(m => m.NeedsPercent), 2)
            : 0;
        var averageWantsPercent = monthsWithData.Count > 0
            ? Math.Round(monthsWithData.Average(m => m.WantsPercent), 2)
            : 0;
        var averageGoalsPercent = monthsWithData.Count > 0
            ? Math.Round(monthsWithData.Average(m => m.GoalsPercent), 2)
            : 0;
        var averageSurplus = monthsWithData.Count > 0
            ? Math.Round(monthsWithData.Average(m => m.Surplus), 2)
            : 0;

        // Calculate trend direction based on Goals % in recent 3 months vs older 3 months
        var trendDirection = CalculateTrendDirection(monthlyBreakdowns);

        // Calculate category averages
        var categoryAverages = CalculateCategoryAverages(
            transactions,
            macroCategories);

        return new InsightsResult(
            monthlyBreakdowns,
            averageNeedsPercent,
            averageWantsPercent,
            averageGoalsPercent,
            averageSurplus,
            trendDirection,
            categoryAverages
        );
    }

    private TrendDirection CalculateTrendDirection(List<MonthlyBreakdownDto> monthlyBreakdowns)
    {
        // Split into older 3 months and recent 3 months
        var olderMonths = monthlyBreakdowns.Take(3).Where(m => m.TotalSpent > 0).ToList();
        var recentMonths = monthlyBreakdowns.Skip(3).Take(3).Where(m => m.TotalSpent > 0).ToList();

        if (olderMonths.Count == 0 || recentMonths.Count == 0)
        {
            return TrendDirection.Stable;
        }

        var olderGoalsAvg = olderMonths.Average(m => m.GoalsPercent);
        var recentGoalsAvg = recentMonths.Average(m => m.GoalsPercent);

        var difference = recentGoalsAvg - olderGoalsAvg;

        // Use a threshold of 2% to determine significant change
        const decimal threshold = 2m;

        if (difference > threshold)
        {
            return TrendDirection.Improving;
        }
        else if (difference < -threshold)
        {
            return TrendDirection.Declining;
        }
        else
        {
            return TrendDirection.Stable;
        }
    }

    private static List<CategoryAverageDto> CalculateCategoryAverages(
        List<Domain.Entities.Transaction> transactions,
        List<Domain.Entities.MacroCategory> macroCategories)
    {
        // Group transactions by category and calculate averages
        var debitTransactions = transactions
            .Where(t => t.Type == TransactionType.Debit && t.CategoryId.HasValue)
            .ToList();

        var categoryGroups = debitTransactions
            .GroupBy(t => new { t.CategoryId, t.Category?.Name, t.MacroCategoryId })
            .ToList();

        var categoryAverages = new List<CategoryAverageDto>();

        // Determine number of months with transaction data
        var monthsWithTransactions = transactions
            .Where(t => t.Type == TransactionType.Debit)
            .Select(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
            .Distinct()
            .Count();

        if (monthsWithTransactions == 0)
        {
            monthsWithTransactions = 1; // Avoid division by zero
        }

        foreach (var group in categoryGroups)
        {
            if (!group.Key.CategoryId.HasValue || string.IsNullOrEmpty(group.Key.Name))
                continue;

            var totalAmount = group.Sum(t => Math.Abs(t.Amount));
            var averageAmount = totalAmount / monthsWithTransactions;

            var macroCategory = macroCategories
                .FirstOrDefault(m => m.Id == group.Key.MacroCategoryId);

            if (macroCategory == null)
                continue;

            categoryAverages.Add(new CategoryAverageDto(
                group.Key.CategoryId.Value,
                group.Key.Name,
                macroCategory.Type,
                Math.Round(averageAmount, 2)
            ));
        }

        return categoryAverages
            .OrderByDescending(c => c.AverageAmount)
            .ToList();
    }
}
