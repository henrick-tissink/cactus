using Cactus.Domain.Common;
using Cactus.Domain.Enums;

namespace Cactus.Domain.Entities;

public class Goal : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? LinkedAccountId { get; set; }
    public Guid? LinkedDebtId { get; set; }
    public required string Name { get; set; }
    public GoalType GoalType { get; set; }
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateTime? TargetDate { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsPrimary { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Account? LinkedAccount { get; set; }
    public UserDebt? LinkedDebt { get; set; }
    public ICollection<GoalProgress> Progress { get; set; } = new List<GoalProgress>();
    public ICollection<GoalMilestone> Milestones { get; set; } = new List<GoalMilestone>();
}
