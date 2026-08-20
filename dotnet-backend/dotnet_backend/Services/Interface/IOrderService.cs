using dotnet_backend.Dtos;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace dotnet_backend.Services.Interface;

public interface IOrderService
{
    Task<IEnumerable<OrderDto>> GetOrdersOfflineAsync();
    Task<IEnumerable<OrderDto>> GetOrdersOnlineAsync();
    Task<OrderDto> GetOrderByIdAsync(int id);
    Task<PagedResultDto<OrderDto>> GetOnlineOrdersByCustomerPagedAsync(
        int customerId, int page, int pageSize, string? status = null, string? keyword = null);
    Task<IEnumerable<OrderDto>> GetOrdersByCustomerIdAsync(int customerId);
    Task<int> GetTotalOrdersAsync();
    Task<int> UpdateOrderAndBillStatusAsync(int orderId, string statusOrder, string statusBill);
    Task<IEnumerable<OrderByMonthDto>> GetOrdersByYearAsync(int year);
    Task<IEnumerable<SalesByMonthDto>> GetSalesByYearAsync(int year);
    Task<IEnumerable<OrderDto>> GetOnlineOrdersByCustomerIdAsync(int customerId);
    Task<IEnumerable<PeakTimeDto>> GetPeakTimeStatsAsync();
    Task<bool> CancelOrderAsync(int orderId, CancelOrderDto? cancelDto = null);
    Task<OrderDto> CreateOrderAsync(OrderDto orderDto);
    Task<IEnumerable<PromotionDto>> GetAllPromosAsync();
    Task<OrderDto> CheckoutFromCartAsync(Dtos.CheckoutDto checkout);
    Task<OrderDto> CheckoutFromCartAsync(int customerId, int? userId = null, int? promoId = null, 
        string? customerName = null, string? customerAddress = null, string? customerPhone = null, string? customerEmail = null);
    Task<OrderDto> PreviewOrderFromCartAsync(int customerId, int? promoId = null, string paymentMethod = "cash");
    Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus);
    Task<bool> CancelOrderAdminAsync(int orderId);
    Task<IEnumerable<RefundRequestDto>> GetRefundRequestsAsync();
    Task<bool> ConfirmRefundAsync(int refundId);
    Task<IEnumerable<DailyOrderStatsDto>> GetDailyOrderStatsAsync(int year, int month);
    
    // Dashboard statistics with completed/paid filter
    Task<DashboardStatsDto> GetDashboardStatsAsync();
    Task<IEnumerable<OrderByMonthDto>> GetCompletedOrdersByYearAsync(int year);
    Task<IEnumerable<SalesByMonthDto>> GetCompletedSalesByYearAsync(int year);
    Task<PagedResultDto<OrderDto>> GetOrdersOfflinePagedAsync(int page, int pageSize, string? search, string? searchField);
    Task<PagedResultDto<OrderDto>> GetOrdersOnlinePagedAsync(int page, int pageSize, string? search, string? searchField);
    Task<PagedResultDto<RefundRequestDto>> GetRefundRequestsPagedAsync(int page, int pageSize, string? search, string? searchField);
}
