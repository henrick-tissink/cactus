using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class GoalMilestone : BaseEntity
{
    public Guid GoalId { get; set; }
    public required string Name { get; set; }
    public decimal TargetAmount { get; set; }
    public bool IsReached { get; set; }
    public DateTime? ReachedAt { get; set; }

    // Navigation properties
    public Goal Goal { get; set; } = null!;
}
