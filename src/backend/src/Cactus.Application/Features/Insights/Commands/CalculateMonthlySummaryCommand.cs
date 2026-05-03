using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Insights.Commands;

public record CalculateMonthlySummaryCommand(int Year, int Month) : IRequest<MonthlySummary?>;

public class CalculateMonthlySummaryCommandHandler : IRequestHandler<CalculateMonthlySummaryCommand, MonthlySummary?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CalculateMonthlySummaryCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<MonthlySummary?> Handle(CalculateMonthlySummaryCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var spendingPlan = await _context.SpendingPlans
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Year == request.Year && s.Month == request.Month && s.IsActive, cancellationToken);

        if (spendingPlan == null) return null;

        // Check if summary already exists
        var existing = await _context.MonthlySummaries
            .FirstOrDefaultAsync(m => m.SpendingPlanId == spendingPlan.Id, cancellationToken);

        var userAccounts = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        var monthStart = new DateTime(request.Year, request.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);

        var transactions = await _context.Transactions
            .Where(t => userAccounts.Contains(t.AccountId) &&
                       t.TransactionDate >= monthStart &&
                       t.TransactionDate < monthEnd)
            .Include(t => t.MacroCategory)
            .ToListAsync(cancellationToken);

        var macroCategories = await _context.MacroCategories.ToListAsync(cancellationToken);

        var totalExpenses = transactions
            .Where(t => t.Type == TransactionType.Debit)
            .Sum(t => Math.Abs(t.Amount));

        var needsId = macroCategories.FirstOrDefault(m => m.Type == MacroCategoryType.Needs)?.Id;
        var wantsId = macroCategories.FirstOrDefault(m => m.Type == MacroCategoryType.Wants)?.Id;
        var goalsId = macroCategories.FirstOrDefault(m => m.Type == MacroCategoryType.Goals)?.Id;

        var needsSpent = transactions
            .Where(t => t.Type == TransactionType.Debit && t.MacroCategoryId == needsId)
            .Sum(t => Math.Abs(t.Amount));

        var wantsSpent = transactions
            .Where(t => t.Type == TransactionType.Debit && t.MacroCategoryId == wantsId)
            .Sum(t => Math.Abs(t.Amount));

        var goalsSpent = transactions
            .Where(t => t.Type == TransactionType.Debit && t.MacroCategoryId == goalsId)
            .Sum(t => Math.Abs(t.Amount));

        var totalIncome = spendingPlan.MonthlyIncome;
        var surplus = totalIncome - totalExpenses;

        if (existing != null)
        {
            existing.TotalIncome = totalIncome;
            existing.TotalExpenses = totalExpenses;
            existing.NeedsSpent = needsSpent;
            existing.WantsSpent = wantsSpent;
            existing.GoalsSpent = goalsSpent;
            existing.Surplus = surplus;
            existing.CalculatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
            return existing;
        }

        var summary = new MonthlySummary
        {
            SpendingPlanId = spendingPlan.Id,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            NeedsSpent = needsSpent,
            WantsSpent = wantsSpent,
            GoalsSpent = goalsSpent,
            Surplus = surplus,
            CalculatedAt = DateTime.UtcNow
        };

        _context.MonthlySummaries.Add(summary);
        await _context.SaveChangesAsync(cancellationToken);

        return summary;
    }
}
