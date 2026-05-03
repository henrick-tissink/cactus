using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class CategorizationRule : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid MacroCategoryId { get; set; }
    public Guid CategoryId { get; set; }
    public Guid? SubCategoryId { get; set; }
    public required string Pattern { get; set; }
    public string? MerchantPattern { get; set; }
    public int MatchCount { get; set; }
    public decimal ConfidenceScore { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public User User { get; set; } = null!;
    public MacroCategory MacroCategory { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public SubCategory? SubCategory { get; set; }
}
