using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class UserCategory : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid CategoryId { get; set; }
    public bool IsHidden { get; set; }
    public int? CustomDisplayOrder { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
