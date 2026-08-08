namespace dotnet_backend.Dtos
{
    public class GiftVoucherDto
    {
        public List<int> CustomerIds { get; set; } = new List<int>();
        public int PromoId { get; set; }
    }
}
