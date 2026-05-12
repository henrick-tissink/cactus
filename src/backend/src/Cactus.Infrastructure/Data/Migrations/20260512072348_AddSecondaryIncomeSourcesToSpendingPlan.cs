using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cactus.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSecondaryIncomeSourcesToSpendingPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "secondary_income_sources",
                table: "spending_plans",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "secondary_income_sources",
                table: "spending_plans");
        }
    }
}
