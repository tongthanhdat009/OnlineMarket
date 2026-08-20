using dotnet_backend.Dtos;

namespace dotnet_backend.Services.Interface;

public interface IRefundRequestService
{
    Task<IEnumerable<RefundRequestDto>> GetAllRefundRequestsAsync();
    Task<RefundRequestDto?> GetRefundRequestByIdAsync(int refundId);
    Task<IEnumerable<RefundRequestDto>> GetRefundRequestsByOrderIdAsync(int orderId);
    Task<IEnumerable<RefundRequestDto>> GetRefundRequestsByStatusAsync(string status);
    Task<IEnumerable<RefundRequestDto>> GetRefundRequestsByCustomerIdAsync(int customerId);
    Task<RefundRequestDto> CreateRefundRequestAsync(CreateRefundRequestDto dto);
    Task<RefundRequestDto?> ProcessRefundRequestAsync(int refundId, int processedBy, ProcessRefundRequestDto dto);
    Task<bool> DeleteRefundRequestAsync(int refundId);
    Task<int> GetPendingRefundCountAsync();
    Task<PagedResultDto<RefundRequestDto>> GetPagedAsync(int page, int pageSize, string? search, string? searchField);
}
