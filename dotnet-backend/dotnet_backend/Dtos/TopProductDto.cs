using dotnet_backend.Models;

public class TopProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public int TotalOrders { get; set; }
    public int SoldQuantity { get; set; }
}
