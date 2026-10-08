using System.Security.Claims;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace dotnet_backend.Controllers;

/// <summary>Nhật ký hoạt động (audit log): mọi API thay đổi dữ liệu đều được ghi lại.</summary>
[Authorize]
[ApiController]
[Route("api/admin/audit-log")]
public class AuditLogController : ControllerBase
{
    private readonly IAuditLogService _service;

    public AuditLogController(IAuditLogService service) => _service = service;

    /// <summary>Danh sách sự kiện, lọc theo từ khóa / sự kiện / người thực hiện.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<AuditLog>>> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? @event = null,
        [FromQuery] string? actor = null,
        CancellationToken ct = default)
    {
        if (User.HasClaim(c => c.Type == "customer_id")) return Forbid();
        return Ok(await _service.GetPagedAsync(page, pageSize, search, @event, actor, ct));
    }

    /// <summary>Các loại sự kiện đã ghi — dùng cho bộ lọc.</summary>
    [HttpGet("events")]
    public async Task<ActionResult<IReadOnlyList<string>>> Events(CancellationToken ct)
    {
        if (User.HasClaim(c => c.Type == "customer_id")) return Forbid();
        return Ok(await _service.GetEventKeysAsync(ct));
    }

    /// <summary>Người thực hiện đã ghi — dùng cho bộ lọc.</summary>
    [HttpGet("actors")]
    public async Task<ActionResult<IReadOnlyList<string>>> Actors(CancellationToken ct)
    {
        if (User.HasClaim(c => c.Type == "customer_id")) return Forbid();
        return Ok(await _service.GetActorNamesAsync(ct));
    }
}
