using Cactus.Domain.Common;
using Cactus.Domain.Enums;

namespace Cactus.Domain.Entities;

public class Account : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? BankConnectionId { get; set; }
    public required string Name { get; set; }
    public AccountType AccountType { get; set; }
    public string? StitchAccountId { get; set; }
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "ZAR";
    public bool IsManual { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastBalanceUpdate { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public BankConnection? BankConnection { get; set; }
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Goal> LinkedGoals { get; set; } = new List<Goal>();
}
