using Cactus.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.SpendingPlans.Queries;

public record GetSpendingPlanSuggestionQuery : IRequest<SpendingPlanSuggestionDto>;

public record SpendingPlanSuggestionDto(
    decimal CurrentNeeds,
    decimal CurrentWants,
    decimal CurrentGoals,
    decimal SuggestedNeeds,
    decimal SuggestedWants,
    decimal SuggestedGoals,
    string Explanation,
    bool HasSuggestion,
    decimal ActualNeeds = 0,
    decimal ActualWants = 0,
    decimal ActualGoals = 0
);

public class GetSpendingPlanSuggestionQueryHandler : IRequestHandler<GetSpendingPlanSuggestionQuery, SpendingPlanSuggestionDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    // 50/30/20 guideline constants
    private const decimal GuidelineNeeds = 50m;
    private const decimal GuidelineWants = 30m;
    private const decimal GuidelineGoals = 20m;

    // Thresholds for triggering suggestions
    private const decimal MinGoalsThreshold = 10m;
    private const decimal MaxNeedsThreshold = 60m;
    private const decimal MaxIncrementalChange = 10m;
    private const decimal SignificantDifferenceThreshold = 5m;

    public GetSpendingPlanSuggestionQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<SpendingPlanSuggestionDto> Handle(GetSpendingPlanSuggestionQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        // First, try to get the current spending plan
        var now = DateTime.UtcNow;
        var currentPlan = await _context.SpendingPlans
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Year == now.Year && p.Month == now.Month && p.IsActive, cancellationToken);

        decimal currentNeeds, currentWants, currentGoals;

        if (currentPlan != null)
        {
            // Use current spending plan values
            currentNeeds = currentPlan.NeedsPercentage;
            currentWants = currentPlan.WantsPercentage;
            currentGoals = currentPlan.GoalsPercentage;
        }
        else
        {
            // Fall back to onboarding Step 6 (Allocation Estimate)
            var onboardingResponse = await _context.OnboardingResponses
                .FirstOrDefaultAsync(o => o.UserId == userId && o.StepNumber == 6, cancellationToken);

            if (onboardingResponse != null)
            {
                // Parse the JSON response: {"needs": X, "wants": Y, "goals": Z}
                var allocation = ParseAllocationResponse(onboardingResponse.Response);
                currentNeeds = allocation.needs;
                currentWants = allocation.wants;
                currentGoals = allocation.goals;
            }
            else
            {
                // Default to 50/30/20 if no data available
                currentNeeds = GuidelineNeeds;
                currentWants = GuidelineWants;
                currentGoals = GuidelineGoals;
            }
        }

        // Query actual 6-month spending ratios
        var sixMonthsAgo = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-5);
        var userAccounts = await _context.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        var macroCategories = await _context.MacroCategories.ToListAsync(cancellationToken);

        var recentTransactions = await _context.Transactions
            .Where(t => userAccounts.Contains(t.AccountId) &&
                       t.TransactionDate >= sixMonthsAgo &&
                       t.Type == Cactus.Domain.Enums.TransactionType.Debit)
            .ToListAsync(cancellationToken);

        var totalSpent = recentTransactions.Sum(t => Math.Abs(t.Amount));

        decimal actualNeeds = 0, actualWants = 0, actualGoals = 0;

        if (totalSpent > 0)
        {
            var needsId = macroCategories.FirstOrDefault(m => m.Type == Cactus.Domain.Enums.MacroCategoryType.Needs)?.Id;
            var wantsId = macroCategories.FirstOrDefault(m => m.Type == Cactus.Domain.Enums.MacroCategoryType.Wants)?.Id;
            var goalsId = macroCategories.FirstOrDefault(m => m.Type == Cactus.Domain.Enums.MacroCategoryType.Goals)?.Id;

            var needsSpent = recentTransactions.Where(t => t.MacroCategoryId == needsId).Sum(t => Math.Abs(t.Amount));
            var wantsSpent = recentTransactions.Where(t => t.MacroCategoryId == wantsId).Sum(t => Math.Abs(t.Amount));
            var goalsSpent = recentTransactions.Where(t => t.MacroCategoryId == goalsId).Sum(t => Math.Abs(t.Amount));

            actualNeeds = Math.Round((needsSpent / totalSpent) * 100, 2);
            actualWants = Math.Round((wantsSpent / totalSpent) * 100, 2);
            actualGoals = Math.Round((goalsSpent / totalSpent) * 100, 2);
        }

        // Calculate suggestions using both threshold rules and actual data
        var (suggestedNeeds, suggestedWants, suggestedGoals, explanation, hasSuggestion) =
            totalSpent > 0
                ? CalculateDataDrivenSuggestion(currentNeeds, currentWants, currentGoals, actualNeeds, actualWants, actualGoals)
                : CalculateSuggestion(currentNeeds, currentWants, currentGoals);

        return new SpendingPlanSuggestionDto(
            currentNeeds,
            currentWants,
            currentGoals,
            suggestedNeeds,
            suggestedWants,
            suggestedGoals,
            explanation,
            hasSuggestion,
            actualNeeds,
            actualWants,
            actualGoals
        );
    }

    private static (decimal needs, decimal wants, decimal goals) ParseAllocationResponse(string response)
    {
        try
        {
            // Parse JSON like {"needs":50,"wants":30,"goals":20}
            var json = System.Text.Json.JsonDocument.Parse(response);
            var root = json.RootElement;

            var needs = root.GetProperty("needs").GetDecimal();
            var wants = root.GetProperty("wants").GetDecimal();
            var goals = root.GetProperty("goals").GetDecimal();

            return (needs, wants, goals);
        }
        catch
        {
            // Return default values if parsing fails
            return (GuidelineNeeds, GuidelineWants, GuidelineGoals);
        }
    }

    private static (decimal suggestedNeeds, decimal suggestedWants, decimal suggestedGoals, string explanation, bool hasSuggestion)
        CalculateSuggestion(decimal currentNeeds, decimal currentWants, decimal currentGoals)
    {
        var suggestedNeeds = currentNeeds;
        var suggestedWants = currentWants;
        var suggestedGoals = currentGoals;
        var explanations = new List<string>();
        var hasSuggestion = false;

        // Rule 1: If Goals < 10%, suggest increasing to at least 10%
        if (currentGoals < MinGoalsThreshold)
        {
            var goalsIncrease = Math.Min(MinGoalsThreshold - currentGoals, MaxIncrementalChange);
            suggestedGoals = currentGoals + goalsIncrease;

            // Take from wants first, then needs if necessary
            var wantsDecrease = Math.Min(currentWants, goalsIncrease);
            suggestedWants = currentWants - wantsDecrease;

            if (wantsDecrease < goalsIncrease)
            {
                suggestedNeeds = currentNeeds - (goalsIncrease - wantsDecrease);
            }

            explanations.Add($"Consider increasing your Goals allocation to at least {MinGoalsThreshold}% to build savings and achieve your financial targets faster.");
            hasSuggestion = true;
        }
        // Rule 2: If Needs > 60%, suggest reviewing fixed costs
        else if (currentNeeds > MaxNeedsThreshold)
        {
            var needsDecrease = Math.Min(currentNeeds - GuidelineNeeds, MaxIncrementalChange);
            suggestedNeeds = currentNeeds - needsDecrease;

            // Add to goals first, as building savings is important
            var goalsIncrease = needsDecrease / 2;
            var wantsIncrease = needsDecrease - goalsIncrease;

            suggestedGoals = currentGoals + goalsIncrease;
            suggestedWants = currentWants + wantsIncrease;

            explanations.Add($"Your Needs allocation is above {MaxNeedsThreshold}%. Consider reviewing your fixed costs to see if any can be reduced, freeing up money for savings and enjoying life.");
            hasSuggestion = true;
        }
        // Rule 3: General guidance towards 50/30/20
        else if (Math.Abs(currentNeeds - GuidelineNeeds) > SignificantDifferenceThreshold ||
                 Math.Abs(currentWants - GuidelineWants) > SignificantDifferenceThreshold ||
                 Math.Abs(currentGoals - GuidelineGoals) > SignificantDifferenceThreshold)
        {
            // Move incrementally towards 50/30/20
            suggestedNeeds = MoveTowardsTarget(currentNeeds, GuidelineNeeds, MaxIncrementalChange / 2);
            suggestedWants = MoveTowardsTarget(currentWants, GuidelineWants, MaxIncrementalChange / 2);
            suggestedGoals = MoveTowardsTarget(currentGoals, GuidelineGoals, MaxIncrementalChange / 2);

            // Ensure they still sum to 100
            var total = suggestedNeeds + suggestedWants + suggestedGoals;
            if (total != 100)
            {
                var diff = 100 - total;
                suggestedWants += diff; // Adjust wants to balance
            }

            explanations.Add("The 50/30/20 rule is a helpful guideline: 50% for needs, 30% for wants, and 20% for goals. Small adjustments can help you get closer to this balance.");
            hasSuggestion = true;
        }

        // If no suggestion needed, provide encouragement
        if (!hasSuggestion)
        {
            return (currentNeeds, currentWants, currentGoals, "Your current allocation looks well-balanced! Keep up the great work.", false);
        }

        return (suggestedNeeds, suggestedWants, suggestedGoals, string.Join(" ", explanations), hasSuggestion);
    }

    private static decimal MoveTowardsTarget(decimal current, decimal target, decimal maxChange)
    {
        var diff = target - current;
        if (Math.Abs(diff) <= maxChange)
            return target;

        return current + (diff > 0 ? maxChange : -maxChange);
    }

    private static (decimal suggestedNeeds, decimal suggestedWants, decimal suggestedGoals, string explanation, bool hasSuggestion)
        CalculateDataDrivenSuggestion(decimal currentNeeds, decimal currentWants, decimal currentGoals,
            decimal actualNeeds, decimal actualWants, decimal actualGoals)
    {
        var explanations = new List<string>();
        var hasSuggestion = false;

        var suggestedNeeds = currentNeeds;
        var suggestedWants = currentWants;
        var suggestedGoals = currentGoals;

        // Compare actual vs allocated
        var needsDiff = actualNeeds - currentNeeds;
        var wantsDiff = actualWants - currentWants;
        var goalsDiff = actualGoals - currentGoals;

        // If spending significantly over on needs, suggest adjusting
        if (needsDiff > SignificantDifferenceThreshold)
        {
            var adjustment = Math.Min(needsDiff / 2, MaxIncrementalChange);
            suggestedNeeds = Math.Round(currentNeeds + adjustment, 0);
            suggestedWants = Math.Round(currentWants - adjustment / 2, 0);
            suggestedGoals = Math.Round(currentGoals - adjustment / 2, 0);

            explanations.Add($"Your actual needs spending ({actualNeeds:F0}%) is higher than your allocation ({currentNeeds:F0}%). Consider adjusting your plan to better reflect reality, or look for ways to reduce fixed costs.");
            hasSuggestion = true;
        }
        // If spending significantly over on wants
        else if (wantsDiff > SignificantDifferenceThreshold)
        {
            var adjustment = Math.Min(wantsDiff / 2, MaxIncrementalChange);
            suggestedWants = Math.Round(currentWants + adjustment, 0);
            suggestedGoals = Math.Round(currentGoals - adjustment, 0);

            explanations.Add($"Your actual wants spending ({actualWants:F0}%) exceeds your allocation ({currentWants:F0}%). Consider either adjusting your plan or reducing discretionary spending to stay on track with your goals.");
            hasSuggestion = true;
        }
        // If goals spending much lower than allocated
        else if (goalsDiff < -SignificantDifferenceThreshold && currentGoals > MinGoalsThreshold)
        {
            explanations.Add($"You're allocating {currentGoals:F0}% to goals but only spending {actualGoals:F0}% on them. Great discipline on other spending — make sure your savings are being put to work!");
            hasSuggestion = true;
        }

        if (!hasSuggestion)
        {
            // Fall back to threshold-based rules
            return CalculateSuggestion(currentNeeds, currentWants, currentGoals);
        }

        // Ensure total is 100
        var total = suggestedNeeds + suggestedWants + suggestedGoals;
        if (total != 100)
        {
            suggestedWants += 100 - total;
        }

        return (suggestedNeeds, suggestedWants, suggestedGoals, string.Join(" ", explanations), hasSuggestion);
    }
}
