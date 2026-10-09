using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Threading.Channels;
using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Services;

public readonly record struct SanitizedPayload(string Value, int OriginalBytes, bool Truncated);

public static partial class AgentPayloadSanitizer
{
    public const int MaxBytes = 8 * 1024;

    public static SanitizedPayload Sanitize(object? payload)
    {
        var json = payload is string text ? NormalizeJson(text) : JsonSerializer.Serialize(payload);
        JsonNode? node;
        try { node = JsonNode.Parse(json); }
        catch (JsonException) { node = JsonValue.Create(json); }
        node = Redact(node);
        var sanitized = node?.ToJsonString() ?? "null";
        var originalBytes = Encoding.UTF8.GetByteCount(sanitized);
        if (originalBytes <= MaxBytes) return new(sanitized, originalBytes, false);
        var previewBytes = MaxBytes - 64;
        string envelope;
        do
        {
            envelope = JsonSerializer.Serialize(new { Truncated = true, Preview = TruncateUtf8(sanitized, previewBytes) });
            previewBytes -= Math.Max(1, Encoding.UTF8.GetByteCount(envelope) - MaxBytes);
        } while (Encoding.UTF8.GetByteCount(envelope) > MaxBytes);
        return new(envelope, originalBytes, true);
    }

    public static string SafeError(string? message)
    {
        if (string.IsNullOrWhiteSpace(message)) return "Operation failed.";
        var line = message.Split('\n', '\r')[0];
        line = SensitiveValue().Replace(line, "[REDACTED]");
        return line[..Math.Min(500, line.Length)];
    }

    private static string TruncateUtf8(string value, int maxBytes)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        if (bytes.Length <= maxBytes) return value;
        var length = maxBytes;
        while (length > 0 && (bytes[length] & 0xC0) == 0x80) length--;
        return Encoding.UTF8.GetString(bytes, 0, length);
    }

    private static string NormalizeJson(string value)
    {
        try { JsonNode.Parse(value); return value; }
        catch (JsonException) { return JsonSerializer.Serialize(value); }
    }

    private static JsonNode? Redact(JsonNode? node)
    {
        if (node is JsonObject obj)
        {
            foreach (var item in obj.ToList())
            {
                obj.Remove(item.Key);
                obj[item.Key] = SecretKey().IsMatch(item.Key) ? JsonValue.Create("[REDACTED]") : Redact(item.Value?.DeepClone());
            }
        }
        else if (node is JsonArray array)
        {
            for (var i = 0; i < array.Count; i++) array[i] = Redact(array[i]?.DeepClone());
        }
        else if (node is JsonValue value && value.TryGetValue<string>(out var text))
        {
            return JsonValue.Create(SensitiveValue().Replace(text, "[REDACTED]"));
        }
        return node;
    }

    [GeneratedRegex("authorization|token|password|secret|api[_-]?key|aws|vnpay|email.*(pass|credential)", RegexOptions.IgnoreCase)]
    private static partial Regex SecretKey();

    [GeneratedRegex(@"(?i)(?:bearer\s+[A-Za-z0-9._~+/=-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:password|secret|token|api[_-]?key)\s*[:=]\s*[^\s,;]+)")]
    private static partial Regex SensitiveValue();
}

/// <summary>
/// Resolves the single OpenAI-compatible model used by customer chat and admin agents.
/// The environment/configuration value is the source of truth; the Agent.Model column is metadata only.
/// </summary>
internal static class AiModelSettings
{
    public static string? ResolveModel(IConfiguration configuration)
    {
        var candidates = new[]
        {
            configuration["OpenAI:Model"],
            configuration["OpenAI__Model"],
            configuration["OPENAI_MODEL"],
            Environment.GetEnvironmentVariable("OpenAI__Model"),
            Environment.GetEnvironmentVariable("OPENAI_MODEL")
        };

        return candidates.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();
    }
}

public sealed class AgentActivityBroadcaster : IAgentActivityBroadcaster
{
    private readonly ConcurrentDictionary<Guid, Channel<AgentEventDto>> _subscriptions = new();
    public ChannelReader<AgentEventDto> Subscribe(out Guid id)
    {
        id = Guid.NewGuid();
        var channel = Channel.CreateBounded<AgentEventDto>(new BoundedChannelOptions(100) { FullMode = BoundedChannelFullMode.DropOldest });
        _subscriptions[id] = channel;
        return channel.Reader;
    }
    public void Unsubscribe(Guid id) { if (_subscriptions.TryRemove(id, out var channel)) channel.Writer.TryComplete(); }
    public void Publish(AgentEventDto item) { foreach (var channel in _subscriptions.Values) channel.Writer.TryWrite(item); }
}

public sealed class AgentRuntime : IAgentRuntime
{
    private readonly ApplicationDbContext _context;
    private readonly IAgentActivityBroadcaster _broadcaster;
    private readonly IConfiguration _configuration;

    public AgentRuntime(ApplicationDbContext context, IAgentActivityBroadcaster broadcaster, IConfiguration configuration)
    {
        _context = context;
        _broadcaster = broadcaster;
        _configuration = configuration;
    }

