using Cactus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cactus.Infrastructure.Data.Configurations;

public class MacroCategoryConfiguration : IEntityTypeConfiguration<MacroCategory>
{
    public void Configure(EntityTypeBuilder<MacroCategory> builder)
    {
        builder.ToTable("macro_categories");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.Type).HasColumnName("type");
        builder.Property(m => m.Name).HasColumnName("name").HasMaxLength(50);
        builder.Property(m => m.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(m => m.DisplayOrder).HasColumnName("display_order");
        builder.Property(m => m.CreatedAt).HasColumnName("created_at");
        builder.Property(m => m.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(m => m.Type).IsUnique();
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.MacroCategoryId).HasColumnName("macro_category_id");
        builder.Property(c => c.Name).HasColumnName("name").HasMaxLength(100);
        builder.Property(c => c.Icon).HasColumnName("icon").HasMaxLength(50);
        builder.Property(c => c.DisplayOrder).HasColumnName("display_order");
        builder.Property(c => c.IsSystem).HasColumnName("is_system");
        builder.Property(c => c.CreatedAt).HasColumnName("created_at");
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(c => c.MacroCategory)
            .WithMany(m => m.Categories)
            .HasForeignKey(c => c.MacroCategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class UserCategoryConfiguration : IEntityTypeConfiguration<UserCategory>
{
    public void Configure(EntityTypeBuilder<UserCategory> builder)
    {
        builder.ToTable("user_categories");

        builder.HasKey(uc => uc.Id);
        builder.Property(uc => uc.Id).HasColumnName("id");
        builder.Property(uc => uc.UserId).HasColumnName("user_id");
        builder.Property(uc => uc.CategoryId).HasColumnName("category_id");
        builder.Property(uc => uc.IsHidden).HasColumnName("is_hidden");
        builder.Property(uc => uc.CustomDisplayOrder).HasColumnName("custom_display_order");
        builder.Property(uc => uc.CreatedAt).HasColumnName("created_at");
        builder.Property(uc => uc.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(uc => uc.User)
            .WithMany(u => u.UserCategories)
            .HasForeignKey(uc => uc.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(uc => uc.Category)
            .WithMany(c => c.UserCategories)
            .HasForeignKey(uc => uc.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(uc => new { uc.UserId, uc.CategoryId }).IsUnique();
    }
}

public class SubCategoryConfiguration : IEntityTypeConfiguration<SubCategory>
{
    public void Configure(EntityTypeBuilder<SubCategory> builder)
    {
        builder.ToTable("sub_categories");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.CategoryId).HasColumnName("category_id");
        builder.Property(s => s.UserId).HasColumnName("user_id");
        builder.Property(s => s.Name).HasColumnName("name").HasMaxLength(100);
        builder.Property(s => s.DisplayOrder).HasColumnName("display_order");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(s => s.Category)
            .WithMany(c => c.SubCategories)
            .HasForeignKey(s => s.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
