using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class BankConnection : BaseEntity
{
    public Guid UserId { get; set; }
    public required string BankName { get; set; }
    public required string StitchConnectionId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastSyncAt { get; set; }
    public DateTime? RequiresReauthorizationAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public StitchToken? StitchToken { get; set; }
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
    public ICollection<SyncHistory> SyncHistory { get; set; } = new List<SyncHistory>();
}
