using Cactus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cactus.Infrastructure.Data.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("transactions");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");
        builder.Property(t => t.AccountId).HasColumnName("account_id");
        builder.Property(t => t.MacroCategoryId).HasColumnName("macro_category_id");
        builder.Property(t => t.CategoryId).HasColumnName("category_id");
        builder.Property(t => t.SubCategoryId).HasColumnName("sub_category_id");
        builder.Property(t => t.StitchTransactionId).HasColumnName("stitch_transaction_id").HasMaxLength(255);
        builder.Property(t => t.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(t => t.Type).HasColumnName("type");
        builder.Property(t => t.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(t => t.MerchantName).HasColumnName("merchant_name").HasMaxLength(200);
        builder.Property(t => t.TransactionDate).HasColumnName("transaction_date");
        builder.Property(t => t.PostedDate).HasColumnName("posted_date");
        builder.Property(t => t.IsClassified).HasColumnName("is_classified");
        builder.Property(t => t.IsManual).HasColumnName("is_manual");
        builder.Property(t => t.IsRecurring).HasColumnName("is_recurring");
        builder.Property(t => t.Notes).HasColumnName("notes").HasMaxLength(1000);
        builder.Property(t => t.CreatedAt).HasColumnName("created_at");
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(t => t.Account)
            .WithMany(a => a.Transactions)
            .HasForeignKey(t => t.AccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.MacroCategory)
            .WithMany()
            .HasForeignKey(t => t.MacroCategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.Category)
            .WithMany()
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.SubCategory)
            .WithMany()
            .HasForeignKey(t => t.SubCategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(t => t.StitchTransactionId);
        builder.HasIndex(t => t.TransactionDate);
        builder.HasIndex(t => t.IsClassified);
    }
}

public class RecurringPatternConfiguration : IEntityTypeConfiguration<RecurringPattern>
{
    public void Configure(EntityTypeBuilder<RecurringPattern> builder)
    {
        builder.ToTable("recurring_patterns");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id");
        builder.Property(r => r.TransactionId).HasColumnName("transaction_id");
        builder.Property(r => r.PatternDescription).HasColumnName("pattern_description").HasMaxLength(200);
        builder.Property(r => r.AverageAmount).HasColumnName("average_amount").HasPrecision(18, 2);
        builder.Property(r => r.FrequencyDays).HasColumnName("frequency_days");
        builder.Property(r => r.NextExpectedDate).HasColumnName("next_expected_date");
        builder.Property(r => r.CreatedAt).HasColumnName("created_at");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(r => r.Transaction)
            .WithOne(t => t.RecurringPattern)
            .HasForeignKey<RecurringPattern>(r => r.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CategorizationRuleConfiguration : IEntityTypeConfiguration<CategorizationRule>
{
    public void Configure(EntityTypeBuilder<CategorizationRule> builder)
    {
        builder.ToTable("categorization_rules");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.UserId).HasColumnName("user_id");
        builder.Property(c => c.MacroCategoryId).HasColumnName("macro_category_id");
        builder.Property(c => c.CategoryId).HasColumnName("category_id");
        builder.Property(c => c.SubCategoryId).HasColumnName("sub_category_id");
        builder.Property(c => c.Pattern).HasColumnName("pattern").HasMaxLength(500);
        builder.Property(c => c.MerchantPattern).HasColumnName("merchant_pattern").HasMaxLength(200);
        builder.Property(c => c.MatchCount).HasColumnName("match_count");
        builder.Property(c => c.ConfidenceScore).HasColumnName("confidence_score").HasPrecision(5, 2);
        builder.Property(c => c.IsActive).HasColumnName("is_active");
        builder.Property(c => c.CreatedAt).HasColumnName("created_at");
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(c => c.User)
            .WithMany(u => u.CategorizationRules)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.MacroCategory)
            .WithMany()
            .HasForeignKey(c => c.MacroCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Category)
            .WithMany()
            .HasForeignKey(c => c.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.SubCategory)
            .WithMany()
            .HasForeignKey(c => c.SubCategoryId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
