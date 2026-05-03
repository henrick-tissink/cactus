using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class OnboardingResponse : BaseEntity
{
    public Guid UserId { get; set; }
    public int StepNumber { get; set; }
    public required string StepName { get; set; }
    public required string Response { get; set; } // JSON stored as string

    // Navigation properties
    public User User { get; set; } = null!;
}
