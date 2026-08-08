using dotnet_backend.Models;

public class TopProductDto
{
    public string ProductName { get; set; } = null!;
    public int TotalOrders { get; set; }
}