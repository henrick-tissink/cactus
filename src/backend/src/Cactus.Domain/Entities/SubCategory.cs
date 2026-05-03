using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class SubCategory : BaseEntity
{
    public Guid CategoryId { get; set; }
    public Guid? UserId { get; set; } // Null for system sub-categories
    public required string Name { get; set; }
    public int DisplayOrder { get; set; }

    // Navigation properties
    public Category Category { get; set; } = null!;
    public User? User { get; set; }
}
