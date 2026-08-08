namespace dotnet_backend.Dtos
{
    public class CustomerSpendingDto
    {
        public int CustomerId { get; set; }
        public string Name { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public decimal TotalSpending { get; set; }
    }
}
