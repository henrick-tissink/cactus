using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.SpendingPlans.Queries;

public record GetCurrentSpendingPlanQuery : IRequest<SpendingPlanDto?>;

public record SpendingPlanDto(
    Guid Id,
    int Year,
    int Month,
    decimal MonthlyIncome,
    decimal NeedsPercentage,
    decimal WantsPercentage,
    decimal GoalsPercentage,
    decimal NeedsAmount,
    decimal WantsAmount,
    decimal GoalsAmount,
    decimal NeedsSpent,
    decimal WantsSpent,
    decimal GoalsSpent,
    List<BudgetAllocationDto> Allocations
);

public record BudgetAllocationDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    decimal AllocatedAmount
);

public class GetCurrentSpendingPlanQueryHandler : IRequestHandler<GetCurrentSpendingPlanQuery, SpendingPlanDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetCurrentSpendingPlanQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<SpendingPlanDto?> Handle(GetCurrentSpendingPlanQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var now = DateTime.UtcNow;

        var plan = await _context.SpendingPlans
            .Include(p => p.BudgetAllocations)
            .ThenInclude(a => a.Category)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Year == now.Year && p.Month == now.Month && p.IsActive, cancellationToken);

        if (plan == null)
            return null;

        // Get user's account IDs
        var userAccountIds = await _context.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        // Calculate start and end of current month
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);

        // Get spending amounts grouped by macro category type for the current month
        var spentByMacroCategory = await _context.Transactions
            .Where(t => userAccountIds.Contains(t.AccountId)
                && t.TransactionDate >= monthStart
                && t.TransactionDate < monthEnd
                && t.Type == TransactionType.Debit
                && t.MacroCategoryId != null)
            .GroupBy(t => t.MacroCategory!.Type)
            .Select(g => new { MacroCategoryType = g.Key, TotalSpent = g.Sum(t => Math.Abs(t.Amount)) })
            .ToListAsync(cancellationToken);

        var needsSpent = spentByMacroCategory.FirstOrDefault(x => x.MacroCategoryType == MacroCategoryType.Needs)?.TotalSpent ?? 0;
        var wantsSpent = spentByMacroCategory.FirstOrDefault(x => x.MacroCategoryType == MacroCategoryType.Wants)?.TotalSpent ?? 0;
        var goalsSpent = spentByMacroCategory.FirstOrDefault(x => x.MacroCategoryType == MacroCategoryType.Goals)?.TotalSpent ?? 0;

        return new SpendingPlanDto(
            plan.Id,
            plan.Year,
            plan.Month,
            plan.MonthlyIncome,
            plan.NeedsPercentage,
            plan.WantsPercentage,
            plan.GoalsPercentage,
            plan.MonthlyIncome * plan.NeedsPercentage / 100,
            plan.MonthlyIncome * plan.WantsPercentage / 100,
            plan.MonthlyIncome * plan.GoalsPercentage / 100,
            needsSpent,
            wantsSpent,
            goalsSpent,
            plan.BudgetAllocations.Select(a => new BudgetAllocationDto(
                a.Id,
                a.CategoryId,
                a.Category.Name,
                a.AllocatedAmount
            )).ToList()
        );
    }
}
