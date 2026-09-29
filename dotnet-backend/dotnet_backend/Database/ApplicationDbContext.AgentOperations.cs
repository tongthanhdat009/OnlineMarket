using dotnet_backend.Models;
using dotnet_backend.Services;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Database;

public partial class ApplicationDbContext
{
    public virtual DbSet<Agent> Agents { get; set; }
    public virtual DbSet<AgentTool> AgentTools { get; set; }
    public virtual DbSet<AgentRun> AgentRuns { get; set; }
    public virtual DbSet<AgentEvent> AgentEvents { get; set; }
    public virtual DbSet<AgentToolCall> AgentToolCalls { get; set; }
    public virtual DbSet<AgentReport> AgentReports { get; set; }
    public virtual DbSet<AdminChatSession> AdminChatSessions { get; set; }
    public virtual DbSet<AdminChatMessage> AdminChatMessages { get; set; }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Agent>(entity =>
        {
            entity.ToTable("agents"); entity.HasKey(x => x.AgentId); entity.HasIndex(x => x.Name).IsUnique(); entity.HasIndex(x => new { x.Enabled, x.UpdatedAt });
            entity.Property(x => x.AgentId).HasColumnName("agent_id"); entity.Property(x => x.Name).HasMaxLength(100).HasColumnName("name"); entity.Property(x => x.Description).HasColumnType("text").HasColumnName("description"); entity.Property(x => x.SystemInstructions).HasColumnType("text").HasColumnName("system_instructions");
            entity.Property(x => x.Enabled).HasColumnName("enabled"); entity.Property(x => x.Model).HasMaxLength(150).HasColumnName("model"); entity.Property(x => x.Temperature).HasPrecision(3, 2).HasColumnName("temperature");
            entity.Property(x => x.MaxToolRounds).HasColumnName("max_tool_rounds"); entity.Property(x => x.CreatedBy).HasColumnName("created_by"); entity.Property(x => x.CreatedAt).HasColumnType("datetime(6)").HasColumnName("created_at"); entity.Property(x => x.UpdatedAt).HasColumnType("datetime(6)").HasColumnName("updated_at");
        });
        modelBuilder.Entity<AgentTool>(entity =>
        {
            entity.ToTable("agent_tools"); entity.HasKey(x => new { x.AgentId, x.ToolName }); entity.Property(x => x.AgentId).HasColumnName("agent_id"); entity.Property(x => x.ToolName).HasMaxLength(100).HasColumnName("tool_name");
            entity.HasOne(x => x.Agent).WithMany(x => x.Tools).HasForeignKey(x => x.AgentId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<AdminChatSession>(entity =>
        {
            entity.ToTable("admin_chat_sessions"); entity.HasKey(x => x.AdminChatSessionId); entity.HasIndex(x => new { x.UserId, x.UpdatedAt });
            entity.Property(x => x.AdminChatSessionId).HasColumnName("admin_chat_session_id"); entity.Property(x => x.UserId).HasColumnName("user_id"); entity.Property(x => x.Title).HasMaxLength(120).HasColumnName("title"); entity.Property(x => x.Summary).HasColumnType("text").HasColumnName("summary"); entity.Property(x => x.SummaryMessageCount).HasColumnName("summary_message_count"); entity.Property(x => x.CreatedAt).HasColumnType("datetime(6)").HasColumnName("created_at"); entity.Property(x => x.UpdatedAt).HasColumnType("datetime(6)").HasColumnName("updated_at");
        });
        modelBuilder.Entity<AdminChatMessage>(entity =>
        {
            entity.ToTable("admin_chat_messages"); entity.HasKey(x => x.AdminChatMessageId); entity.HasIndex(x => new { x.AdminChatSessionId, x.AdminChatMessageId });
            entity.Property(x => x.AdminChatMessageId).HasColumnName("admin_chat_message_id"); entity.Property(x => x.AdminChatSessionId).HasColumnName("admin_chat_session_id"); entity.Property(x => x.Role).HasMaxLength(20).HasColumnName("role"); entity.Property(x => x.Content).HasColumnType("text").HasColumnName("content"); entity.Property(x => x.CreatedAt).HasColumnType("datetime(6)").HasColumnName("created_at");
            entity.HasOne(x => x.Session).WithMany(x => x.Messages).HasForeignKey(x => x.AdminChatSessionId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<AgentRun>(entity =>
        {
            entity.ToTable("agent_runs"); entity.HasKey(x => x.AgentRunId); entity.HasIndex(x => new { x.CreatedAt, x.Status }); entity.HasIndex(x => new { x.AgentId, x.CreatedAt }); entity.HasIndex(x => x.SessionId);
            entity.Property(x => x.AgentRunId).HasColumnName("agent_run_id"); entity.Property(x => x.AgentId).HasColumnName("agent_id"); entity.Property(x => x.SessionId).HasColumnName("session_id"); entity.Property(x => x.UserId).HasColumnName("user_id"); entity.Property(x => x.Trigger).HasMaxLength(30).HasColumnName("trigger"); entity.Property(x => x.Status).HasMaxLength(20).HasColumnName("status"); entity.Property(x => x.Input).HasColumnType("text").HasColumnName("input"); entity.Property(x => x.Output).HasColumnType("text").HasColumnName("output"); entity.Property(x => x.Model).HasMaxLength(150).HasColumnName("model"); entity.Property(x => x.SystemInstructions).HasColumnType("text").HasColumnName("system_instructions"); entity.Property(x => x.Temperature).HasPrecision(3, 2).HasColumnName("temperature"); entity.Property(x => x.MaxToolRounds).HasColumnName("max_tool_rounds"); entity.Property(x => x.CreatedAt).HasColumnType("datetime(6)").HasColumnName("created_at"); entity.Property(x => x.StartedAt).HasColumnType("datetime(6)").HasColumnName("started_at"); entity.Property(x => x.CompletedAt).HasColumnType("datetime(6)").HasColumnName("completed_at"); entity.Property(x => x.ToolCallCount).HasColumnName("tool_call_count"); entity.Property(x => x.InputTokens).HasColumnName("input_tokens"); entity.Property(x => x.OutputTokens).HasColumnName("output_tokens"); entity.Property(x => x.ErrorMessage).HasMaxLength(500).HasColumnName("error_message");
            entity.HasOne(x => x.Agent).WithMany(x => x.Runs).HasForeignKey(x => x.AgentId).OnDelete(DeleteBehavior.Restrict); entity.HasOne(x => x.Session).WithMany(x => x.Runs).HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.SetNull);
        });
        modelBuilder.Entity<AgentEvent>(entity =>
        {
            entity.ToTable("agent_events"); entity.HasKey(x => x.AgentEventId); entity.HasIndex(x => new { x.AgentRunId, x.Sequence }).IsUnique(); entity.HasIndex(x => new { x.Type, x.CreatedAt });
            entity.Property(x => x.AgentEventId).HasColumnName("agent_event_id"); entity.Property(x => x.AgentRunId).HasColumnName("agent_run_id"); entity.Property(x => x.Sequence).HasColumnName("sequence"); entity.Property(x => x.Type).HasMaxLength(50).HasColumnName("type"); entity.Property(x => x.Level).HasMaxLength(20).HasColumnName("level"); entity.Property(x => x.Message).HasMaxLength(500).HasColumnName("message"); entity.Property(x => x.DurationMs).HasColumnName("duration_ms"); entity.Property(x => x.Payload).HasColumnType("text").HasColumnName("payload"); entity.Property(x => x.PayloadBytes).HasColumnName("payload_bytes"); entity.Property(x => x.PayloadTruncated).HasColumnName("payload_truncated"); entity.Property(x => x.CreatedAt).HasColumnType("datetime(6)").HasColumnName("created_at"); entity.HasOne(x => x.Run).WithMany(x => x.Events).HasForeignKey(x => x.AgentRunId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<AgentToolCall>(entity =>
        {
            entity.ToTable("agent_tool_calls"); entity.HasKey(x => x.AgentToolCallId); entity.HasIndex(x => new { x.ToolName, x.StartedAt }); entity.HasIndex(x => x.AgentRunId);
            entity.Property(x => x.AgentToolCallId).HasColumnName("agent_tool_call_id"); entity.Property(x => x.AgentRunId).HasColumnName("agent_run_id"); entity.Property(x => x.ToolName).HasMaxLength(100).HasColumnName("tool_name"); entity.Property(x => x.Status).HasMaxLength(20).HasColumnName("status"); entity.Property(x => x.Arguments).HasColumnType("text").HasColumnName("arguments"); entity.Property(x => x.ArgumentsBytes).HasColumnName("arguments_bytes"); entity.Property(x => x.ArgumentsTruncated).HasColumnName("arguments_truncated"); entity.Property(x => x.Result).HasColumnType("text").HasColumnName("result"); entity.Property(x => x.ResultBytes).HasColumnName("result_bytes"); entity.Property(x => x.ResultTruncated).HasColumnName("result_truncated"); entity.Property(x => x.ErrorMessage).HasMaxLength(500).HasColumnName("error_message"); entity.Property(x => x.StartedAt).HasColumnType("datetime(6)").HasColumnName("started_at"); entity.Property(x => x.CompletedAt).HasColumnType("datetime(6)").HasColumnName("completed_at"); entity.HasOne(x => x.Run).WithMany(x => x.ToolCalls).HasForeignKey(x => x.AgentRunId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<AgentReport>(entity =>
        {
            entity.ToTable("agent_reports"); entity.HasKey(x => x.AgentReportId); entity.HasIndex(x => new { x.ReportType, x.CreatedAt }); entity.HasIndex(x => x.AgentRunId);
            entity.Property(x => x.AgentReportId).HasColumnName("agent_report_id"); entity.Property(x => x.AgentRunId).HasColumnName("agent_run_id"); entity.Property(x => x.AgentToolCallId).HasColumnName("agent_tool_call_id"); entity.Property(x => x.ReportType).HasMaxLength(50).HasColumnName("report_type"); entity.Property(x => x.Title).HasMaxLength(200).HasColumnName("title"); entity.Property(x => x.Severity).HasMaxLength(20).HasColumnName("severity"); entity.Property(x => x.From).HasColumnType("date").HasColumnName("from_date"); entity.Property(x => x.To).HasColumnType("date").HasColumnName("to_date"); entity.Property(x => x.StructuredContent).HasColumnType("json").HasColumnName("structured_content"); entity.Property(x => x.Markdown).HasColumnType("longtext").HasColumnName("markdown"); entity.Property(x => x.CreatedAt).HasColumnType("datetime(6)").HasColumnName("created_at"); entity.HasOne(x => x.Run).WithMany(x => x.Reports).HasForeignKey(x => x.AgentRunId).OnDelete(DeleteBehavior.Restrict); entity.HasOne(x => x.ToolCall).WithMany(x => x.Reports).HasForeignKey(x => x.AgentToolCallId).OnDelete(DeleteBehavior.SetNull);
        });

        var created = new DateTime(2026, 8, 30, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<Agent>().HasData(new Agent { AgentId = 1, Name = "Admin Operations", Description = "Default read-only operations agent", SystemInstructions = "You are the OnlineMarket Admin Operations assistant. Use only allowed read-only tools. Never reveal secrets or personal data.", Enabled = true, Model = "openclaw/admin-agent-onlinemarket", Temperature = 0.2m, MaxToolRounds = 3, CreatedAt = created, UpdatedAt = created });
        modelBuilder.Entity<AgentTool>().HasData(AdminAiToolRegistry.Names.Select(name => new AgentTool { AgentId = 1, ToolName = name }));
    }
}
