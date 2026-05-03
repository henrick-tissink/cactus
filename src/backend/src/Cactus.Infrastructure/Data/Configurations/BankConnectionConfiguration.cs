using Cactus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cactus.Infrastructure.Data.Configurations;

public class BankConnectionConfiguration : IEntityTypeConfiguration<BankConnection>
{
    public void Configure(EntityTypeBuilder<BankConnection> builder)
    {
        builder.ToTable("bank_connections");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasColumnName("id");
        builder.Property(b => b.UserId).HasColumnName("user_id");
        builder.Property(b => b.BankName).HasColumnName("bank_name").HasMaxLength(100);
        builder.Property(b => b.StitchConnectionId).HasColumnName("stitch_connection_id").HasMaxLength(255);
        builder.Property(b => b.IsActive).HasColumnName("is_active");
        builder.Property(b => b.LastSyncAt).HasColumnName("last_sync_at");
        builder.Property(b => b.RequiresReauthorizationAt).HasColumnName("requires_reauthorization_at");
        builder.Property(b => b.CreatedAt).HasColumnName("created_at");
        builder.Property(b => b.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(b => b.User)
            .WithMany(u => u.BankConnections)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => b.StitchConnectionId).IsUnique();
    }
}

public class StitchTokenConfiguration : IEntityTypeConfiguration<StitchToken>
{
    public void Configure(EntityTypeBuilder<StitchToken> builder)
    {
        builder.ToTable("stitch_tokens");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.BankConnectionId).HasColumnName("bank_connection_id");
        builder.Property(s => s.AccessTokenEncrypted).HasColumnName("access_token_encrypted");
        builder.Property(s => s.RefreshTokenEncrypted).HasColumnName("refresh_token_encrypted");
        builder.Property(s => s.AccessTokenExpiresAt).HasColumnName("access_token_expires_at");
        builder.Property(s => s.RefreshTokenExpiresAt).HasColumnName("refresh_token_expires_at");
        builder.Property(s => s.Scope).HasColumnName("scope").HasMaxLength(500);
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(s => s.BankConnection)
            .WithOne(b => b.StitchToken)
            .HasForeignKey<StitchToken>(s => s.BankConnectionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("accounts");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");
        builder.Property(a => a.UserId).HasColumnName("user_id");
        builder.Property(a => a.BankConnectionId).HasColumnName("bank_connection_id");
        builder.Property(a => a.Name).HasColumnName("name").HasMaxLength(200);
        builder.Property(a => a.AccountType).HasColumnName("account_type");
        builder.Property(a => a.StitchAccountId).HasColumnName("stitch_account_id").HasMaxLength(255);
        builder.Property(a => a.Balance).HasColumnName("balance").HasPrecision(18, 2);
        builder.Property(a => a.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(a => a.IsManual).HasColumnName("is_manual");
        builder.Property(a => a.IsActive).HasColumnName("is_active");
        builder.Property(a => a.LastBalanceUpdate).HasColumnName("last_balance_update");
        builder.Property(a => a.CreatedAt).HasColumnName("created_at");
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(a => a.User)
            .WithMany(u => u.Accounts)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.BankConnection)
            .WithMany(b => b.Accounts)
            .HasForeignKey(a => a.BankConnectionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.StitchAccountId);
    }
}

public class SyncHistoryConfiguration : IEntityTypeConfiguration<SyncHistory>
{
    public void Configure(EntityTypeBuilder<SyncHistory> builder)
    {
        builder.ToTable("sync_history");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.BankConnectionId).HasColumnName("bank_connection_id");
        builder.Property(s => s.Status).HasColumnName("status");
        builder.Property(s => s.StartedAt).HasColumnName("started_at");
        builder.Property(s => s.CompletedAt).HasColumnName("completed_at");
        builder.Property(s => s.TransactionsSynced).HasColumnName("transactions_synced");
        builder.Property(s => s.ErrorMessage).HasColumnName("error_message");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(s => s.BankConnection)
            .WithMany(b => b.SyncHistory)
            .HasForeignKey(s => s.BankConnectionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
