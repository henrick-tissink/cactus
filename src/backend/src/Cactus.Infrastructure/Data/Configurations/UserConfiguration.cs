using Cactus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cactus.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        builder.Property(u => u.PasswordHash).HasColumnName("password_hash").IsRequired();
        builder.Property(u => u.FirstName).HasColumnName("first_name").HasMaxLength(100);
        builder.Property(u => u.LastName).HasColumnName("last_name").HasMaxLength(100);
        builder.Property(u => u.IsOnboardingComplete).HasColumnName("is_onboarding_complete");
        builder.Property(u => u.LastLoginAt).HasColumnName("last_login_at");
        builder.Property(u => u.CreatedAt).HasColumnName("created_at");
        builder.Property(u => u.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(u => u.Email).IsUnique();
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id");
        builder.Property(r => r.UserId).HasColumnName("user_id");
        builder.Property(r => r.Token).HasColumnName("token").IsRequired();
        builder.Property(r => r.ExpiresAt).HasColumnName("expires_at");
        builder.Property(r => r.IsRevoked).HasColumnName("is_revoked");
        builder.Property(r => r.RevokedReason).HasColumnName("revoked_reason");
        builder.Property(r => r.RevokedAt).HasColumnName("revoked_at");
        builder.Property(r => r.ReplacedByToken).HasColumnName("replaced_by_token");
        builder.Property(r => r.CreatedAt).HasColumnName("created_at");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(r => r.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => r.Token).IsUnique();
    }
}

public class OnboardingResponseConfiguration : IEntityTypeConfiguration<OnboardingResponse>
{
    public void Configure(EntityTypeBuilder<OnboardingResponse> builder)
    {
        builder.ToTable("onboarding_responses");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).HasColumnName("id");
        builder.Property(o => o.UserId).HasColumnName("user_id");
        builder.Property(o => o.StepNumber).HasColumnName("step_number");
        builder.Property(o => o.StepName).HasColumnName("step_name").HasMaxLength(100);
        builder.Property(o => o.Response).HasColumnName("response").HasColumnType("text");
        builder.Property(o => o.CreatedAt).HasColumnName("created_at");
        builder.Property(o => o.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(o => o.User)
            .WithMany(u => u.OnboardingResponses)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => new { o.UserId, o.StepNumber }).IsUnique();
    }
}

public class UserDebtConfiguration : IEntityTypeConfiguration<UserDebt>
{
    public void Configure(EntityTypeBuilder<UserDebt> builder)
    {
        builder.ToTable("user_debts");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id");
        builder.Property(d => d.UserId).HasColumnName("user_id");
        builder.Property(d => d.DebtType).HasColumnName("debt_type").HasConversion<int>();
        builder.Property(d => d.Name).HasColumnName("name").HasMaxLength(200);
        builder.Property(d => d.OriginalAmount).HasColumnName("original_amount").HasPrecision(18, 2);
        builder.Property(d => d.CurrentBalance).HasColumnName("current_balance").HasPrecision(18, 2);
        builder.Property(d => d.InterestRate).HasColumnName("interest_rate").HasPrecision(5, 2);
        builder.Property(d => d.MinimumPayment).HasColumnName("minimum_payment").HasPrecision(18, 2);
        builder.Property(d => d.IsActive).HasColumnName("is_active");
        builder.Property(d => d.CreatedAt).HasColumnName("created_at");
        builder.Property(d => d.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(d => d.User)
            .WithMany(u => u.UserDebts)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
