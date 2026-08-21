using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using dotnet_backend.Dtos;
using dotnet_backend.Services.Interface;

namespace dotnet_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/admin/ai")]
public sealed class AdminAiController : ControllerBase
{
    private const string Permission = "admin_ai_chat";
    private readonly IAdminAiService _adminAiService;
    private readonly IAdminChatSessionService _sessionService;
    private readonly ILogger<AdminAiController> _logger;

    public AdminAiController(
        IAdminAiService adminAiService,
        IAdminChatSessionService sessionService,
        ILogger<AdminAiController> logger)
    {
        _adminAiService = adminAiService;
        _sessionService = sessionService;
        _logger = logger;
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions(CancellationToken cancellationToken)
    {
        if (!TryGetAdminUserId(out var userId)) return Forbid();
        var sessions = await _sessionService.GetSessionsAsync(userId, cancellationToken);
        return Ok(sessions);
    }

    [HttpGet("sessions/{sessionId:int}")]
    public async Task<IActionResult> GetSession(int sessionId, CancellationToken cancellationToken)
    {
        if (!TryGetAdminUserId(out var userId)) return Forbid();
        var session = await _sessionService.GetSessionAsync(userId, sessionId, cancellationToken);
        return session == null ? NotFound() : Ok(session);
    }

    [HttpDelete("sessions/{sessionId:int}")]
    public async Task<IActionResult> DeleteSession(int sessionId, CancellationToken cancellationToken)
    {
        if (!TryGetAdminUserId(out var userId)) return Forbid();
        if (!await _sessionService.DeleteSessionAsync(userId, sessionId, cancellationToken))
            return NotFound();
        return NoContent();
    }

    [HttpPost("chat/stream")]
    public async Task ChatStream([FromBody] AdminChatStreamRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetAdminUserId(out var userId))
        {
            Response.StatusCode = StatusCodes.Status403Forbidden;
            await Response.WriteAsJsonAsync(new { message = "Bạn không có quyền sử dụng AI admin." }, cancellationToken);
            return;
        }

        AdminChatSessionContext? sessionContext;
        try
        {
            sessionContext = await _sessionService.PrepareChatAsync(userId, request, cancellationToken);
        }
        catch (ArgumentException ex)
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsJsonAsync(new { message = ex.Message }, cancellationToken);
            return;
        }

        if (sessionContext is null)
        {
            Response.StatusCode = StatusCodes.Status404NotFound;
            await Response.WriteAsJsonAsync(new { message = "Không tìm thấy phiên chat." }, cancellationToken);
            return;
        }

        var serviceRequest = new AiChatRequestDto
        {
            Message = sessionContext.Message,
            History = sessionContext.History,
            Summary = sessionContext.Summary,
            SummaryMessageCount = sessionContext.SummaryMessageCount
        };
        sessionContext.History.Add(new ChatMessageDto { Role = "user", Content = serviceRequest.Message });

        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";
        Response.StatusCode = StatusCodes.Status200OK;
        await Response.StartAsync(cancellationToken);

        var assistantText = new StringBuilder();
        try
        {
            await foreach (var evt in _adminAiService.StreamChatAsync(serviceRequest, User, cancellationToken))
            {
                if (evt.Type == "text") assistantText.Append(evt.Text);
                if (evt.Type == "summary")
                {
                    sessionContext.Summary = evt.Summary;
                    sessionContext.SummaryMessageCount = evt.SummaryMessageCount;
                }
                if (evt.Type == "done")
                {
                    await _sessionService.SaveChatAsync(
                        sessionContext, assistantText.ToString(), cancellationToken);
                }

                // Tool calls are internal protocol events, never user-facing content.
                if (evt.Type == "tool_call") continue;
                evt.SessionId = sessionContext.SessionId;
                await Response.WriteAsync($"data: {JsonSerializer.Serialize(evt)}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogDebug("Admin AI chat stream cancelled by client");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin AI chat stream failed");
            if (Response.HasStarted)
            {
                await Response.WriteAsync($"data: {JsonSerializer.Serialize(new AiChatStreamEventDto { Type = "error", Error = "AI admin đang tạm thời không khả dụng." })}\n\n", CancellationToken.None);
                await Response.Body.FlushAsync(CancellationToken.None);
            }
            else Response.StatusCode = StatusCodes.Status500InternalServerError;
        }
    }

    private bool TryGetAdminUserId(out int userId)
    {
        userId = 0;
        if (!IsStaffWithPermission()) return false;
        return int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
    }

    private bool IsStaffWithPermission()
    {
        if (User.Claims.Any(claim => claim.Type == "customer_id")) return false;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        return (role == "1" || role == "2") && User.HasClaim("permission", Permission);
    }
}
