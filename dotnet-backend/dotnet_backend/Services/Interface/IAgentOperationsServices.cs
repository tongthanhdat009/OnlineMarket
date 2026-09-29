using System.Threading.Channels;
using dotnet_backend.Dtos;
using dotnet_backend.Models;

namespace dotnet_backend.Services.Interface;

public interface IAdminChatSessionService
{
    Task<List<AdminChatSessionDto>> GetSessionsAsync(int userId, CancellationToken cancellationToken = default);
    Task<AdminChatSessionDto?> GetSessionAsync(int userId, int sessionId, CancellationToken cancellationToken = default);
    Task<bool> DeleteSessionAsync(int userId, int sessionId, CancellationToken cancellationToken = default);
    Task<AdminChatSessionContext?> PrepareChatAsync(int userId, AdminChatStreamRequestDto request, CancellationToken cancellationToken = default);
    Task SaveChatAsync(AdminChatSessionContext context, string assistantText, CancellationToken cancellationToken = default);
}

public interface IAgentRuntime
{
    Task<AgentRun> StartAsync(int userId, int? sessionId, string trigger, string input, CancellationToken cancellationToken);
    Task AddEventAsync(AgentRun run, string type, object? payload, CancellationToken cancellationToken);
    Task CompleteAsync(AgentRun run, string? output, CancellationToken cancellationToken);
    Task FailAsync(AgentRun run, string message, CancellationToken cancellationToken);
    Task CancelAsync(AgentRun run, CancellationToken cancellationToken);
    Task<AgentToolCall> StartToolCallAsync(AgentRun run, string toolName, string arguments, CancellationToken cancellationToken);
    Task CompleteToolCallAsync(AgentRun run, AgentToolCall call, object result, CancellationToken cancellationToken);
    Task FailToolCallAsync(AgentRun run, AgentToolCall call, string message, CancellationToken cancellationToken);
}

public interface IAgentActivityBroadcaster
{
    ChannelReader<AgentEventDto> Subscribe(out Guid subscriptionId);
    void Unsubscribe(Guid subscriptionId);
    void Publish(AgentEventDto item);
}

public interface IAgentOperationsService
{
    Task<PagedResultDto<AgentDto>> GetAgentsAsync(int page, int pageSize, CancellationToken cancellationToken);
    Task<AgentDto?> GetAgentAsync(int id, CancellationToken cancellationToken);
    Task<AgentDto> CreateAgentAsync(int userId, SaveAgentDto request, CancellationToken cancellationToken);
    Task<AgentDto?> UpdateAgentAsync(int id, SaveAgentDto request, CancellationToken cancellationToken);
    Task<AgentDto?> SetEnabledAsync(int id, bool enabled, CancellationToken cancellationToken);
    Task<AgentDto?> AssignToolsAsync(int id, IReadOnlyCollection<string> tools, CancellationToken cancellationToken);
    Task<PagedResultDto<AgentRunListItemDto>> GetRunsAsync(int page, int pageSize, int? agentId, string? status, string? trigger, int? userId, DateTime? from, DateTime? to, CancellationToken cancellationToken);
    Task<AgentRunDetailDto?> GetRunAsync(long id, CancellationToken cancellationToken);
    Task<PagedResultDto<AgentEventDto>> GetActivityAsync(int page, int pageSize, long? runId, int? agentId, string? type, string? level, string? tool, string? runStatus, DateTime? from, DateTime? to, CancellationToken cancellationToken);
    Task<List<AgentToolDto>> GetToolsAsync(CancellationToken cancellationToken);
    Task<AgentToolDto?> GetToolAsync(string name, CancellationToken cancellationToken);
    Task<AgentAnalyticsDto> GetAnalyticsAsync(DateTime? from, DateTime? to, CancellationToken cancellationToken);
    Task<PagedResultDto<AgentReportDto>> GetReportsAsync(int page, int pageSize, string? reportType, DateTime? from, DateTime? to, CancellationToken cancellationToken);
    Task<AgentReportDto?> GetReportAsync(long id, CancellationToken cancellationToken);
}

public interface IAgentReportService
{
    Task<AgentReportDto> GenerateSalesReportAsync(int userId, GenerateAgentReportDto request, CancellationToken cancellationToken);
    Task<byte[]?> GeneratePdfAsync(long reportId, CancellationToken cancellationToken);
}
