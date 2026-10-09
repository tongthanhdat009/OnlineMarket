using System.Security.Claims;
using System.Text.Json;
using dotnet_backend.Dtos;
using dotnet_backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace dotnet_backend.Controllers;

public abstract class AgentAdminControllerBase : ControllerBase
{
    protected bool HasPermission(string permission) => !User.HasClaim(x => x.Type == "customer_id") && User.HasClaim("permission", permission);
    protected int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[Authorize, ApiController, Route("api/admin/agents")]
public sealed class AgentsController : AgentAdminControllerBase
{
    private readonly IAgentOperationsService _service; public AgentsController(IAgentOperationsService service) => _service = service;
    [HttpGet] public async Task<IActionResult> List(int page = 1, int pageSize = 20, CancellationToken ct = default) => HasPermission("agent_view") ? Ok(await _service.GetAgentsAsync(page, pageSize, ct)) : Forbid();
    [HttpGet("{id:int}")] public async Task<IActionResult> Get(int id, CancellationToken ct) { if (!HasPermission("agent_view")) return Forbid(); var x = await _service.GetAgentAsync(id, ct); return x == null ? NotFound() : Ok(x); }
    [HttpPost] public async Task<IActionResult> Create(SaveAgentDto request, CancellationToken ct) { if (!HasPermission("agent_manage")) return Forbid(); try { var x = await _service.CreateAgentAsync(UserId, request, ct); return CreatedAtAction(nameof(Get), new { id = x.AgentId }, x); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } }
    [HttpPut("{id:int}")] public async Task<IActionResult> Update(int id, SaveAgentDto request, CancellationToken ct) { if (!HasPermission("agent_manage")) return Forbid(); try { var x = await _service.UpdateAgentAsync(id, request, ct); return x == null ? NotFound() : Ok(x); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } }
    [HttpPatch("{id:int}/enabled")] public async Task<IActionResult> Enabled(int id, SetAgentEnabledDto request, CancellationToken ct) { if (!HasPermission("agent_manage")) return Forbid(); var x = await _service.SetEnabledAsync(id, request.Enabled, ct); return x == null ? NotFound() : Ok(x); }
    [HttpPut("{id:int}/tools")] public async Task<IActionResult> Tools(int id, AssignAgentToolsDto request, CancellationToken ct) { if (!HasPermission("agent_tool_manage")) return Forbid(); try { var x = await _service.AssignToolsAsync(id, request.ToolNames, ct); return x == null ? NotFound() : Ok(x); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } }
}

[Authorize, ApiController, Route("api/admin/agent-runs")]
public sealed class AgentRunsController : AgentAdminControllerBase
{
    private readonly IAgentOperationsService _service; public AgentRunsController(IAgentOperationsService service) => _service = service;
    [HttpGet] public async Task<IActionResult> List(int page = 1, int pageSize = 20, int? agentId = null, string? status = null, string? trigger = null, int? userId = null, DateTime? from = null, DateTime? to = null, CancellationToken ct = default) => HasPermission("agent_run_view") ? Ok(await _service.GetRunsAsync(page, pageSize, agentId, status, trigger, userId, from, to, ct)) : Forbid();
    [HttpGet("{id:long}")] public async Task<IActionResult> Get(long id, CancellationToken ct) { if (!HasPermission("agent_run_view")) return Forbid(); var x = await _service.GetRunAsync(id, ct); return x == null ? NotFound() : Ok(x); }
}

[Authorize, ApiController, Route("api/admin/agent-activity")]
public sealed class AgentActivityController : AgentAdminControllerBase
{
    private readonly IAgentOperationsService _service; private readonly IAgentActivityBroadcaster _broadcaster;
    public AgentActivityController(IAgentOperationsService service, IAgentActivityBroadcaster broadcaster) { _service = service; _broadcaster = broadcaster; }
    [HttpGet] public async Task<IActionResult> List(int page = 1, int pageSize = 20, long? runId = null, int? agentId = null, string? type = null, string? level = null, string? tool = null, string? runStatus = null, DateTime? from = null, DateTime? to = null, CancellationToken ct = default) => HasPermission("agent_logs_view") ? Ok(await _service.GetActivityAsync(page, pageSize, runId, agentId, type, level, tool, runStatus, from, to, ct)) : Forbid();
    [HttpGet("stream")] public async Task Stream(CancellationToken ct)
    {
        if (!HasPermission("agent_logs_view")) { Response.StatusCode = 403; return; }
        Response.ContentType = "text/event-stream"; Response.Headers.CacheControl = "no-cache"; await Response.StartAsync(ct);
        var reader = _broadcaster.Subscribe(out var id);
        try { await foreach (var item in reader.ReadAllAsync(ct)) { await Response.WriteAsync($"data: {JsonSerializer.Serialize(item)}\n\n", ct); await Response.Body.FlushAsync(ct); } }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { }
        finally { _broadcaster.Unsubscribe(id); }
    }
}

[Authorize, ApiController, Route("api/admin/agent-tools")]
public sealed class AgentToolsController : AgentAdminControllerBase
{
    private readonly IAgentOperationsService _service; public AgentToolsController(IAgentOperationsService service) => _service = service;
    [HttpGet] public async Task<IActionResult> List(CancellationToken ct) => HasPermission("agent_tool_view") ? Ok(await _service.GetToolsAsync(ct)) : Forbid();
    [HttpGet("{name}")] public async Task<IActionResult> Get(string name, CancellationToken ct) { if (!HasPermission("agent_tool_view")) return Forbid(); var x = await _service.GetToolAsync(name, ct); return x == null ? NotFound() : Ok(x); }
}

[Authorize, ApiController, Route("api/admin/agent-analytics")]
public sealed class AgentAnalyticsController : AgentAdminControllerBase
{
    private readonly IAgentOperationsService _service; public AgentAnalyticsController(IAgentOperationsService service) => _service = service;
    [HttpGet, HttpGet("overview")] public async Task<IActionResult> Get(DateTime? from = null, DateTime? to = null, CancellationToken ct = default) => HasPermission("agent_analytics_view") ? Ok(await _service.GetAnalyticsAsync(from, to, ct)) : Forbid();
}

[Authorize, ApiController, Route("api/admin/agent-reports")]
public sealed class AgentReportsController : AgentAdminControllerBase
{
    private readonly IAgentOperationsService _queries; private readonly IAgentReportService _reports; public AgentReportsController(IAgentOperationsService queries, IAgentReportService reports) { _queries = queries; _reports = reports; }
    [HttpGet] public async Task<IActionResult> List(int page = 1, int pageSize = 20, string? reportType = null, DateTime? from = null, DateTime? to = null, CancellationToken ct = default) => HasPermission("agent_report_view") ? Ok(await _queries.GetReportsAsync(page, pageSize, reportType, from, to, ct)) : Forbid();
    [HttpGet("{id:long}")] public async Task<IActionResult> Get(long id, CancellationToken ct) { if (!HasPermission("agent_report_view")) return Forbid(); var x = await _queries.GetReportAsync(id, ct); return x == null ? NotFound() : Ok(x); }
    [HttpPost("sales"), HttpPost("generate")] public async Task<IActionResult> Generate(GenerateAgentReportDto request, CancellationToken ct) { if (!HasPermission("agent_report_generate")) return Forbid(); try { return Ok(await _reports.GenerateSalesReportAsync(UserId, request, ct)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } }
    [HttpGet("{id:long}/pdf")] public async Task<IActionResult> Pdf(long id, CancellationToken ct) { if (!HasPermission("agent_report_view")) return Forbid(); var bytes = await _reports.GeneratePdfAsync(id, ct); return bytes == null ? NotFound() : File(bytes, "application/pdf", $"agent-report-{id}.pdf"); }
}

[Authorize, ApiController, Route("api/admin/agent-auto-analysis")]
public sealed class AgentAutoAnalysisController : AgentAdminControllerBase
{
    private readonly IAgentAutoAnalysisService _auto; public AgentAutoAnalysisController(IAgentAutoAnalysisService auto) => _auto = auto;
    [HttpGet("status")] public IActionResult Status() => HasPermission("agent_report_view") ? Ok(_auto.GetStatus()) : Forbid();
    [HttpPost("trigger")] public async Task<IActionResult> Trigger(CancellationToken ct) { if (!HasPermission("agent_report_generate")) return Forbid(); var report = await _auto.RunOnceAsync(ct); return Ok(report ?? (object)new { skipped = true, status = _auto.GetStatus() }); }
}
