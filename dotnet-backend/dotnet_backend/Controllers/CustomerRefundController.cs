using dotnet_backend.Dtos;
using dotnet_backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace dotnet_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomerRefundController : ControllerBase
{
    private readonly IRefundRequestService _refundRequestService;
    private readonly IOrderService _orderService;

    public CustomerRefundController(IRefundRequestService refundRequestService, IOrderService orderService)
    {
        _refundRequestService = refundRequestService;
        _orderService = orderService;
    }

    private int GetCustomerId()
    {
        var customerIdClaim = User.FindFirst("customer_id");
        if (customerIdClaim == null || !int.TryParse(customerIdClaim.Value, out int customerId))
        {
            throw new UnauthorizedAccessException("Không xác định được khách hàng");
        }
        return customerId;
    }

    /// <summary>
    /// Lấy danh sách yêu cầu hoàn tiền của khách hàng
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RefundRequestDto>>> GetMyRefundRequests()
    {
        try
        {
            var customerId = GetCustomerId();
            var refunds = await _refundRequestService.GetRefundRequestsByCustomerIdAsync(customerId);
            return Ok(refunds);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy yêu cầu hoàn tiền theo Order ID (của khách hàng)
    /// </summary>
    [HttpGet("order/{orderId}")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RefundRequestDto>>> GetMyRefundRequestsByOrder(int orderId)
    {
        try
        {
            var customerId = GetCustomerId();
            
            // Kiểm tra order thuộc về customer này
            var order = await _orderService.GetOrderByIdAsync(orderId);
            if (order == null || order.CustomerId != customerId)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            }

            var refunds = await _refundRequestService.GetRefundRequestsByOrderIdAsync(orderId);
            return Ok(refunds);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Tạo yêu cầu hoàn tiền cho đơn hàng
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<RefundRequestDto>> CreateRefundRequest([FromBody] CreateRefundRequestDto dto)
    {
        try
        {
            var customerId = GetCustomerId();
            
            // Kiểm tra order thuộc về customer này
            var order = await _orderService.GetOrderByIdAsync(dto.OrderId);
            if (order == null || order.CustomerId != customerId)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            }

            // Kiểm tra trạng thái order có được phép yêu cầu hoàn tiền không
            var allowedStatuses = new[] { "delivered", "completed" };
            if (!allowedStatuses.Contains(order.OrderStatus?.ToLower()))
            {
                return BadRequest(new { message = "Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã giao hoặc hoàn thành" });
            }

            var refund = await _refundRequestService.CreateRefundRequestAsync(dto);
            return CreatedAtAction(nameof(GetMyRefundRequestsByOrder), new { orderId = dto.OrderId }, refund);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
    /// Hủy yêu cầu hoàn tiền (chỉ khi đang pending)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> CancelRefundRequest(int id)
    {
        try
        {
            var customerId = GetCustomerId();
            
            // Kiểm tra refund request thuộc về customer này
            var refund = await _refundRequestService.GetRefundRequestByIdAsync(id);
            if (refund == null)
            {
                return NotFound(new { message = "Không tìm thấy yêu cầu hoàn tiền" });
            }

            var order = await _orderService.GetOrderByIdAsync(refund.OrderId);
            if (order == null || order.CustomerId != customerId)
            {
                return NotFound(new { message = "Không tìm thấy yêu cầu hoàn tiền" });
            }

            var result = await _refundRequestService.DeleteRefundRequestAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy yêu cầu hoàn tiền" });
            }
            return Ok(new { message = "Đã hủy yêu cầu hoàn tiền" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
