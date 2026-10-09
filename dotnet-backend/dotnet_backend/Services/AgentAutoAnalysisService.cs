using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Services;

public sealed class AgentAutoAnalysisService : IAgentAutoAnalysisService
{
    private static DateTime? _lastRunAt;
    private static string? _lastStatus;
    private static long? _lastRunId;
    private static long? _lastReportId;
    private static string? _lastError;
    private static readonly SemaphoreSlim _gate = new(1, 1);

    private readonly IServiceScopeFactory _scopes;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AgentAutoAnalysisService> _logger;

    public AgentAutoAnalysisService(IServiceScopeFactory scopes, IConfiguration configuration, ILogger<AgentAutoAnalysisService> logger)
    {
        _scopes = scopes;
        _configuration = configuration;
        _logger = logger;
    }

    public AgentAutoAnalysisStatusDto GetStatus() => new()
    {
        Enabled = ResolveBool("AgentAutoAnalysis:Enabled", "AGENT_AUTO_ANALYSIS_ENABLED", true),
        IntervalSeconds = ResolveInt("AgentAutoAnalysis:IntervalSeconds", "AGENT_AUTO_ANALYSIS_INTERVAL_SECONDS", 30),
        LookbackSeconds = ResolveInt("AgentAutoAnalysis:LookbackSeconds", "AGENT_AUTO_ANALYSIS_LOOKBACK_SECONDS", 300),
        LastRunAt = _lastRunAt,
        LastStatus = _lastStatus,
        LastRunId = _lastRunId,
        LastReportId = _lastReportId,
        LastError = _lastError,
    };

