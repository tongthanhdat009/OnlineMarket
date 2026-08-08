namespace dotnet_backend.Dtos;

public class DashboardStatsDto
{
    // Total counts (all orders)
    public int TotalOrders { get; set; }
    public int TotalOnlineOrders { get; set; }
    public int TotalOfflineOrders { get; set; }
    
    // Completed & Paid orders
    public int CompletedOrders { get; set; }
    public int CompletedOnlineOrders { get; set; }
    public int CompletedOfflineOrders { get; set; }
    
    // Revenue (only from completed & paid)
    public decimal TotalRevenue { get; set; }
    public decimal OnlineRevenue { get; set; }
    public decimal OfflineRevenue { get; set; }
}
