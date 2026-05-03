using Cactus.Domain.Common;

namespace Cactus.Domain.Entities;

public class User : BaseEntity
{
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool IsOnboardingComplete { get; set; }
    public DateTime? LastLoginAt { get; set; }

    // Password reset
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    // Email verification
    public bool IsEmailVerified { get; set; }
    public string? EmailVerificationTokenHash { get; set; }
    public DateTime? EmailVerificationTokenExpiresAt { get; set; }

    // Navigation properties
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<OnboardingResponse> OnboardingResponses { get; set; } = new List<OnboardingResponse>();
    public ICollection<UserDebt> UserDebts { get; set; } = new List<UserDebt>();
    public ICollection<BankConnection> BankConnections { get; set; } = new List<BankConnection>();
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
    public ICollection<UserCategory> UserCategories { get; set; } = new List<UserCategory>();
    public ICollection<SpendingPlan> SpendingPlans { get; set; } = new List<SpendingPlan>();
    public ICollection<Goal> Goals { get; set; } = new List<Goal>();
    public ICollection<CategorizationRule> CategorizationRules { get; set; } = new List<CategorizationRule>();
}
