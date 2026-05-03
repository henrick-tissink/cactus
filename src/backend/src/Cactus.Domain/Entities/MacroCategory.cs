using Cactus.Domain.Common;
using Cactus.Domain.Enums;

namespace Cactus.Domain.Entities;

public class MacroCategory : BaseEntity
{
    public MacroCategoryType Type { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public int DisplayOrder { get; set; }

    // Navigation properties
    public ICollection<Category> Categories { get; set; } = new List<Category>();
}
