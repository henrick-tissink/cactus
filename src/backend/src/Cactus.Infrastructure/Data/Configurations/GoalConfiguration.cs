using Cactus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cactus.Infrastructure.Data.Configurations;

public class GoalConfiguration : IEntityTypeConfiguration<Goal>
{
    public void Configure(EntityTypeBuilder<Goal> builder)
    {
        builder.ToTable("goals");

        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasColumnName("id");
        builder.Property(g => g.UserId).HasColumnName("user_id");
        builder.Property(g => g.LinkedAccountId).HasColumnName("linked_account_id");
        builder.Property(g => g.LinkedDebtId).HasColumnName("linked_debt_id");
        builder.Property(g => g.Name).HasColumnName("name").HasMaxLength(200);
        builder.Property(g => g.GoalType).HasColumnName("goal_type");
        builder.Property(g => g.TargetAmount).HasColumnName("target_amount").HasPrecision(18, 2);
        builder.Property(g => g.CurrentAmount).HasColumnName("current_amount").HasPrecision(18, 2);
        builder.Property(g => g.TargetDate).HasColumnName("target_date");
        builder.Property(g => g.Priority).HasColumnName("priority");
        builder.Property(g => g.IsActive).HasColumnName("is_active");
        builder.Property(g => g.IsCompleted).HasColumnName("is_completed");
        builder.Property(g => g.CompletedAt).HasColumnName("completed_at");
        builder.Property(g => g.CreatedAt).HasColumnName("created_at");
        builder.Property(g => g.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(g => g.User)
            .WithMany(u => u.Goals)
            .HasForeignKey(g => g.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(g => g.LinkedAccount)
            .WithMany(a => a.LinkedGoals)
            .HasForeignKey(g => g.LinkedAccountId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(g => g.LinkedDebt)
            .WithMany(d => d.LinkedGoals)
            .HasForeignKey(g => g.LinkedDebtId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class GoalProgressConfiguration : IEntityTypeConfiguration<GoalProgress>
{
    public void Configure(EntityTypeBuilder<GoalProgress> builder)
    {
        builder.ToTable("goal_progress");

        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasColumnName("id");
        builder.Property(g => g.GoalId).HasColumnName("goal_id");
        builder.Property(g => g.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(g => g.RunningTotal).HasColumnName("running_total").HasPrecision(18, 2);
        builder.Property(g => g.Note).HasColumnName("note").HasMaxLength(500);
        builder.Property(g => g.RecordedAt).HasColumnName("recorded_at");
        builder.Property(g => g.CreatedAt).HasColumnName("created_at");
        builder.Property(g => g.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(g => g.Goal)
            .WithMany(goal => goal.Progress)
            .HasForeignKey(g => g.GoalId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(g => g.RecordedAt);
    }
}

public class GoalMilestoneConfiguration : IEntityTypeConfiguration<GoalMilestone>
{
    public void Configure(EntityTypeBuilder<GoalMilestone> builder)
    {
        builder.ToTable("goal_milestones");

        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasColumnName("id");
        builder.Property(g => g.GoalId).HasColumnName("goal_id");
        builder.Property(g => g.Name).HasColumnName("name").HasMaxLength(200);
        builder.Property(g => g.TargetAmount).HasColumnName("target_amount").HasPrecision(18, 2);
        builder.Property(g => g.IsReached).HasColumnName("is_reached");
        builder.Property(g => g.ReachedAt).HasColumnName("reached_at");
        builder.Property(g => g.CreatedAt).HasColumnName("created_at");
        builder.Property(g => g.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(g => g.Goal)
            .WithMany(goal => goal.Milestones)
            .HasForeignKey(g => g.GoalId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
