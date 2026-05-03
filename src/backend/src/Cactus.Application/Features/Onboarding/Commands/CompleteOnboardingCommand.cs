using Cactus.Application.Common.Interfaces;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Application.Features.Onboarding.Commands;

public record CompleteOnboardingCommand : IRequest<Unit>;

public class CompleteOnboardingCommandHandler : IRequestHandler<CompleteOnboardingCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CompleteOnboardingCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(CompleteOnboardingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var user = await _context.Users.FindAsync([userId], cancellationToken)
            ?? throw new InvalidOperationException("User not found");

        user.IsOnboardingComplete = true;

        // Create initial spending plan based on onboarding responses
        var responses = await _context.OnboardingResponses
            .Where(o => o.UserId == userId)
            .ToListAsync(cancellationToken);

        // Create default spending plan for current month
        var now = DateTime.UtcNow;
        var existingPlan = await _context.SpendingPlans
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Year == now.Year && s.Month == now.Month, cancellationToken);

        if (existingPlan == null)
        {
            // Get income from onboarding response (step 5)
            var incomeResponse = responses.FirstOrDefault(r => r.StepNumber == 5);
            var monthlyIncome = 0m;
            if (incomeResponse != null)
            {
                decimal.TryParse(incomeResponse.Response, out monthlyIncome);
            }

            // Get allocation from onboarding response (step 6)
            var allocationResponse = responses.FirstOrDefault(r => r.StepNumber == 6);
            decimal needsPercent = 50, wantsPercent = 30, goalsPercent = 20;

            if (allocationResponse != null)
            {
                // Parse JSON allocation {"needs":50,"wants":30,"goals":20}
                try
                {
                    var json = System.Text.Json.JsonDocument.Parse(allocationResponse.Response);
                    if (json.RootElement.TryGetProperty("needs", out var needs))
                        needsPercent = needs.GetDecimal();
                    if (json.RootElement.TryGetProperty("wants", out var wants))
                        wantsPercent = wants.GetDecimal();
                    if (json.RootElement.TryGetProperty("goals", out var goals))
                        goalsPercent = goals.GetDecimal();
                }
                catch
                {
                    // Use defaults
                }
            }

            var spendingPlan = new SpendingPlan
            {
                UserId = userId,
                Year = now.Year,
                Month = now.Month,
                MonthlyIncome = monthlyIncome,
                NeedsPercentage = needsPercent,
                WantsPercentage = wantsPercent,
                GoalsPercentage = goalsPercent,
                IsActive = true
            };

            _context.SpendingPlans.Add(spendingPlan);
        }

        // Process Step 7 debt response and create UserDebt entities
        var debtResponse = responses.FirstOrDefault(r => r.StepNumber == 7);
        var createdDebts = await ProcessDebtResponse(userId, debtResponse, cancellationToken);

        // Create a DebtPayoff goal if any debts were added
        if (createdDebts.Count > 0)
        {
            var totalDebt = createdDebts.Sum(d => d.CurrentBalance);
            var debtGoal = new Goal
            {
                UserId = userId,
                Name = "Pay Off Debt",
                GoalType = GoalType.DebtPayoff,
                TargetAmount = totalDebt,
                CurrentAmount = 0,
                Priority = 1,
                IsActive = true,
                IsCompleted = false
            };

            _context.Goals.Add(debtGoal);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }

    private async Task<List<UserDebt>> ProcessDebtResponse(
        Guid userId,
        OnboardingResponse? debtResponse,
        CancellationToken cancellationToken)
    {
        var createdDebts = new List<UserDebt>();

        if (debtResponse == null || string.IsNullOrWhiteSpace(debtResponse.Response))
            return createdDebts;

        // Check if this is a JSON array (new format) or old format (yes/no/unsure)
        var response = debtResponse.Response.Trim();
        if (!response.StartsWith("["))
            return createdDebts; // Old format or "no debts" - nothing to create

        try
        {
            var debtsJson = System.Text.Json.JsonDocument.Parse(response);

            foreach (var debtElement in debtsJson.RootElement.EnumerateArray())
            {
                var typeString = debtElement.TryGetProperty("type", out var typeProp)
                    ? typeProp.GetString()
                    : null;

                var name = debtElement.TryGetProperty("name", out var nameProp)
                    ? nameProp.GetString()
                    : null;

                var balance = debtElement.TryGetProperty("balance", out var balanceProp)
                    ? balanceProp.GetDecimal()
                    : 0m;

                if (balance <= 0)
                    continue;

                var debtType = ParseDebtType(typeString);
                var debtName = !string.IsNullOrWhiteSpace(name)
                    ? name
                    : GetDefaultDebtName(debtType);

                var userDebt = new UserDebt
                {
                    UserId = userId,
                    DebtType = debtType,
                    Name = debtName,
                    OriginalAmount = balance,
                    CurrentBalance = balance,
                    InterestRate = 0, // User can update this later
                    MinimumPayment = 0, // User can update this later
                    IsActive = true
                };

                _context.UserDebts.Add(userDebt);
                createdDebts.Add(userDebt);
            }
        }
        catch
        {
            // Invalid JSON - return empty list
        }

        return createdDebts;
    }

    private static DebtType ParseDebtType(string? typeString)
    {
        return typeString?.ToLowerInvariant() switch
        {
            "credit card" => DebtType.CreditCard,
            "personal loan" => DebtType.PersonalLoan,
            "overdraft" => DebtType.Overdraft,
            "buy-now-pay-later" => DebtType.BuyNowPayLater,
            _ => DebtType.Other
        };
    }

    private static string GetDefaultDebtName(DebtType debtType)
    {
        return debtType switch
        {
            DebtType.CreditCard => "Credit Card",
            DebtType.PersonalLoan => "Personal Loan",
            DebtType.Overdraft => "Overdraft",
            DebtType.BuyNowPayLater => "Buy Now Pay Later",
            _ => "Other Debt"
        };
    }
}