    public async Task<AgentRun> StartAsync(int userId, int? sessionId, string trigger, string input, CancellationToken cancellationToken)
    {
        var agent = await _context.Agents.Include(x => x.Tools).OrderBy(x => x.AgentId).FirstOrDefaultAsync(x => x.Enabled, cancellationToken)
            ?? throw new InvalidOperationException("No enabled Admin Agent is configured.");
        var model = AiModelSettings.ResolveModel(_configuration)
            ?? throw new InvalidOperationException("OpenAI model is not configured. Set OpenAI__Model or OPENAI_MODEL.");
        var safe = AgentPayloadSanitizer.Sanitize(input);
        var run = new AgentRun { AgentId = agent.AgentId, UserId = userId, SessionId = sessionId, Trigger = trigger, Status = AgentRunStatus.Running, Input = safe.Value, Model = model, SystemInstructions = agent.SystemInstructions, Temperature = agent.Temperature, MaxToolRounds = agent.MaxToolRounds, CreatedAt = DateTime.UtcNow, StartedAt = DateTime.UtcNow };
        _context.AgentRuns.Add(run);
        await _context.SaveChangesAsync(cancellationToken);
        await AddEventAsync(run, AgentEventType.RunStarted, new { trigger, userId, sessionId }, cancellationToken);
        return run;
    }

    public async Task AddEventAsync(AgentRun run, string type, object? payload, CancellationToken cancellationToken)
    {
        var safe = AgentPayloadSanitizer.Sanitize(payload);
        var sequence = await _context.AgentEvents.Where(x => x.AgentRunId == run.AgentRunId).MaxAsync(x => (int?)x.Sequence, cancellationToken) ?? 0;
        var evt = new AgentEvent { AgentRunId = run.AgentRunId, Sequence = sequence + 1, Type = type, Level = type.Contains("FAILED") ? "ERROR" : "INFO", Message = type.Replace('_', ' ').ToLowerInvariant(), Payload = safe.Value, PayloadBytes = safe.OriginalBytes, PayloadTruncated = safe.Truncated, CreatedAt = DateTime.UtcNow };
        _context.AgentEvents.Add(evt);
        await _context.SaveChangesAsync(cancellationToken);
        _broadcaster.Publish(Map(evt));
    }

    public Task CompleteAsync(AgentRun run, string? output, CancellationToken cancellationToken) => FinishAsync(run, AgentRunStatus.Completed, output, null, AgentEventType.RunCompleted, cancellationToken);
    public Task FailAsync(AgentRun run, string message, CancellationToken cancellationToken) => FinishAsync(run, AgentRunStatus.Failed, null, AgentPayloadSanitizer.SafeError(message), AgentEventType.RunFailed, cancellationToken);
    public Task CancelAsync(AgentRun run, CancellationToken cancellationToken) => FinishAsync(run, AgentRunStatus.Cancelled, null, "Client disconnected.", AgentEventType.RunCancelled, cancellationToken);

    private async Task FinishAsync(AgentRun run, string status, string? output, string? error, string eventType, CancellationToken cancellationToken)
    {
        if (AgentRunStatus.IsTerminal(run.Status)) return;
        run.Status = status;
        run.Output = output == null ? null : AgentPayloadSanitizer.Sanitize(output).Value;
        run.ErrorMessage = error;
        run.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        await AddEventAsync(run, eventType, error == null ? new { status } : new { status, error }, cancellationToken);
    }

    public async Task<AgentToolCall> StartToolCallAsync(AgentRun run, string toolName, string arguments, CancellationToken cancellationToken)
    {
        var allowed = await _context.AgentTools.AnyAsync(x => x.AgentId == run.AgentId && x.ToolName == toolName, cancellationToken);
        if (!allowed || !AdminAiToolRegistry.IsAllowed(toolName)) throw new UnauthorizedAccessException("Tool is not allowed for this Agent.");
        var safe = AgentPayloadSanitizer.Sanitize(arguments);
        var call = new AgentToolCall { AgentRunId = run.AgentRunId, ToolName = toolName, Status = "RUNNING", Arguments = safe.Value, ArgumentsBytes = safe.OriginalBytes, ArgumentsTruncated = safe.Truncated, StartedAt = DateTime.UtcNow };
        run.Status = AgentRunStatus.WaitingTool;
        run.ToolCallCount++;
        _context.AgentToolCalls.Add(call);
        await _context.SaveChangesAsync(cancellationToken);
        await AddEventAsync(run, AgentEventType.ToolCallStarted, new { toolName, call.AgentToolCallId }, cancellationToken);
        return call;
    }

    public async Task CompleteToolCallAsync(AgentRun run, AgentToolCall call, object result, CancellationToken cancellationToken)
    {
        var safe = AgentPayloadSanitizer.Sanitize(result);
        call.Status = "COMPLETED"; call.Result = safe.Value; call.ResultBytes = safe.OriginalBytes; call.ResultTruncated = safe.Truncated; call.CompletedAt = DateTime.UtcNow;
        run.Status = AgentRunStatus.Running;
        await _context.SaveChangesAsync(cancellationToken);
        await AddEventAsync(run, AgentEventType.ToolCallCompleted, new { call.ToolName, call.AgentToolCallId }, cancellationToken);
    }

    public async Task FailToolCallAsync(AgentRun run, AgentToolCall call, string message, CancellationToken cancellationToken)
    {
        call.Status = "FAILED"; call.ErrorMessage = AgentPayloadSanitizer.SafeError(message); call.CompletedAt = DateTime.UtcNow; run.Status = AgentRunStatus.Running;
        await _context.SaveChangesAsync(cancellationToken);
        await AddEventAsync(run, AgentEventType.ToolCallFailed, new { call.ToolName, call.AgentToolCallId, error = call.ErrorMessage }, cancellationToken);
    }

    private static AgentEventDto Map(AgentEvent x) => new() { AgentEventId = x.AgentEventId, AgentRunId = x.AgentRunId, Sequence = x.Sequence, Type = x.Type, Level = x.Level, Message = x.Message, DurationMs = x.DurationMs, Payload = x.Payload, PayloadBytes = x.PayloadBytes, PayloadTruncated = x.PayloadTruncated, CreatedAt = x.CreatedAt };
}
