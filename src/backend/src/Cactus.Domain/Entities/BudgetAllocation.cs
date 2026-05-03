using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class BudgetAllocation : BaseEntity
{
    public Guid SpendingPlanId { get; set; }
    public Guid CategoryId { get; set; }
    public decimal AllocatedAmount { get; set; }

    // Navigation properties
    public SpendingPlan SpendingPlan { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
