using Cactus.Domain.Common;
using Cactus.Domain.Enums;

namespace Cactus.Domain.Entities;

public class Transaction : BaseEntity
{
    public Guid AccountId { get; set; }
    public Guid? MacroCategoryId { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? SubCategoryId { get; set; }
    public string? StitchTransactionId { get; set; }
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public required string Description { get; set; }
    public string? MerchantName { get; set; }
    public DateTime TransactionDate { get; set; }
    public DateTime? PostedDate { get; set; }
    public bool IsClassified { get; set; }
    public bool IsManual { get; set; }
    public bool IsRecurring { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public Account Account { get; set; } = null!;
    public MacroCategory? MacroCategory { get; set; }
    public Category? Category { get; set; }
    public SubCategory? SubCategory { get; set; }
    public RecurringPattern? RecurringPattern { get; set; }
}
