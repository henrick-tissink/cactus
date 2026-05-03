using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class GoalProgress : BaseEntity
{
    public Guid GoalId { get; set; }
    public decimal Amount { get; set; }
    public decimal RunningTotal { get; set; }
    public string? Note { get; set; }
    public DateTime RecordedAt { get; set; }

    // Navigation properties
    public Goal Goal { get; set; } = null!;
}
