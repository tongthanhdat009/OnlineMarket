using System.Text.Json.Nodes;

namespace dotnet_backend.Dtos;

public sealed class AdminChatStreamRequestDto
{
    public int? SessionId { get; set; }
    public string Message { get; set; } = string.Empty;
}

public sealed class AdminChatSessionDto
{
    public int SessionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public int SummaryMessageCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ChatMessageDto> Messages { get; set; } = new();
}

public sealed class AdminChatSessionContext
{
    public int SessionId { get; set; }
    public int UserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<ChatMessageDto> History { get; set; } = new();
    public string? Summary { get; set; }
    public int SummaryMessageCount { get; set; }
}

public sealed class SalesReportQueryDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public string Grouping { get; set; } = "daily";
    public string? OrderType { get; set; }
}

public sealed class SalesReportDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public int CompletedPaidOrderCount { get; set; }
    public decimal Revenue { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal RefundAmount { get; set; }
    public List<SalesReportPointDto> Series { get; set; } = new();
}

public sealed class SalesReportPointDto
{
    public DateOnly Date { get; set; }
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
}

public sealed class AgentDto
{
    public int AgentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SystemInstructions { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public string Model { get; set; } = string.Empty;
    public decimal Temperature { get; set; }
    public int MaxToolRounds { get; set; }
    public List<string> Tools { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class SaveAgentDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SystemInstructions { get; set; } = string.Empty;
    // Kept for backward-compatible metadata writes. Runtime always resolves the model from backend configuration.
    public string? Model { get; set; }
    public decimal Temperature { get; set; } = 0.2m;
    public int MaxToolRounds { get; set; } = 3;
    public List<string>? Tools { get; set; }
}

public sealed class AssignAgentToolsDto
{
    public List<string> ToolNames { get; set; } = new();
}

public sealed class SetAgentEnabledDto
{
    public bool Enabled { get; set; }
}

public sealed class AgentToolDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Risk { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; }
    public bool Enabled { get; set; }
    public object Schema { get; set; } = new();
    public int UsageCount { get; set; }
    public int FailureCount { get; set; }
}

public class AgentRunListItemDto
{
    public long AgentRunId { get; set; }
    public int AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public int? SessionId { get; set; }
    public int? UserId { get; set; }
    public string Trigger { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ToolCallCount { get; set; }
    public string? ErrorMessage { get; set; }
}

public sealed class AgentRunDetailDto : AgentRunListItemDto
{
    public string? Input { get; set; }
    public string? Output { get; set; }
    public string? Model { get; set; }
    public List<AgentEventDto> Events { get; set; } = new();
    public List<AgentToolCallDto> ToolCalls { get; set; } = new();
}

public sealed class AgentEventDto
{
    public long AgentEventId { get; set; }
    public long AgentRunId { get; set; }
    public int Sequence { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int? DurationMs { get; set; }
    public string? Payload { get; set; }
    public int PayloadBytes { get; set; }
    public bool PayloadTruncated { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class AgentToolCallDto
{
    public long AgentToolCallId { get; set; }
    public long AgentRunId { get; set; }
    public string ToolName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Arguments { get; set; }
    public string? Result { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public sealed class AgentReportDto
{
    public long AgentReportId { get; set; }
    public long AgentRunId { get; set; }
    public long? AgentToolCallId { get; set; }
    public string ReportType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public string StructuredContent { get; set; } = string.Empty;
    public string Markdown { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public sealed class GenerateAgentReportDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public string? OrderType { get; set; }
}

public sealed class AgentAnalyticsDto
{
    public int AgentCount { get; set; }
    public int TotalRuns { get; set; }
    public int CompletedRuns { get; set; }
    public int FailedRuns { get; set; }
    public int CancelledRuns { get; set; }
    public int ToolCalls { get; set; }
    public int Reports { get; set; }
    public int RunningRuns { get; set; }
    public int TodayRuns { get; set; }
    public double SuccessRate { get; set; }
    public double AverageDurationMs { get; set; }
    public int TotalTokens { get; set; }
    public List<AgentRunListItemDto> RecentRuns { get; set; } = new();
    public List<AgentMetricDto> Agents { get; set; } = new();
    public List<ToolMetricDto> Tools { get; set; } = new();
    public List<RunTimeSeriesDto> TimeSeries { get; set; } = new();
}

public sealed class AgentMetricDto
{
    public int AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public int Runs { get; set; }
    public int Failed { get; set; }
}

public sealed class ToolMetricDto
{
    public string ToolName { get; set; } = string.Empty;
    public int Calls { get; set; }
    public int Failed { get; set; }
    public double AverageDurationMs { get; set; }
}

public sealed class RunTimeSeriesDto
{
    public DateOnly Date { get; set; }
    public int Runs { get; set; }
    public int Failed { get; set; }
}
