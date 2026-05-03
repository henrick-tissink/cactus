using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Goals.Queries;

public record GetGoalRecommendationsQuery : IRequest<List<GoalRecommendationDto>>;

public record GoalRecommendationDto(
    int Order,
    GoalType GoalType,
    string Title,
    string Description,
    decimal SuggestedAmount,
    decimal CurrentProgress,
    bool AlreadyExists
);

public class GetGoalRecommendationsQueryHandler : IRequestHandler<GetGoalRecommendationsQuery, List<GoalRecommendationDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetGoalRecommendationsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<GoalRecommendationDto>> Handle(GetGoalRecommendationsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        // Get user's financial data
        var now = DateTime.UtcNow;
        var currentPlan = await _context.SpendingPlans
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive && s.Year == now.Year && s.Month == now.Month, cancellationToken);

        var monthlyIncome = currentPlan?.MonthlyIncome ?? 0;

        // Get total active debt
        var totalDebt = await _context.UserDebts
            .Where(d => d.UserId == userId && d.IsActive)
            .SumAsync(d => d.CurrentBalance, cancellationToken);

        // Calculate average monthly expenses (last 6 months)
        var userAccounts = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        var sixMonthsAgo = now.AddMonths(-6);
        var recentDebits = await _context.Transactions
            .Where(t => userAccounts.Contains(t.AccountId) &&
                       t.TransactionDate >= sixMonthsAgo &&
                       t.Type == TransactionType.Debit)
            .ToListAsync(cancellationToken);

        var monthlyExpenses = recentDebits.Sum(t => Math.Abs(t.Amount));
        var distinctMonths = recentDebits
            .Select(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
            .Distinct()
            .Count();

        var avgMonthlyExpenses = distinctMonths > 0 ? monthlyExpenses / distinctMonths : 0;
        if (avgMonthlyExpenses == 0 && monthlyIncome > 0)
        {
            avgMonthlyExpenses = monthlyIncome * 0.8m; // Estimate if no data
        }

        // Get existing goals
        var existingGoals = await _context.Goals
            .Where(g => g.UserId == userId && g.IsActive)
            .ToListAsync(cancellationToken);

        var recommendations = new List<GoalRecommendationDto>();

        // 1. Mini Buffer
        var miniBufferAmount = Math.Max(5000, avgMonthlyExpenses);
        var miniBufferGoal = existingGoals.FirstOrDefault(g => g.GoalType == GoalType.MiniBuffer);
        recommendations.Add(new GoalRecommendationDto(
            1,
            GoalType.MiniBuffer,
            "Mini Buffer",
            $"Start with a buffer of {FormatZar(miniBufferAmount)} for unexpected expenses",
            Math.Round(miniBufferAmount, 0),
            miniBufferGoal?.CurrentAmount ?? 0,
            miniBufferGoal != null
        ));

        // 2. Debt Payoff
        var debtGoal = existingGoals.FirstOrDefault(g => g.GoalType == GoalType.DebtPayoff);
        recommendations.Add(new GoalRecommendationDto(
            2,
            GoalType.DebtPayoff,
            "High-Interest Debt",
            totalDebt > 0
                ? $"Pay off {FormatZar(totalDebt)} in active debt"
                : "No active debt detected — great job!",
            Math.Round(totalDebt, 0),
            debtGoal?.CurrentAmount ?? 0,
            debtGoal != null
        ));

        // 3. Emergency Fund (3-6 months expenses)
        var emergencyMin = avgMonthlyExpenses * 3;
        var emergencyMax = avgMonthlyExpenses * 6;
        var emergencyTarget = avgMonthlyExpenses * 4; // Suggest 4 months as default
        var emergencyGoal = existingGoals.FirstOrDefault(g => g.GoalType == GoalType.EmergencyFund);
        recommendations.Add(new GoalRecommendationDto(
            3,
            GoalType.EmergencyFund,
            "Emergency Fund",
            $"Build {FormatZar(emergencyMin)} to {FormatZar(emergencyMax)} (3-6 months of expenses)",
            Math.Round(emergencyTarget, 0),
            emergencyGoal?.CurrentAmount ?? 0,
            emergencyGoal != null
        ));

        // 4. Investing
        var annualInvestment = monthlyIncome > 0 ? monthlyIncome * 0.10m * 12 : 0;
        var investGoal = existingGoals.FirstOrDefault(g => g.GoalType == GoalType.Investment);
        recommendations.Add(new GoalRecommendationDto(
            4,
            GoalType.Investment,
            "Long-term Investing",
            annualInvestment > 0
                ? $"Invest 10% of income — {FormatZar(annualInvestment)}/year"
                : "Start building wealth for the future",
            Math.Round(annualInvestment, 0),
            investGoal?.CurrentAmount ?? 0,
            investGoal != null
        ));

        return recommendations;
    }

    private static string FormatZar(decimal amount)
    {
        return $"R{amount:N0}";
    }
}
