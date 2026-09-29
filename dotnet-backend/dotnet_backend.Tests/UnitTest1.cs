using System.Text;
using System.Text.Json;
using dotnet_backend.Models;
using dotnet_backend.Services;

namespace dotnet_backend.Tests;

public class AgentOperationsTests
{
    [Fact]
    public void Sanitizer_RedactsSecrets_AndCapsPayloadAt8KiB()
    {
        var result = AgentPayloadSanitizer.Sanitize(new { Authorization = "Bearer secret", Nested = new { ApiKey = "key" }, Data = new string('x', 20_000) });
        Assert.DoesNotContain("Bearer secret", result.Value);
        Assert.DoesNotContain("\"key\"", result.Value);
        Assert.True(result.Truncated);
        Assert.True(Encoding.UTF8.GetByteCount(result.Value) <= AgentPayloadSanitizer.MaxBytes);
        JsonDocument.Parse(result.Value);
    }

    [Fact]
    public void Sanitizer_RedactsEmailsJwtAndBearerValues()
    {
        var result = AgentPayloadSanitizer.Sanitize(new
        {
            Text = "user@example.com Bearer abc.def-123 eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature"
        });

        Assert.DoesNotContain("user@example.com", result.Value);
        Assert.DoesNotContain("abc.def-123", result.Value);
        Assert.DoesNotContain("eyJhbGci", result.Value);
    }

    [Theory]
    [InlineData(AgentRunStatus.Queued, false)]
    [InlineData(AgentRunStatus.Running, false)]
    [InlineData(AgentRunStatus.WaitingTool, false)]
    [InlineData(AgentRunStatus.Completed, true)]
    [InlineData(AgentRunStatus.Failed, true)]
    [InlineData(AgentRunStatus.Cancelled, true)]
    public void TerminalStates_AreExact(string status, bool expected) => Assert.Equal(expected, AgentRunStatus.IsTerminal(status));

    [Fact]
    public void ToolRegistry_IsReadOnlyAndComplete()
    {
        Assert.Equal(6, AdminAiToolRegistry.Definitions.Count);
        Assert.All(AdminAiToolRegistry.Definitions.Values, tool => Assert.Equal("READ_ONLY", tool.Risk));
        Assert.False(AdminAiToolRegistry.IsAllowed("execute_sql"));
    }

    [Fact]
    public void SanitizedSmallPayload_RemainsValidJson()
    {
        var result = AgentPayloadSanitizer.Sanitize("{\"password\":\"p\",\"value\":1}");
        using var document = JsonDocument.Parse(result.Value);
        Assert.Equal("[REDACTED]", document.RootElement.GetProperty("password").GetString());
    }
}
