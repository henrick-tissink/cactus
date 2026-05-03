using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class StitchToken : BaseEntity
{
    public Guid BankConnectionId { get; set; }
    public required string AccessTokenEncrypted { get; set; }
    public required string RefreshTokenEncrypted { get; set; }
    public DateTime AccessTokenExpiresAt { get; set; }
    public DateTime RefreshTokenExpiresAt { get; set; }
    public required string Scope { get; set; }

    // Navigation properties
    public BankConnection BankConnection { get; set; } = null!;
}
