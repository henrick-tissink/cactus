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

        SpendingPlan? newSpendingPlan = null;
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

            newSpendingPlan = spendingPlan;
            _context.SpendingPlans.Add(spendingPlan);
        }

        // Process Step 7 debt response and create UserDebt entities
        var debtResponse = responses.FirstOrDefault(r => r.StepNumber == 7);
        var createdDebts = await ProcessDebtResponse(userId, debtResponse, cancellationToken);

        // Determine goal type from step 6 (goal pick); fall back to legacy DebtPayoff-from-debts if step 6 is absent or malformed.
        var goalPickResponse = responses.FirstOrDefault(r => r.StepNumber == 6);
        var goalPickValue = ParseGoalPickValue(goalPickResponse?.Response);

        if (goalPickValue != null)
        {
            var goal = CreateGoalForPick(userId, goalPickValue, createdDebts);
            if (goal != null) _context.Goals.Add(goal);
        }
        else if (createdDebts.Count > 0)
        {
            // Legacy fallback: pre-O-4 users finishing old onboarding
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

        // PR O-5: Create UserCategory + BudgetAllocation rows from step 3 + step 4
        if (newSpendingPlan != null)
        {
            var categoriesResponse = responses.FirstOrDefault(r => r.StepNumber == 3);
            if (categoriesResponse != null)
            {
                await ProcessCategoriesAndEstimatesAsync(
                    userId,
                    newSpendingPlan,
                    categoriesResponse.Response,
                    responses.FirstOrDefault(r => r.StepNumber == 4)?.Response,
                    cancellationToken
                );
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }

    private async Task ProcessCategoriesAndEstimatesAsync(
        Guid userId,
        SpendingPlan plan,
        string categoriesJson,
        string? estimatesJson,
        CancellationToken cancellationToken)
    {
        var selectedNames = new List<string>();
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(categoriesJson);
            if (doc.RootElement.TryGetProperty("needs", out var needs)
                && needs.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var n in needs.EnumerateArray())
                {
                    var name = n.GetString();
                    if (!string.IsNullOrWhiteSpace(name)) selectedNames.Add(name);
                }
            }
            if (doc.RootElement.TryGetProperty("wants", out var wants)
                && wants.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var w in wants.EnumerateArray())
                {
                    var name = w.GetString();
                    if (!string.IsNullOrWhiteSpace(name)) selectedNames.Add(name);
                }
            }
        }
        catch
        {
            return;
        }

        if (selectedNames.Count == 0) return;

        var estimates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(estimatesJson))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(estimatesJson);
                if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    foreach (var prop in doc.RootElement.EnumerateObject())
                    {
                        if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Number
                            && prop.Value.TryGetDecimal(out var amount))
                        {
                            estimates[prop.Name] = amount;
                        }
                    }
                }
            }
            catch
            {
                // Estimates are optional; carry on with zeros.
            }
        }

        var categories = await _context.Categories
            .Where(c => selectedNames.Contains(c.Name))
            .ToListAsync(cancellationToken);

        foreach (var category in categories)
        {
            _context.UserCategories.Add(new UserCategory
            {
                UserId = userId,
                CategoryId = category.Id,
                IsHidden = false,
            });

            estimates.TryGetValue(category.Name, out var amount);
            _context.BudgetAllocations.Add(new BudgetAllocation
            {
                SpendingPlanId = plan.Id,
                CategoryId = category.Id,
                AllocatedAmount = amount,
            });
        }
    }

    private static string? ParseGoalPickValue(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array
                && doc.RootElement.GetArrayLength() > 0)
            {
                var value = doc.RootElement[0].GetString();
                if (value == "save" || value == "debt" || value == "emergency") return value;
            }
        }
        catch
        {
            // fall through
        }
        return null;
    }

    private static Goal? CreateGoalForPick(Guid userId, string pick, List<UserDebt> createdDebts)
    {
        return pick switch
        {
            "save" => new Goal
            {
                UserId = userId,
                Name = "Save more money",
                GoalType = GoalType.Savings,
                TargetAmount = 0,
                CurrentAmount = 0,
                Priority = 1,
                IsActive = true,
                IsCompleted = false,
                IsPrimary = true
            },
            "debt" => new Goal
            {
                UserId = userId,
                Name = "Pay off debt",
                GoalType = GoalType.DebtPayoff,
                TargetAmount = createdDebts.Sum(d => d.CurrentBalance),
                CurrentAmount = 0,
                Priority = 1,
                IsActive = true,
                IsCompleted = false,
                IsPrimary = true,
                LinkedDebtId = createdDebts.OrderByDescending(d => d.CurrentBalance).FirstOrDefault()?.Id
            },
            "emergency" => new Goal
            {
                UserId = userId,
                Name = "Emergency fund",
                GoalType = GoalType.EmergencyFund,
                TargetAmount = 0,
                CurrentAmount = 0,
                Priority = 1,
                IsActive = true,
                IsCompleted = false,
                IsPrimary = true
            },
            _ => null
        };
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
