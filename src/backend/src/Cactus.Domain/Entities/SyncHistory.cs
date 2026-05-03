using Cactus.Domain.Common;
using Cactus.Domain.Enums;

namespace Cactus.Domain.Entities;

public class SyncHistory : BaseEntity
{
    public Guid BankConnectionId { get; set; }
    public SyncStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int TransactionsSynced { get; set; }
    public string? ErrorMessage { get; set; }

    // Navigation properties
    public BankConnection BankConnection { get; set; } = null!;
}
