using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cactus.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetAndEmailVerificationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerificationTokenExpiresAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailVerificationTokenHash",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetTokenExpiresAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetTokenHash",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "debt_type",
                table: "user_debts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsPrimary",
                table: "goals",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailVerificationTokenExpiresAt",
                table: "users");

            migrationBuilder.DropColumn(
                name: "EmailVerificationTokenHash",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "users");

            migrationBuilder.DropColumn(
                name: "PasswordResetTokenExpiresAt",
                table: "users");

            migrationBuilder.DropColumn(
                name: "PasswordResetTokenHash",
                table: "users");

            migrationBuilder.DropColumn(
                name: "debt_type",
                table: "user_debts");

            migrationBuilder.DropColumn(
                name: "IsPrimary",
                table: "goals");
        }
    }
}