    public async Task<AgentReportDto?> RunOnceAsync(CancellationToken cancellationToken)
    {
        if (!GetStatus().Enabled) return null;
        if (!await _gate.WaitAsync(0, cancellationToken)) return null;
        try
        {
            using var scope = _scopes.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var runtime = scope.ServiceProvider.GetRequiredService<IAgentRuntime>();
            var factory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();

            var lookbackSeconds = GetStatus().LookbackSeconds;
            var since = DateTime.UtcNow.AddSeconds(-Math.Clamp(lookbackSeconds, 30, 3600));

            var overlapping = await context.AgentRuns.AsNoTracking()
                .Where(x => x.Trigger == "AUTO_ANALYSIS" && (x.Status == AgentRunStatus.Running || x.Status == AgentRunStatus.WaitingTool || x.Status == AgentRunStatus.Queued))
                .AnyAsync(cancellationToken);
            if (overlapping) return null;

            var userMessages = await context.AdminChatMessages.AsNoTracking()
                .Where(x => x.CreatedAt >= since && x.Role == "user")
                .OrderBy(x => x.CreatedAt)
                .Take(30)
                .Select(x => new { x.AdminChatMessageId, x.AdminChatSessionId, x.Role, x.Content, x.CreatedAt })
                .ToListAsync(cancellationToken);
            var recentEvents = await context.AgentEvents.AsNoTracking()
                .Where(x => x.CreatedAt >= since)
                .OrderByDescending(x => x.CreatedAt)
                .Take(60)
                .Select(x => new { x.Type, x.Level, x.Message, x.AgentRunId, x.CreatedAt })
                .ToListAsync(cancellationToken);
            var recentToolCalls = await context.AgentToolCalls.AsNoTracking()
                .Where(x => x.StartedAt >= since)
                .OrderByDescending(x => x.StartedAt)
                .Take(30)
                .Select(x => new { x.ToolName, x.Status, x.AgentRunId, x.ErrorMessage, x.StartedAt })
                .ToListAsync(cancellationToken);
            var recentRuns = await context.AgentRuns.AsNoTracking()
                .Where(x => x.CreatedAt >= since)
                .OrderByDescending(x => x.CreatedAt)
                .Take(20)
                .Select(x => new { x.AgentRunId, x.Trigger, x.Status, x.ToolCallCount, x.ErrorMessage, x.CreatedAt })
                .ToListAsync(cancellationToken);

            if (userMessages.Count == 0 && recentEvents.Count == 0 && recentToolCalls.Count == 0 && recentRuns.Count == 0)
            {
                _lastRunAt = DateTime.UtcNow;
                _lastStatus = "SKIPPED_EMPTY";
                return null;
            }

            var systemUserId = await context.Users.AsNoTracking()
                .Where(x => x.Role == 1 || x.Role == 2)
                .OrderBy(x => x.UserId)
                .Select(x => x.UserId)
                .FirstOrDefaultAsync(cancellationToken);
            if (systemUserId == 0) systemUserId = 1;

            var inputSummary = JsonSerializer.Serialize(new
            {
                window_seconds = (int)(DateTime.UtcNow - since).TotalSeconds,
                user_messages = userMessages.Count,
                events = recentEvents.Count,
                tool_calls = recentToolCalls.Count,
                runs = recentRuns.Count,
            });
            var run = await runtime.StartAsync(systemUserId, null, "AUTO_ANALYSIS", inputSummary, cancellationToken);
            _lastRunId = run.AgentRunId;
            try
            {
                await runtime.AddEventAsync(run, AgentEventType.ContextCreated, new
                {
                    user_messages = userMessages.Select(x => new { session = x.AdminChatSessionId, at = x.CreatedAt, text = Truncate(x.Content, 500) }),
                    runs = recentRuns,
                    tool_calls = recentToolCalls,
                    events = recentEvents.GroupBy(x => x.Type).Select(g => new { type = g.Key, count = g.Count() }),
                }, cancellationToken);

                var baseUrl = GetSetting("BaseUrl", "OPENAI_BASE_URL");
                var apiKey = GetSetting("ApiKey", "OPENAI_API_KEY");
                var model = AiModelSettings.ResolveModel(_configuration);
                if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(model))
                    throw new InvalidOperationException("OpenAI is not configured for auto analysis.");

                var prompt = BuildPrompt(since, userMessages.Select(x => (x.CreatedAt, $"[session {x.AdminChatSessionId}] {x.Content}")),
                    recentRuns.Select(x => $"run {x.AgentRunId} {x.Trigger} {x.Status} tools={x.ToolCallCount} {x.ErrorMessage}"),
                    recentToolCalls.Select(x => $"{x.ToolName} {x.Status} run={x.AgentRunId} {x.ErrorMessage}"),
                    recentEvents.GroupBy(x => x.Type).Select(g => $"{g.Key} x{g.Count()}"));
                await runtime.AddEventAsync(run, AgentEventType.LlmRequestStarted, new { model }, cancellationToken);
                var markdown = await CallLlmAsync(factory, baseUrl!, apiKey!, model!, prompt, cancellationToken);
                await runtime.AddEventAsync(run, AgentEventType.LlmResponseReceived, new { chars = markdown.Length }, cancellationToken);

                var severity = recentToolCalls.Any(x => x.Status == "FAILED") || recentRuns.Any(x => x.Status == AgentRunStatus.Failed) ? "MEDIUM" : "INFO";
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var structured = JsonSerializer.Serialize(new
                {
                    summary = $"Auto analysis of last {(int)(DateTime.UtcNow - since).TotalSeconds}s: {userMessages.Count} user messages, {recentEvents.Count} events, {recentToolCalls.Count} tool calls.",
                    metrics = new { user_messages = userMessages.Count, events = recentEvents.Count, tool_calls = recentToolCalls.Count, runs = recentRuns.Count, failed_runs = recentRuns.Count(x => x.Status == AgentRunStatus.Failed), failed_tools = recentToolCalls.Count(x => x.Status == "FAILED") },
                    findings = recentRuns.Where(x => x.Status == AgentRunStatus.Failed).Take(5).Select(x => $"Run {x.AgentRunId} failed: {x.ErrorMessage}").ToList(),
                    related = new { run_id = run.AgentRunId, window_from = since, window_to = DateTime.UtcNow },
                    severity,
                });
                var report = new AgentReport
                {
                    AgentRunId = run.AgentRunId,
                    ReportType = "OPS_ANALYSIS",
                    Title = $"Auto ops analysis {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC",
                    Severity = severity,
                    From = today,
                    To = today.AddDays(1),
                    StructuredContent = structured,
                    Markdown = markdown,
                    CreatedAt = DateTime.UtcNow,
                };
                context.AgentReports.Add(report);
                await context.SaveChangesAsync(cancellationToken);
                await runtime.AddEventAsync(run, AgentEventType.ReportCreated, new { report.AgentReportId, report.ReportType }, cancellationToken);
                await runtime.CompleteAsync(run, JsonSerializer.Serialize(new { report.AgentReportId }), cancellationToken);

                _lastRunAt = DateTime.UtcNow;
                _lastStatus = "COMPLETED";
                _lastReportId = report.AgentReportId;
                _lastError = null;
                return AgentOperationsService.MapReport(report);
            }
            catch (Exception ex)
            {
                await runtime.FailAsync(run, ex.Message, CancellationToken.None);
                _lastRunAt = DateTime.UtcNow;
                _lastStatus = "FAILED";
                _lastError = AgentPayloadSanitizer.SafeError(ex.Message);
                _logger.LogWarning(ex, "Agent auto analysis failed");
                return null;
            }
        }
        finally
        {
            _gate.Release();
        }
    }

    private static string BuildPrompt(DateTime since, IEnumerable<(DateTime At, string Text)> users, IEnumerable<string> runs, IEnumerable<string> tools, IEnumerable<string> eventGroups)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Bạn là trợ lý giám sát vận hành OnlineMarket. Phân tích cửa sổ từ {since:yyyy-MM-dd HH:mm:ss} UTC đến nay (chuỗi sự kiện người dùng → LLM).");
        sb.AppendLine("Chỉ dùng dữ liệu dưới đây, không bịa. Trả lời tiếng Việt bằng Markdown với các mục: Tóm tắt, Sự kiện người dùng, Hoạt động LLM/Tool, Vấn đề, Đề xuất (tối đa 5 gạch đầu dòng mỗi mục).");
        sb.AppendLine("\n## Tin nhắn người dùng");
        foreach (var (at, text) in users.Take(30)) sb.AppendLine($"- [{at:HH:mm:ss}] {Truncate(text, 300)}");
        sb.AppendLine("\n## Runs");
        foreach (var line in runs.Take(20)) sb.AppendLine($"- {Truncate(line, 240)}");
        sb.AppendLine("\n## Tool calls");
        foreach (var line in tools.Take(30)) sb.AppendLine($"- {Truncate(line, 240)}");
        sb.AppendLine("\n## Nhóm sự kiện");
        foreach (var line in eventGroups.Take(30)) sb.AppendLine($"- {line}");
        return sb.ToString();
    }

    private async Task<string> CallLlmAsync(IHttpClientFactory factory, string baseUrl, string apiKey, string model, string prompt, CancellationToken cancellationToken)
    {
        var client = factory.CreateClient("openai");
        var body = new
        {
            model,
            messages = new[]
            {
                new { role = "system", content = "Bạn là bộ phận phân tích vận hành. Chỉ trả về báo cáo Markdown tiếng Việt, ngắn gọn, dựa trên dữ liệu." },
                new { role = "user", content = prompt },
            },
            temperature = 0.2,
            stream = false,
        };
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl.TrimEnd('/')}/chat/completions")
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"),
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(120));
        using var response = await client.SendAsync(request, cts.Token);
        var json = await response.Content.ReadAsStringAsync(cts.Token);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Auto analysis LLM returned {Status}", response.StatusCode);
            throw new HttpRequestException($"Auto analysis LLM returned {(int)response.StatusCode}.");
        }
        try
        {
            var parsed = JsonSerializer.Deserialize<OpenAiChatResponse>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            var text = parsed?.Choices?.FirstOrDefault()?.Message?.Content?.Trim();
            if (string.IsNullOrWhiteSpace(text)) throw new InvalidDataException("Auto analysis LLM returned empty content.");
            return text.Length <= 8000 ? text : text[..8000];
        }
        catch (JsonException ex)
        {
            throw new InvalidDataException("Auto analysis LLM returned malformed JSON.", ex);
        }
    }

    private string? GetSetting(string name, string envName)
    {
        return _configuration[$"OpenAI:{name}"]
            ?? _configuration[$"OpenAI__{name}"]
            ?? _configuration[envName]
            ?? Environment.GetEnvironmentVariable(envName)
            ?? Environment.GetEnvironmentVariable($"OpenAI__{name}");
    }

    private bool ResolveBool(string key, string env, bool fallback)
    {
        var raw = _configuration[key] ?? Environment.GetEnvironmentVariable(env);
        return bool.TryParse(raw, out var value) ? value : fallback;
    }

    private int ResolveInt(string key, string env, int fallback)
    {
        var raw = _configuration[key] ?? Environment.GetEnvironmentVariable(env);
        return int.TryParse(raw, out var value) && value > 0 ? value : fallback;
    }

    private static string Truncate(string value, int max)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        var oneLine = value.Replace('\r', ' ').Replace('\n', ' ').Trim();
        return oneLine.Length <= max ? oneLine : oneLine[..max];
    }

    private sealed class OpenAiChatResponse
    {
        [JsonPropertyName("choices")] public List<OpenAiChatChoice>? Choices { get; set; }
    }

    private sealed class OpenAiChatChoice
    {
        [JsonPropertyName("message")] public OpenAiChatMessage? Message { get; set; }
    }

    private sealed class OpenAiChatMessage
    {
        [JsonPropertyName("content")] public string? Content { get; set; }
    }
}

public sealed class AgentAutoAnalysisWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AgentAutoAnalysisWorker> _logger;

    public AgentAutoAnalysisWorker(IServiceProvider services, IConfiguration configuration, ILogger<AgentAutoAnalysisWorker> logger)
    {
        _services = services;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var firstDelay = TimeSpan.FromSeconds(10);
        try { await Task.Delay(firstDelay, stoppingToken); }
        catch (OperationCanceledException) { return; }
        while (!stoppingToken.IsCancellationRequested)
        {
            var interval = ResolveInterval();
            try
            {
                using var scope = _services.CreateScope();
                var svc = scope.ServiceProvider.GetRequiredService<IAgentAutoAnalysisService>();
                if (svc.GetStatus().Enabled) await svc.RunOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { _logger.LogWarning(ex, "Agent auto analysis tick failed"); }
            try { await Task.Delay(interval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private TimeSpan ResolveInterval()
    {
        var raw = _configuration["AgentAutoAnalysis:IntervalSeconds"] ?? Environment.GetEnvironmentVariable("AGENT_AUTO_ANALYSIS_INTERVAL_SECONDS");
        var seconds = int.TryParse(raw, out var value) && value >= 10 ? value : 30;
        return TimeSpan.FromSeconds(seconds);
    }
}
