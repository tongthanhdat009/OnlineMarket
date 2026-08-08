using dotnet_backend.Dtos;

namespace dotnet_backend.Services.Interface
{
    /// <summary>
    /// Interface cho AI Chat Service
    /// </summary>
    public interface IAiService
    {
        /// <summary>
        /// Xử lý tin nhắn chat và trả về response từ AI
        /// </summary>
        /// <param name="request">Request chứa tin nhắn</param>
        /// <param name="customerId">ID khách hàng (tùy chọn)</param>
        /// <returns>Response từ AI với gợi ý sản phẩm nếu có</returns>
        Task<AiChatResponseDto> ProcessChatAsync(AiChatRequestDto request, int? customerId = null);
        
        /// <summary>
        /// Refresh/update embeddings cho products (dùng khi có thay đổi catalog)
        /// </summary>
        Task RefreshProductEmbeddingsAsync();
    }
}
