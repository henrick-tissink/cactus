using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class SpendingPlan : BaseEntity
{
    public Guid UserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal MonthlyIncome { get; set; }
    public decimal NeedsPercentage { get; set; }
    public decimal WantsPercentage { get; set; }
    public decimal GoalsPercentage { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<BudgetAllocation> BudgetAllocations { get; set; } = new List<BudgetAllocation>();
    public MonthlySummary? MonthlySummary { get; set; }
}
