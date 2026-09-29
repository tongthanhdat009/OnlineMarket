namespace dotnet_backend.Models;

public partial class Agent
{
    public int AgentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SystemInstructions { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
    public string Model { get; set; } = string.Empty;
    public decimal Temperature { get; set; } = 0.2m;
    public int MaxToolRounds { get; set; } = 3;
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public virtual ICollection<AgentTool> Tools { get; set; } = new List<AgentTool>();
    public virtual ICollection<AgentRun> Runs { get; set; } = new List<AgentRun>();
}

public partial class AgentTool
{
    public int AgentId { get; set; }
    public string ToolName { get; set; } = string.Empty;
    public virtual Agent Agent { get; set; } = null!;
}

public partial class AgentRun
{
    public long AgentRunId { get; set; }
    public int AgentId { get; set; }
    public int? SessionId { get; set; }
    public int? UserId { get; set; }
    public string Trigger { get; set; } = string.Empty;
    public string Status { get; set; } = AgentRunStatus.Queued;
    public string? Input { get; set; }
    public string? Output { get; set; }
    public string? Model { get; set; }
    public string? SystemInstructions { get; set; }
    public decimal Temperature { get; set; }
    public int MaxToolRounds { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ToolCallCount { get; set; }
    public int? InputTokens { get; set; }
    public int? OutputTokens { get; set; }
    public string? ErrorMessage { get; set; }
    public virtual Agent Agent { get; set; } = null!;
    public virtual AdminChatSession? Session { get; set; }
    public virtual ICollection<AgentEvent> Events { get; set; } = new List<AgentEvent>();
    public virtual ICollection<AgentToolCall> ToolCalls { get; set; } = new List<AgentToolCall>();
    public virtual ICollection<AgentReport> Reports { get; set; } = new List<AgentReport>();
}

public partial class AgentEvent
{
    public long AgentEventId { get; set; }
    public long AgentRunId { get; set; }
    public int Sequence { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Level { get; set; } = "INFO";
    public string Message { get; set; } = string.Empty;
    public int? DurationMs { get; set; }
    public string? Payload { get; set; }
    public int PayloadBytes { get; set; }
    public bool PayloadTruncated { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public virtual AgentRun Run { get; set; } = null!;
}

public partial class AgentToolCall
{
    public long AgentToolCallId { get; set; }
    public long AgentRunId { get; set; }
    public string ToolName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Arguments { get; set; }
    public int ArgumentsBytes { get; set; }
    public bool ArgumentsTruncated { get; set; }
    public string? Result { get; set; }
    public int ResultBytes { get; set; }
    public bool ResultTruncated { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public virtual AgentRun Run { get; set; } = null!;
    public virtual ICollection<AgentReport> Reports { get; set; } = new List<AgentReport>();
}

public partial class AgentReport
{
    public long AgentReportId { get; set; }
    public long AgentRunId { get; set; }
    public long? AgentToolCallId { get; set; }
    public string ReportType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Severity { get; set; } = "INFO";
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public string StructuredContent { get; set; } = "{}";
    public string Markdown { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public virtual AgentRun Run { get; set; } = null!;
    public virtual AgentToolCall? ToolCall { get; set; }
}

public partial class AdminChatSession
{
    public int AdminChatSessionId { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public int SummaryMessageCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public virtual ICollection<AdminChatMessage> Messages { get; set; } = new List<AdminChatMessage>();
    public virtual ICollection<AgentRun> Runs { get; set; } = new List<AgentRun>();
}

public partial class AdminChatMessage
{
    public long AdminChatMessageId { get; set; }
    public int AdminChatSessionId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public virtual AdminChatSession Session { get; set; } = null!;
}

public static class AgentRunStatus
{
    public const string Queued = "QUEUED";
    public const string Running = "RUNNING";
    public const string WaitingTool = "WAITING_TOOL";
    public const string Completed = "COMPLETED";
    public const string Failed = "FAILED";
    public const string Cancelled = "CANCELLED";
    public static bool IsTerminal(string status) => status is Completed or Failed or Cancelled;
}

public static class AgentEventType
{
    public const string RunStarted = "RUN_STARTED";
    public const string ContextCreated = "CONTEXT_CREATED";
    public const string LlmRequestStarted = "LLM_REQUEST_STARTED";
    public const string LlmResponseReceived = "LLM_RESPONSE_RECEIVED";
    public const string ToolCallStarted = "TOOL_CALL_STARTED";
    public const string ToolCallCompleted = "TOOL_CALL_COMPLETED";
    public const string ToolCallFailed = "TOOL_CALL_FAILED";
    public const string ReportCreated = "REPORT_CREATED";
    public const string RunCompleted = "RUN_COMPLETED";
    public const string RunFailed = "RUN_FAILED";
    public const string RunCancelled = "RUN_CANCELLED";
}
