using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Services;

public sealed class AgentOperationsService : IAgentOperationsService
{
    private readonly ApplicationDbContext _context;
    public AgentOperationsService(ApplicationDbContext context) => _context = context;

    public async Task<PagedResultDto<AgentDto>> GetAgentsAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        NormalizePage(ref page, ref pageSize);
        var query = _context.Agents.AsNoTracking();
        return new PagedResultDto<AgentDto>
        {
            TotalCount = await query.CountAsync(cancellationToken),
            Page = page,
            PageSize = pageSize,
            Items = await query.Include(x => x.Tools).OrderBy(x => x.Name)
                .Skip((page - 1) * pageSize).Take(pageSize).Select(x => MapAgent(x)).ToListAsync(cancellationToken)
        };
    }
    public async Task<AgentDto?> GetAgentAsync(int id, CancellationToken cancellationToken)
    {
        var item = await _context.Agents.AsNoTracking().Include(x => x.Tools).SingleOrDefaultAsync(x => x.AgentId == id, cancellationToken);
        return item == null ? null : MapAgent(item);
    }
    public async Task<AgentDto> CreateAgentAsync(int userId, SaveAgentDto request, CancellationToken cancellationToken)
    {
        ValidateAgent(request);
        var item = new Agent { Name = request.Name.Trim(), Description = request.Description?.Trim(), SystemInstructions = request.SystemInstructions.Trim(), Model = request.Model?.Trim() ?? string.Empty, Temperature = request.Temperature, MaxToolRounds = request.MaxToolRounds, CreatedBy = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow, Tools = (request.Tools ?? new()).Distinct().Select(x => new AgentTool { ToolName = x }).ToList() };
        _context.Agents.Add(item); await _context.SaveChangesAsync(cancellationToken); return MapAgent(item);
    }
    public async Task<AgentDto?> UpdateAgentAsync(int id, SaveAgentDto request, CancellationToken cancellationToken)
    {
        ValidateAgent(request); var item = await _context.Agents.Include(x => x.Tools).SingleOrDefaultAsync(x => x.AgentId == id, cancellationToken); if (item == null) return null;
        item.Name = request.Name.Trim(); item.Description = request.Description?.Trim(); item.SystemInstructions = request.SystemInstructions.Trim(); item.Model = request.Model?.Trim() ?? string.Empty; item.Temperature = request.Temperature; item.MaxToolRounds = request.MaxToolRounds; item.UpdatedAt = DateTime.UtcNow;
        if (request.Tools != null) { _context.AgentTools.RemoveRange(item.Tools); item.Tools = request.Tools.Distinct().Select(x => new AgentTool { AgentId = id, ToolName = x }).ToList(); }
        await _context.SaveChangesAsync(cancellationToken); return MapAgent(item);
    }
    public async Task<AgentDto?> SetEnabledAsync(int id, bool enabled, CancellationToken cancellationToken)
    {
        var item = await _context.Agents.Include(x => x.Tools).SingleOrDefaultAsync(x => x.AgentId == id, cancellationToken); if (item == null) return null; item.Enabled = enabled; item.UpdatedAt = DateTime.UtcNow; await _context.SaveChangesAsync(cancellationToken); return MapAgent(item);
    }

    public async Task<AgentDto?> AssignToolsAsync(int id, IReadOnlyCollection<string> tools, CancellationToken cancellationToken)
    {
        if (tools.Any(x => !AdminAiToolRegistry.IsAllowed(x))) throw new ArgumentException("Agent contains an unknown or disabled tool.");
        var item = await _context.Agents.Include(x => x.Tools).SingleOrDefaultAsync(x => x.AgentId == id, cancellationToken); if (item == null) return null;
        _context.AgentTools.RemoveRange(item.Tools); item.Tools = tools.Distinct().Select(x => new AgentTool { AgentId = id, ToolName = x }).ToList(); item.UpdatedAt = DateTime.UtcNow; await _context.SaveChangesAsync(cancellationToken); return MapAgent(item);
    }

    public async Task<PagedResultDto<AgentRunListItemDto>> GetRunsAsync(int page, int pageSize, int? agentId, string? status, string? trigger, int? userId, DateTime? from, DateTime? to, CancellationToken cancellationToken)
    {
        NormalizePage(ref page, ref pageSize); IQueryable<AgentRun> query = _context.AgentRuns.AsNoTracking().Include(x => x.Agent);
        if (agentId.HasValue) query = query.Where(x => x.AgentId == agentId); if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status); if (!string.IsNullOrWhiteSpace(trigger)) query = query.Where(x => x.Trigger == trigger); if (userId.HasValue) query = query.Where(x => x.UserId == userId); if (from.HasValue) query = query.Where(x => x.CreatedAt >= from); if (to.HasValue) query = query.Where(x => x.CreatedAt < to);
        return new PagedResultDto<AgentRunListItemDto> { TotalCount = await query.CountAsync(cancellationToken), Page = page, PageSize = pageSize, Items = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.AgentRunId).Skip((page - 1) * pageSize).Take(pageSize).Select(x => MapRun(x)).ToListAsync(cancellationToken) };
    }
    public async Task<AgentRunDetailDto?> GetRunAsync(long id, CancellationToken cancellationToken)
    {
        var run = await _context.AgentRuns.AsNoTracking().Include(x => x.Agent).Include(x => x.Events).Include(x => x.ToolCalls).SingleOrDefaultAsync(x => x.AgentRunId == id, cancellationToken); if (run == null) return null;
        return new AgentRunDetailDto { AgentRunId = run.AgentRunId, AgentId = run.AgentId, AgentName = run.Agent.Name, SessionId = run.SessionId, UserId = run.UserId, Trigger = run.Trigger, Status = run.Status, Input = run.Input, Output = run.Output, Model = run.Model, InputTokens = run.InputTokens, OutputTokens = run.OutputTokens, CreatedAt = run.CreatedAt, StartedAt = run.StartedAt, CompletedAt = run.CompletedAt, ToolCallCount = run.ToolCallCount, ErrorMessage = run.ErrorMessage, Events = run.Events.OrderBy(x => x.Sequence).Select(MapEvent).ToList(), ToolCalls = run.ToolCalls.OrderBy(x => x.StartedAt).Select(MapToolCall).ToList() };
    }
    public async Task<PagedResultDto<AgentEventDto>> GetActivityAsync(int page, int pageSize, long? runId, int? agentId, string? type, string? level, string? tool, string? runStatus, DateTime? from, DateTime? to, CancellationToken cancellationToken)
    {
        NormalizePage(ref page, ref pageSize); var query = _context.AgentEvents.AsNoTracking(); if (runId.HasValue) query = query.Where(x => x.AgentRunId == runId); if (agentId.HasValue) query = query.Where(x => x.Run.AgentId == agentId); if (!string.IsNullOrWhiteSpace(type)) query = query.Where(x => x.Type == type); if (!string.IsNullOrWhiteSpace(level)) query = query.Where(x => x.Level == level); if (!string.IsNullOrWhiteSpace(tool)) query = query.Where(x => x.Run.ToolCalls.Any(y => y.ToolName == tool)); if (!string.IsNullOrWhiteSpace(runStatus)) query = query.Where(x => x.Run.Status == runStatus); if (from.HasValue) query = query.Where(x => x.CreatedAt >= from); if (to.HasValue) query = query.Where(x => x.CreatedAt < to);
        return new PagedResultDto<AgentEventDto> { TotalCount = await query.CountAsync(cancellationToken), Page = page, PageSize = pageSize, Items = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.AgentEventId).Skip((page - 1) * pageSize).Take(pageSize).Select(x => MapEvent(x)).ToListAsync(cancellationToken) };
    }
    public async Task<List<AgentToolDto>> GetToolsAsync(CancellationToken cancellationToken)
    {
        var usage = await _context.AgentToolCalls.AsNoTracking().GroupBy(x => x.ToolName).Select(x => new { Name = x.Key, Count = x.Count(), Failed = x.Count(y => y.Status == "FAILED") }).ToDictionaryAsync(x => x.Name, cancellationToken);
        return AdminAiToolRegistry.Definitions.Values.OrderBy(x => x.Name).Select(x => new AgentToolDto { Name = x.Name, Description = x.Description, Category = x.Category, Version = x.Version, Risk = x.Risk, TimeoutSeconds = x.TimeoutSeconds, Enabled = x.Enabled, Schema = x.Declaration, UsageCount = usage.GetValueOrDefault(x.Name)?.Count ?? 0, FailureCount = usage.GetValueOrDefault(x.Name)?.Failed ?? 0 }).ToList();
    }
    public async Task<AgentToolDto?> GetToolAsync(string name, CancellationToken cancellationToken) => (await GetToolsAsync(cancellationToken)).SingleOrDefault(x => x.Name == name);
    public async Task<AgentAnalyticsDto> GetAnalyticsAsync(DateTime? from, DateTime? to, CancellationToken cancellationToken)
    {
        from ??= DateTime.UtcNow.AddDays(-30);
        var runs = _context.AgentRuns.AsNoTracking(); var calls = _context.AgentToolCalls.AsNoTracking(); var reports = _context.AgentReports.AsNoTracking(); if (from.HasValue) { runs = runs.Where(x => x.CreatedAt >= from); calls = calls.Where(x => x.StartedAt >= from); reports = reports.Where(x => x.CreatedAt >= from); } if (to.HasValue) { runs = runs.Where(x => x.CreatedAt < to); calls = calls.Where(x => x.StartedAt < to); reports = reports.Where(x => x.CreatedAt < to); }
        var runRows = await runs.Select(x => new { x.AgentRunId, x.AgentId, AgentName = x.Agent.Name, x.SessionId, x.UserId, x.Trigger, x.Status, x.CreatedAt, x.StartedAt, x.CompletedAt, x.ToolCallCount, x.ErrorMessage, x.InputTokens, x.OutputTokens }).ToListAsync(cancellationToken); var callRows = await calls.Select(x => new { x.ToolName, x.Status, x.StartedAt, x.CompletedAt }).ToListAsync(cancellationToken);
        return new AgentAnalyticsDto { AgentCount = await _context.Agents.CountAsync(cancellationToken), TotalRuns = runRows.Count, CompletedRuns = runRows.Count(x => x.Status == AgentRunStatus.Completed), FailedRuns = runRows.Count(x => x.Status == AgentRunStatus.Failed), CancelledRuns = runRows.Count(x => x.Status == AgentRunStatus.Cancelled), RunningRuns = runRows.Count(x => !AgentRunStatus.IsTerminal(x.Status)), TodayRuns = runRows.Count(x => x.CreatedAt.Date == DateTime.UtcNow.Date), SuccessRate = runRows.Count == 0 ? 0 : 100.0 * runRows.Count(x => x.Status == AgentRunStatus.Completed) / runRows.Count, AverageDurationMs = runRows.Where(x => x.StartedAt.HasValue && x.CompletedAt.HasValue).Select(x => (x.CompletedAt!.Value - x.StartedAt!.Value).TotalMilliseconds).DefaultIfEmpty().Average(), TotalTokens = runRows.Sum(x => (x.InputTokens ?? 0) + (x.OutputTokens ?? 0)), RecentRuns = runRows.OrderByDescending(x => x.CreatedAt).Take(10).Select(x => new AgentRunListItemDto { AgentRunId = x.AgentRunId, AgentId = x.AgentId, AgentName = x.AgentName, SessionId = x.SessionId, UserId = x.UserId, Trigger = x.Trigger, Status = x.Status, CreatedAt = x.CreatedAt, StartedAt = x.StartedAt, CompletedAt = x.CompletedAt, ToolCallCount = x.ToolCallCount, ErrorMessage = x.ErrorMessage }).ToList(), ToolCalls = callRows.Count, Reports = await reports.CountAsync(cancellationToken), Agents = runRows.GroupBy(x => new { x.AgentId, x.AgentName }).Select(x => new AgentMetricDto { AgentId = x.Key.AgentId, AgentName = x.Key.AgentName, Runs = x.Count(), Failed = x.Count(y => y.Status == AgentRunStatus.Failed) }).OrderByDescending(x => x.Runs).ToList(), Tools = callRows.GroupBy(x => x.ToolName).Select(x => new ToolMetricDto { ToolName = x.Key, Calls = x.Count(), Failed = x.Count(y => y.Status == "FAILED"), AverageDurationMs = x.Where(y => y.CompletedAt.HasValue).Select(y => (y.CompletedAt!.Value - y.StartedAt).TotalMilliseconds).DefaultIfEmpty().Average() }).OrderByDescending(x => x.Calls).ToList(), TimeSeries = runRows.GroupBy(x => DateOnly.FromDateTime(x.CreatedAt)).OrderBy(x => x.Key).Select(x => new RunTimeSeriesDto { Date = x.Key, Runs = x.Count(), Failed = x.Count(y => y.Status == AgentRunStatus.Failed) }).ToList() };
    }
    public async Task<PagedResultDto<AgentReportDto>> GetReportsAsync(int page, int pageSize, string? reportType, DateTime? from, DateTime? to, CancellationToken cancellationToken)
    {
        NormalizePage(ref page, ref pageSize); var query = _context.AgentReports.AsNoTracking(); if (!string.IsNullOrWhiteSpace(reportType)) query = query.Where(x => x.ReportType == reportType); if (from.HasValue) query = query.Where(x => x.CreatedAt >= from); if (to.HasValue) query = query.Where(x => x.CreatedAt < to); return new PagedResultDto<AgentReportDto> { TotalCount = await query.CountAsync(cancellationToken), Page = page, PageSize = pageSize, Items = await query.OrderByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).Select(x => MapReport(x)).ToListAsync(cancellationToken) };
    }
    public async Task<AgentReportDto?> GetReportAsync(long id, CancellationToken cancellationToken) { var item = await _context.AgentReports.AsNoTracking().SingleOrDefaultAsync(x => x.AgentReportId == id, cancellationToken); return item == null ? null : MapReport(item); }

    private static void ValidateAgent(SaveAgentDto x) { if (string.IsNullOrWhiteSpace(x.Name) || x.Name.Length > 100 || string.IsNullOrWhiteSpace(x.SystemInstructions) || x.SystemInstructions.Length > 8000 || (x.Model?.Length ?? 0) > 150 || x.Temperature is < 0 or > 2 || x.MaxToolRounds is < 1 or > 10) throw new ArgumentException("Invalid Agent configuration."); if (x.Tools?.Any(y => !AdminAiToolRegistry.IsAllowed(y)) == true) throw new ArgumentException("Agent contains an unknown or disabled tool."); }
    private static void NormalizePage(ref int page, ref int size) { page = Math.Max(1, page); size = Math.Clamp(size, 1, 100); }
    private static AgentDto MapAgent(Agent x) => new() { AgentId = x.AgentId, Name = x.Name, Description = x.Description, SystemInstructions = x.SystemInstructions, Enabled = x.Enabled, Model = x.Model, Temperature = x.Temperature, MaxToolRounds = x.MaxToolRounds, Tools = x.Tools.Select(y => y.ToolName).OrderBy(y => y).ToList(), CreatedAt = x.CreatedAt, UpdatedAt = x.UpdatedAt };
    private static AgentRunListItemDto MapRun(AgentRun x) => new() { AgentRunId = x.AgentRunId, AgentId = x.AgentId, AgentName = x.Agent.Name, SessionId = x.SessionId, UserId = x.UserId, Trigger = x.Trigger, Status = x.Status, CreatedAt = x.CreatedAt, StartedAt = x.StartedAt, CompletedAt = x.CompletedAt, ToolCallCount = x.ToolCallCount, ErrorMessage = x.ErrorMessage };
    private static AgentEventDto MapEvent(AgentEvent x) => new() { AgentEventId = x.AgentEventId, AgentRunId = x.AgentRunId, Sequence = x.Sequence, Type = x.Type, Level = x.Level, Message = x.Message, DurationMs = x.DurationMs, Payload = x.Payload, PayloadBytes = x.PayloadBytes, PayloadTruncated = x.PayloadTruncated, CreatedAt = x.CreatedAt };
    private static AgentToolCallDto MapToolCall(AgentToolCall x) => new() { AgentToolCallId = x.AgentToolCallId, AgentRunId = x.AgentRunId, ToolName = x.ToolName, Status = x.Status, Arguments = x.Arguments, Result = x.Result, ErrorMessage = x.ErrorMessage, StartedAt = x.StartedAt, CompletedAt = x.CompletedAt };
    internal static AgentReportDto MapReport(AgentReport x) => new() { AgentReportId = x.AgentReportId, AgentRunId = x.AgentRunId, AgentToolCallId = x.AgentToolCallId, ReportType = x.ReportType, Title = x.Title, Severity = x.Severity, From = x.From, To = x.To, StructuredContent = x.StructuredContent, Markdown = x.Markdown, CreatedAt = x.CreatedAt };
}
