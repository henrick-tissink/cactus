using Cactus.Domain.Common;
using Cactus.Domain.Enums;

namespace Cactus.Domain.Entities;

public class UserDebt : BaseEntity
{
    public Guid UserId { get; set; }
    public DebtType DebtType { get; set; }
    public required string Name { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal CurrentBalance { get; set; }
    public decimal InterestRate { get; set; }
    public decimal MinimumPayment { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Goal> LinkedGoals { get; set; } = new List<Goal>();
}
