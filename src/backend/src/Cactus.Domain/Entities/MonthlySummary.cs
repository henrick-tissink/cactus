using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class MonthlySummary : BaseEntity
{
    public Guid SpendingPlanId { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NeedsSpent { get; set; }
    public decimal WantsSpent { get; set; }
    public decimal GoalsSpent { get; set; }
    public decimal Surplus { get; set; }
    public DateTime CalculatedAt { get; set; }

    // Navigation properties
    public SpendingPlan SpendingPlan { get; set; } = null!;
}
