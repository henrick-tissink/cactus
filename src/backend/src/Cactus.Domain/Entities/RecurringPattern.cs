using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class RecurringPattern : BaseEntity
{
    public Guid TransactionId { get; set; }
    public required string PatternDescription { get; set; }
    public decimal AverageAmount { get; set; }
    public int FrequencyDays { get; set; }
    public DateTime? NextExpectedDate { get; set; }

    // Navigation properties
    public Transaction Transaction { get; set; } = null!;
}
