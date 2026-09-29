using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace dotnet_backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAdminAgentModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "agents",
                keyColumn: "agent_id",
                keyValue: 1,
                column: "model",
                value: "openclaw/admin-agent-onlinemarket");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "agents",
                keyColumn: "agent_id",
                keyValue: 1,
                column: "model",
                value: "openclaw/onlinemarket-admin");
        }
    }
}
