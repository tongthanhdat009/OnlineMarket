using dotnet_backend.Dtos;
using dotnet_backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace dotnet_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RefundRequestController : ControllerBase
{
    private readonly IRefundRequestService _refundRequestService;

    public RefundRequestController(IRefundRequestService refundRequestService)
    {
        _refundRequestService = refundRequestService;
    }

    /// <summary>
    /// Lấy tất cả yêu cầu hoàn tiền
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RefundRequestDto>>> GetAllRefundRequests([FromQuery] int? page, [FromQuery] int? pageSize, [FromQuery] string? search, [FromQuery] string? searchField)
    {
        if (page.HasValue && pageSize.HasValue)
        {
            var paged = await _refundRequestService.GetPagedAsync(page.Value, pageSize.Value, search, searchField);
            return Ok(paged);
        }
        var refunds = await _refundRequestService.GetAllRefundRequestsAsync();
        return Ok(refunds);
    }

    /// <summary>
    /// Lấy yêu cầu hoàn tiền theo ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<RefundRequestDto>> GetRefundRequestById(int id)
    {
        var refund = await _refundRequestService.GetRefundRequestByIdAsync(id);
        if (refund == null)
        {
            return NotFound(new { message = "Không tìm thấy yêu cầu hoàn tiền" });
        }
        return Ok(refund);
    }

    /// <summary>
    /// Lấy yêu cầu hoàn tiền theo Order ID
    /// </summary>
    [HttpGet("order/{orderId}")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RefundRequestDto>>> GetRefundRequestsByOrderId(int orderId)
    {
        var refunds = await _refundRequestService.GetRefundRequestsByOrderIdAsync(orderId);
        return Ok(refunds);
    }

    /// <summary>
    /// Lấy yêu cầu hoàn tiền theo trạng thái
    /// </summary>
    [HttpGet("status/{status}")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RefundRequestDto>>> GetRefundRequestsByStatus(string status)
    {
        var refunds = await _refundRequestService.GetRefundRequestsByStatusAsync(status);
        return Ok(refunds);
    }

    /// <summary>
    /// Lấy số lượng yêu cầu hoàn tiền đang chờ xử lý
    /// </summary>
    [HttpGet("pending-count")]
    [Authorize]
    public async Task<ActionResult<int>> GetPendingRefundCount()
    {
        var count = await _refundRequestService.GetPendingRefundCountAsync();
        return Ok(new { count });
    }

    /// <summary>
    /// Tạo yêu cầu hoàn tiền mới
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<RefundRequestDto>> CreateRefundRequest([FromBody] CreateRefundRequestDto dto)
    {
        try
        {
            var refund = await _refundRequestService.CreateRefundRequestAsync(dto);
            return CreatedAtAction(nameof(GetRefundRequestById), new { id = refund.RefundId }, refund);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xử lý yêu cầu hoàn tiền (Admin)
    /// </summary>
    [HttpPut("{id}/process")]
    [Authorize]
    public async Task<ActionResult<RefundRequestDto>> ProcessRefundRequest(int id, [FromBody] ProcessRefundRequestDto dto)
    {
        try
        {
            // Lấy user ID từ token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Không xác định được người dùng" });
            }

            var refund = await _refundRequestService.ProcessRefundRequestAsync(id, userId, dto);
            if (refund == null)
            {
                return NotFound(new { message = "Không tìm thấy yêu cầu hoàn tiền" });
            }
            return Ok(refund);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa yêu cầu hoàn tiền (chỉ khi đang pending)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> DeleteRefundRequest(int id)
    {
        try
        {
            var result = await _refundRequestService.DeleteRefundRequestAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy yêu cầu hoàn tiền" });
            }
            return Ok(new { message = "Đã xóa yêu cầu hoàn tiền" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
