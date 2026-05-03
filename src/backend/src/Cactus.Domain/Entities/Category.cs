using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class Category : BaseEntity
{
    public Guid MacroCategoryId { get; set; }
    public required string Name { get; set; }
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsSystem { get; set; } = true;

    // Navigation properties
    public MacroCategory MacroCategory { get; set; } = null!;
    public ICollection<UserCategory> UserCategories { get; set; } = new List<UserCategory>();
    public ICollection<SubCategory> SubCategories { get; set; } = new List<SubCategory>();
}
