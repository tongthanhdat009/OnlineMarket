using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Services;

public class RefundRequestService : IRefundRequestService
{
    private readonly ApplicationDbContext _context;

    public RefundRequestService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<RefundRequestDto>> GetAllRefundRequestsAsync()
    {
        var refunds = await _context.RefundRequests
            .Include(r => r.Order)
            .Include(r => r.ProcessedByUser)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return refunds.Select(MapToDto);
    }

    public async Task<RefundRequestDto?> GetRefundRequestByIdAsync(int refundId)
    {
        var refund = await _context.RefundRequests
            .Include(r => r.Order)
            .Include(r => r.ProcessedByUser)
            .FirstOrDefaultAsync(r => r.RefundId == refundId);

        return refund != null ? MapToDto(refund) : null;
    }

    public async Task<IEnumerable<RefundRequestDto>> GetRefundRequestsByOrderIdAsync(int orderId)
    {
        var refunds = await _context.RefundRequests
            .Include(r => r.Order)
            .Include(r => r.ProcessedByUser)
            .Where(r => r.OrderId == orderId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return refunds.Select(MapToDto);
    }

    public async Task<IEnumerable<RefundRequestDto>> GetRefundRequestsByStatusAsync(string status)
    {
        var refunds = await _context.RefundRequests
            .Include(r => r.Order)
            .Include(r => r.ProcessedByUser)
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return refunds.Select(MapToDto);
    }

    public async Task<IEnumerable<RefundRequestDto>> GetRefundRequestsByCustomerIdAsync(int customerId)
    {
        var refunds = await _context.RefundRequests
            .Include(r => r.Order)
            .Include(r => r.ProcessedByUser)
            .Where(r => r.Order.CustomerId == customerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return refunds.Select(MapToDto);
    }

    public async Task<RefundRequestDto> CreateRefundRequestAsync(CreateRefundRequestDto dto)
    {
        // Kiểm tra order tồn tại
        var order = await _context.Orders.FindAsync(dto.OrderId);
        if (order == null)
        {
            throw new ArgumentException("Order không tồn tại");
        }

        // Kiểm tra xem đã có yêu cầu hoàn tiền pending chưa
        var existingPending = await _context.RefundRequests
            .AnyAsync(r => r.OrderId == dto.OrderId && r.Status == "pending");
        
        if (existingPending)
        {
            throw new InvalidOperationException("Đã có yêu cầu hoàn tiền đang chờ xử lý cho đơn hàng này");
        }

        var refund = new RefundRequest
        {
            OrderId = dto.OrderId,
            RefundAmount = dto.RefundAmount,
            Reason = dto.Reason,
            CustomerBankName = dto.CustomerBankName,
            CustomerBankAccount = dto.CustomerBankAccount,
            CustomerAccountHolder = dto.CustomerAccountHolder,
            Status = "pending",
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.RefundRequests.Add(refund);
        await _context.SaveChangesAsync();

        // Load navigation properties
        await _context.Entry(refund).Reference(r => r.Order).LoadAsync();

        return MapToDto(refund);
    }

    public async Task<RefundRequestDto?> ProcessRefundRequestAsync(int refundId, int processedBy, ProcessRefundRequestDto dto)
    {
        var refund = await _context.RefundRequests
            .Include(r => r.Order)
            .FirstOrDefaultAsync(r => r.RefundId == refundId);

        if (refund == null)
        {
            return null;
        }

        // Chỉ cho phép xử lý nếu đang pending hoặc approved
        if (refund.Status != "pending" && refund.Status != "approved")
        {
            throw new InvalidOperationException($"Không thể xử lý yêu cầu hoàn tiền với trạng thái: {refund.Status}");
        }

        refund.Status = dto.Status;
        refund.ProcessedBy = processedBy;
        refund.AdminNote = dto.AdminNote;
        refund.GatewayRefundId = dto.GatewayRefundId;
        refund.UpdatedAt = DateTime.Now;

        // Nếu hoàn tiền được duyệt/hoàn thành, cập nhật trạng thái order
        if (dto.Status == "completed")
        {
            var order = refund.Order;
            order.PayStatus = "refunded";
            
            // Cập nhật bill nếu có
            var bill = await _context.Bills.FirstOrDefaultAsync(b => b.OrderId == order.OrderId);
            if (bill != null)
            {
                bill.PayStatus = "refunded";
            }
        }

        await _context.SaveChangesAsync();

        // Load user info
        await _context.Entry(refund).Reference(r => r.ProcessedByUser).LoadAsync();

        return MapToDto(refund);
    }

    public async Task<bool> DeleteRefundRequestAsync(int refundId)
    {
        var refund = await _context.RefundRequests.FindAsync(refundId);
        if (refund == null)
        {
            return false;
        }

        // Chỉ cho phép xóa nếu đang pending
        if (refund.Status != "pending")
        {
            throw new InvalidOperationException("Chỉ có thể xóa yêu cầu hoàn tiền đang chờ xử lý");
        }

        _context.RefundRequests.Remove(refund);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetPendingRefundCountAsync()
    {
        return await _context.RefundRequests
            .CountAsync(r => r.Status == "pending");
    }

    private RefundRequestDto MapToDto(RefundRequest refund)
    {
        return new RefundRequestDto
        {
            RefundId = refund.RefundId,
            OrderId = refund.OrderId,
            RefundAmount = refund.RefundAmount,
            Reason = refund.Reason,
            CustomerBankName = refund.CustomerBankName,
            CustomerBankAccount = refund.CustomerBankAccount,
            CustomerAccountHolder = refund.CustomerAccountHolder,
            Status = refund.Status,
            ProcessedBy = refund.ProcessedBy,
            ProcessedByName = refund.ProcessedByUser?.FullName,
            AdminNote = refund.AdminNote,
            GatewayRefundId = refund.GatewayRefundId,
            CreatedAt = refund.CreatedAt,
            UpdatedAt = refund.UpdatedAt,
            CustomerName = refund.Order?.Name,
            CustomerPhone = refund.Order?.Phone,
            CustomerEmail = refund.Order?.Email
        };
    }
}
