using Cactus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cactus.Infrastructure.Data.Configurations;

public class SpendingPlanConfiguration : IEntityTypeConfiguration<SpendingPlan>
{
    public void Configure(EntityTypeBuilder<SpendingPlan> builder)
    {
        builder.ToTable("spending_plans");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.UserId).HasColumnName("user_id");
        builder.Property(s => s.Year).HasColumnName("year");
        builder.Property(s => s.Month).HasColumnName("month");
        builder.Property(s => s.MonthlyIncome).HasColumnName("monthly_income").HasPrecision(18, 2);
        builder.Property(s => s.NeedsPercentage).HasColumnName("needs_percentage").HasPrecision(5, 2);
        builder.Property(s => s.WantsPercentage).HasColumnName("wants_percentage").HasPrecision(5, 2);
        builder.Property(s => s.GoalsPercentage).HasColumnName("goals_percentage").HasPrecision(5, 2);
        builder.Property(s => s.IsActive).HasColumnName("is_active");
        builder.Property(s => s.SecondaryIncomeSources)
            .HasColumnName("secondary_income_sources")
            .HasColumnType("text");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(s => s.User)
            .WithMany(u => u.SpendingPlans)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.UserId, s.Year, s.Month }).IsUnique();
    }
}

public class BudgetAllocationConfiguration : IEntityTypeConfiguration<BudgetAllocation>
{
    public void Configure(EntityTypeBuilder<BudgetAllocation> builder)
    {
        builder.ToTable("budget_allocations");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasColumnName("id");
        builder.Property(b => b.SpendingPlanId).HasColumnName("spending_plan_id");
        builder.Property(b => b.CategoryId).HasColumnName("category_id");
        builder.Property(b => b.AllocatedAmount).HasColumnName("allocated_amount").HasPrecision(18, 2);
        builder.Property(b => b.CreatedAt).HasColumnName("created_at");
        builder.Property(b => b.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(b => b.SpendingPlan)
            .WithMany(s => s.BudgetAllocations)
            .HasForeignKey(b => b.SpendingPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.Category)
            .WithMany()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(b => new { b.SpendingPlanId, b.CategoryId }).IsUnique();
    }
}

public class MonthlySummaryConfiguration : IEntityTypeConfiguration<MonthlySummary>
{
    public void Configure(EntityTypeBuilder<MonthlySummary> builder)
    {
        builder.ToTable("monthly_summaries");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.SpendingPlanId).HasColumnName("spending_plan_id");
        builder.Property(m => m.TotalIncome).HasColumnName("total_income").HasPrecision(18, 2);
        builder.Property(m => m.TotalExpenses).HasColumnName("total_expenses").HasPrecision(18, 2);
        builder.Property(m => m.NeedsSpent).HasColumnName("needs_spent").HasPrecision(18, 2);
        builder.Property(m => m.WantsSpent).HasColumnName("wants_spent").HasPrecision(18, 2);
        builder.Property(m => m.GoalsSpent).HasColumnName("goals_spent").HasPrecision(18, 2);
        builder.Property(m => m.Surplus).HasColumnName("surplus").HasPrecision(18, 2);
        builder.Property(m => m.CalculatedAt).HasColumnName("calculated_at");
        builder.Property(m => m.CreatedAt).HasColumnName("created_at");
        builder.Property(m => m.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(m => m.SpendingPlan)
            .WithOne(s => s.MonthlySummary)
            .HasForeignKey<MonthlySummary>(m => m.SpendingPlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
