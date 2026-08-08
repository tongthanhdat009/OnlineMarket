namespace dotnet_backend.Dtos;

public class DailyOrderStatsDto
{
    public DateTime Date { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalAmount { get; set; }
    public string? TopCustomerName { get; set; }
    public decimal TopCustomerAmount { get; set; }
    public int TopCustomerOrders { get; set; }
    
    // Online/Offline breakdown
    public int OnlineOrders { get; set; }
    public decimal OnlineAmount { get; set; }
    public int OfflineOrders { get; set; }
    public decimal OfflineAmount { get; set; }
}
