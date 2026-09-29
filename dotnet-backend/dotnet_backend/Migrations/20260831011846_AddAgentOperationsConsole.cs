using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace dotnet_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentOperationsConsole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The repository missed the historical Admin AI session migrations. The local DB can
            // therefore already contain the legacy table. Adapt it in place; never drop its data.
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS admin_chat_sessions (
                    admin_chat_session_id INT NOT NULL AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    title VARCHAR(120) NOT NULL,
                    summary TEXT NULL,
                    summary_message_count INT NOT NULL DEFAULT 0,
                    created_at DATETIME(6) NOT NULL,
                    updated_at DATETIME(6) NOT NULL,
                    messages_json LONGTEXT NULL,
                    agent_kind VARCHAR(20) NOT NULL DEFAULT 'chat',
                    CONSTRAINT PK_admin_chat_sessions PRIMARY KEY (admin_chat_session_id)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

                SET @has_legacy_session_id = (
                    SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = 'admin_chat_sessions'
                      AND column_name = 'session_id'
                );
                SET @rename_session_id_sql = IF(
                    @has_legacy_session_id > 0,
                    'ALTER TABLE admin_chat_sessions CHANGE COLUMN session_id admin_chat_session_id INT NOT NULL AUTO_INCREMENT',
                    'SELECT 1'
                );
                PREPARE rename_session_id FROM @rename_session_id_sql;
                EXECUTE rename_session_id;
                DEALLOCATE PREPARE rename_session_id;

                SET @has_messages_json = (
                    SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = 'admin_chat_sessions'
                      AND column_name = 'messages_json'
                );
                SET @add_messages_json_sql = IF(
                    @has_messages_json = 0,
                    'ALTER TABLE admin_chat_sessions ADD COLUMN messages_json LONGTEXT NULL',
                    'SELECT 1'
                );
                PREPARE add_messages_json FROM @add_messages_json_sql;
                EXECUTE add_messages_json;
                DEALLOCATE PREPARE add_messages_json;

                SET @messages_json_nullable = (
                    SELECT IS_NULLABLE = 'YES' FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = 'admin_chat_sessions'
                      AND column_name = 'messages_json'
                );
                SET @make_messages_json_nullable_sql = IF(
                    @messages_json_nullable = 0,
                    'ALTER TABLE admin_chat_sessions MODIFY COLUMN messages_json LONGTEXT NULL',
                    'SELECT 1'
                );
                PREPARE make_messages_json_nullable FROM @make_messages_json_nullable_sql;
                EXECUTE make_messages_json_nullable;
                DEALLOCATE PREPARE make_messages_json_nullable;

                SET @has_agent_kind = (
                    SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = 'admin_chat_sessions'
                      AND column_name = 'agent_kind'
                );
                SET @add_agent_kind_sql = IF(
                    @has_agent_kind = 0,
                    'ALTER TABLE admin_chat_sessions ADD COLUMN agent_kind VARCHAR(20) NOT NULL DEFAULT ''chat''',
                    'SELECT 1'
                );
                PREPARE add_agent_kind FROM @add_agent_kind_sql;
                EXECUTE add_agent_kind;
                DEALLOCATE PREPARE add_agent_kind;

                SET @has_session_index = (
                    SELECT COUNT(*) FROM information_schema.statistics
                    WHERE table_schema = DATABASE() AND table_name = 'admin_chat_sessions'
                      AND index_name = 'IX_admin_chat_sessions_user_id_updated_at'
                );
                SET @create_session_index_sql = IF(
                    @has_session_index = 0,
                    'CREATE INDEX IX_admin_chat_sessions_user_id_updated_at ON admin_chat_sessions (user_id, updated_at)',
                    'SELECT 1'
                );
                PREPARE create_session_index FROM @create_session_index_sql;
                EXECUTE create_session_index;
                DEALLOCATE PREPARE create_session_index;

                """);

            migrationBuilder.CreateTable(
                name: "agents",
                columns: table => new
                {
                    agent_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    system_instructions = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    enabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    model = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    temperature = table.Column<decimal>(type: "decimal(3,2)", precision: 3, scale: 2, nullable: false),
                    max_tool_rounds = table.Column<int>(type: "int", nullable: false),
                    created_by = table.Column<int>(type: "int", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agents", x => x.agent_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            // Historical Admin AI migrations may have created this table already.
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS admin_chat_messages (
                    admin_chat_message_id BIGINT NOT NULL AUTO_INCREMENT,
                    admin_chat_session_id INT NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    content TEXT NOT NULL,
                    created_at DATETIME(6) NOT NULL,
                    CONSTRAINT PK_admin_chat_messages PRIMARY KEY (admin_chat_message_id),
                    CONSTRAINT FK_admin_chat_messages_admin_chat_sessions_admin_chat_session_id
                        FOREIGN KEY (admin_chat_session_id) REFERENCES admin_chat_sessions(admin_chat_session_id)
                        ON DELETE CASCADE,
                    KEY IX_admin_chat_messages_session_message (admin_chat_session_id, admin_chat_message_id)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
                """);

            migrationBuilder.Sql("""
                INSERT INTO admin_chat_messages (admin_chat_session_id, role, content, created_at)
                SELECT s.admin_chat_session_id, j.role, j.content, s.created_at
                FROM admin_chat_sessions s
                JOIN JSON_TABLE(
                    IF(JSON_VALID(s.messages_json), s.messages_json, JSON_ARRAY()),
                    '$[*]' COLUMNS (
                        role VARCHAR(20) PATH '$.Role',
                        content TEXT PATH '$.Content'
                    )
                ) AS j
                LEFT JOIN admin_chat_messages existing
                    ON existing.admin_chat_session_id = s.admin_chat_session_id
                WHERE existing.admin_chat_message_id IS NULL;
                """);

            migrationBuilder.CreateTable(
                name: "agent_runs",
                columns: table => new
                {
                    agent_run_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    agent_id = table.Column<int>(type: "int", nullable: false),
                    session_id = table.Column<int>(type: "int", nullable: true),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    trigger = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    input = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    output = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    model = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    system_instructions = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    temperature = table.Column<decimal>(type: "decimal(3,2)", precision: 3, scale: 2, nullable: false),
                    max_tool_rounds = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    started_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    completed_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    tool_call_count = table.Column<int>(type: "int", nullable: false),
                    input_tokens = table.Column<int>(type: "int", nullable: true),
                    output_tokens = table.Column<int>(type: "int", nullable: true),
                    error_message = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_runs", x => x.agent_run_id);
                    table.ForeignKey(
                        name: "FK_agent_runs_admin_chat_sessions_session_id",
                        column: x => x.session_id,
                        principalTable: "admin_chat_sessions",
                        principalColumn: "admin_chat_session_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_agent_runs_agents_agent_id",
                        column: x => x.agent_id,
                        principalTable: "agents",
                        principalColumn: "agent_id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "agent_tools",
                columns: table => new
                {
                    agent_id = table.Column<int>(type: "int", nullable: false),
                    tool_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_tools", x => new { x.agent_id, x.tool_name });
                    table.ForeignKey(
                        name: "FK_agent_tools_agents_agent_id",
                        column: x => x.agent_id,
                        principalTable: "agents",
                        principalColumn: "agent_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "agent_events",
                columns: table => new
                {
                    agent_event_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    agent_run_id = table.Column<long>(type: "bigint", nullable: false),
                    sequence = table.Column<int>(type: "int", nullable: false),
                    type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    level = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    message = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    duration_ms = table.Column<int>(type: "int", nullable: true),
                    payload = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    payload_bytes = table.Column<int>(type: "int", nullable: false),
                    payload_truncated = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_events", x => x.agent_event_id);
                    table.ForeignKey(
                        name: "FK_agent_events_agent_runs_agent_run_id",
                        column: x => x.agent_run_id,
                        principalTable: "agent_runs",
                        principalColumn: "agent_run_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "agent_tool_calls",
                columns: table => new
                {
                    agent_tool_call_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    agent_run_id = table.Column<long>(type: "bigint", nullable: false),
                    tool_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    arguments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    arguments_bytes = table.Column<int>(type: "int", nullable: false),
                    arguments_truncated = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    result = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    result_bytes = table.Column<int>(type: "int", nullable: false),
                    result_truncated = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    error_message = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    started_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    completed_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_tool_calls", x => x.agent_tool_call_id);
                    table.ForeignKey(
                        name: "FK_agent_tool_calls_agent_runs_agent_run_id",
                        column: x => x.agent_run_id,
                        principalTable: "agent_runs",
                        principalColumn: "agent_run_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "agent_reports",
                columns: table => new
                {
                    agent_report_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    agent_run_id = table.Column<long>(type: "bigint", nullable: false),
                    agent_tool_call_id = table.Column<long>(type: "bigint", nullable: true),
                    report_type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    severity = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    from_date = table.Column<DateOnly>(type: "date", nullable: false),
                    to_date = table.Column<DateOnly>(type: "date", nullable: false),
                    structured_content = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    markdown = table.Column<string>(type: "longtext", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_reports", x => x.agent_report_id);
                    table.ForeignKey(
                        name: "FK_agent_reports_agent_runs_agent_run_id",
                        column: x => x.agent_run_id,
                        principalTable: "agent_runs",
                        principalColumn: "agent_run_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_agent_reports_agent_tool_calls_agent_tool_call_id",
                        column: x => x.agent_tool_call_id,
                        principalTable: "agent_tool_calls",
                        principalColumn: "agent_tool_call_id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.InsertData(
                table: "agents",
                columns: new[] { "agent_id", "created_at", "created_by", "description", "enabled", "max_tool_rounds", "model", "name", "system_instructions", "temperature", "updated_at" },
                values: new object[] { 1, new DateTime(2026, 8, 30, 0, 0, 0, 0, DateTimeKind.Utc), null, "Default read-only operations agent", true, 3, "openclaw/admin-agent-onlinemarket", "Admin Operations", "You are the OnlineMarket Admin Operations assistant. Use only allowed read-only tools. Never reveal secrets or personal data.", 0.2m, new DateTime(2026, 8, 30, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.Sql("""
                INSERT INTO permissions (action_key, description, permission_name)
                SELECT v.action_key, v.description, v.permission_name
                FROM (
                    SELECT 'admin_ai_chat' AS action_key, 'Compatibility permission for Admin AI chat.' AS description, 'Admin AI chat (legacy)' AS permission_name
                    UNION ALL SELECT 'agent_view', 'Xem cấu hình AI Agents.', 'Xem AI Agents'
                    UNION ALL SELECT 'agent_chat', 'Sử dụng AI Agent chat.', 'AI Agent chat'
                    UNION ALL SELECT 'agent_run_view', 'Xem lịch sử và chi tiết Agent runs.', 'Xem Agent runs'
                    UNION ALL SELECT 'agent_logs_view', 'Xem timeline và activity stream.', 'Xem Agent logs'
                    UNION ALL SELECT 'agent_report_view', 'Xem báo cáo AI đã lưu.', 'Xem Agent reports'
                    UNION ALL SELECT 'agent_report_generate', 'Tạo báo cáo AI có kiểm soát.', 'Tạo Agent reports'
                    UNION ALL SELECT 'agent_tool_view', 'Xem registry và usage của tools.', 'Xem Agent tools'
                    UNION ALL SELECT 'agent_tool_manage', 'Gán tools được kiểm soát cho AI Agents.', 'Quản lý Agent tools'
                    UNION ALL SELECT 'agent_manage', 'Tạo, sửa, bật và tắt AI Agents.', 'Quản lý AI Agents'
                    UNION ALL SELECT 'agent_analytics_view', 'Xem analytics vận hành AI.', 'Xem Agent analytics'
                ) AS v
                LEFT JOIN permissions p ON p.action_key = v.action_key
                WHERE p.permission_id IS NULL;
                """);

            migrationBuilder.InsertData(
                table: "agent_tools",
                columns: new[] { "agent_id", "tool_name" },
                values: new object[,]
                {
                    { 1, "get_order" },
                    { 1, "get_stock" },
                    { 1, "sales_summary" },
                    { 1, "search_inventory" },
                    { 1, "search_orders" },
                    { 1, "search_products" }
                });

            migrationBuilder.Sql("""
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT 1, p.permission_id
                FROM permissions p
                LEFT JOIN role_permissions rp
                    ON rp.role_id = 1 AND rp.permission_id = p.permission_id
                WHERE p.action_key IN (
                    'admin_ai_chat', 'agent_view', 'agent_chat', 'agent_run_view',
                    'agent_logs_view', 'agent_report_view', 'agent_report_generate',
                    'agent_tool_view', 'agent_tool_manage', 'agent_manage', 'agent_analytics_view'
                ) AND rp.permission_id IS NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_admin_chat_messages_admin_chat_session_id_admin_chat_message~",
                table: "admin_chat_messages",
                columns: new[] { "admin_chat_session_id", "admin_chat_message_id" });

            migrationBuilder.CreateIndex(
                name: "IX_agent_events_agent_run_id_sequence",
                table: "agent_events",
                columns: new[] { "agent_run_id", "sequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_agent_events_type_created_at",
                table: "agent_events",
                columns: new[] { "type", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_agent_reports_agent_run_id",
                table: "agent_reports",
                column: "agent_run_id");

            migrationBuilder.CreateIndex(
                name: "IX_agent_reports_agent_tool_call_id",
                table: "agent_reports",
                column: "agent_tool_call_id");

            migrationBuilder.CreateIndex(
                name: "IX_agent_reports_report_type_created_at",
                table: "agent_reports",
                columns: new[] { "report_type", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_agent_runs_agent_id_created_at",
                table: "agent_runs",
                columns: new[] { "agent_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_agent_runs_created_at_status",
                table: "agent_runs",
                columns: new[] { "created_at", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_agent_runs_session_id",
                table: "agent_runs",
                column: "session_id");

            migrationBuilder.CreateIndex(
                name: "IX_agent_tool_calls_agent_run_id",
                table: "agent_tool_calls",
                column: "agent_run_id");

            migrationBuilder.CreateIndex(
                name: "IX_agent_tool_calls_tool_name_started_at",
                table: "agent_tool_calls",
                columns: new[] { "tool_name", "started_at" });

            migrationBuilder.CreateIndex(
                name: "IX_agents_enabled_updated_at",
                table: "agents",
                columns: new[] { "enabled", "updated_at" });

            migrationBuilder.CreateIndex(
                name: "IX_agents_name",
                table: "agents",
                column: "name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_chat_messages");

            migrationBuilder.DropTable(
                name: "agent_events");

            migrationBuilder.DropTable(
                name: "agent_reports");

            migrationBuilder.DropTable(
                name: "agent_tools");

            migrationBuilder.DropTable(
                name: "agent_tool_calls");

            migrationBuilder.DropTable(
                name: "agent_runs");

            migrationBuilder.DropTable(
                name: "agents");

            // Permission rows may predate this migration. Never delete them during rollback.
        }
    }
}
