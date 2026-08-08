using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using dotnet_backend.Dtos;
using dotnet_backend.Services.Interface;

namespace dotnet_backend.Controllers
{
    /// <summary>
    /// API Chat với AI tư vấn nguyên liệu
    /// </summary>
    [ApiController]
    [Route("api/customer/ai")]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly ICartService _cartService;
        private readonly ILogger<AiController> _logger;

        public AiController(
            IAiService aiService, 
            ICartService cartService,
            ILogger<AiController> logger)
        {
            _aiService = aiService;
            _cartService = cartService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy customerId từ JWT token (nếu đăng nhập)
        /// </summary>
        private int? GetCustomerId()
        {
            var customerIdClaim = User.FindFirst("customer_id")?.Value;
            if (!string.IsNullOrEmpty(customerIdClaim) && int.TryParse(customerIdClaim, out int customerId))
                return customerId;
            return null;
        }

        /// <summary>
        /// Chat với AI tư vấn nguyên liệu
        /// POST: api/customer/ai/chat
        /// Body: { "message": "Tôi muốn nấu phở bò", "history": [...] }
        /// </summary>
        [HttpPost("chat")]
        [AllowAnonymous] // Cho phép chat không cần đăng nhập
        public async Task<IActionResult> Chat([FromBody] AiChatRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Tin nhắn không được để trống" });
            }

            try
            {
                var customerId = GetCustomerId();
                var response = await _aiService.ProcessChatAsync(request, customerId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AI chat");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xử lý tin nhắn" });
            }
        }

        /// <summary>
        /// Thêm sản phẩm được AI gợi ý vào giỏ hàng
        /// POST: api/customer/ai/add-to-cart
        /// Body: { "products": [{ "productId": 1, "quantity": 2 }] }
        /// Yêu cầu đăng nhập
        /// </summary>
        [HttpPost("add-to-cart")]
        [Authorize]
        public async Task<IActionResult> AddSuggestedToCart([FromBody] AddSuggestedProductsRequest request)
        {
            var customerIdClaim = User.FindFirst("customer_id")?.Value;
            if (string.IsNullOrEmpty(customerIdClaim) || !int.TryParse(customerIdClaim, out int customerId))
            {
                return Unauthorized(new { message = "Vui lòng đăng nhập để thêm vào giỏ hàng" });
            }

            if (request.Products == null || !request.Products.Any())
            {
                return BadRequest(new { message = "Không có sản phẩm nào được chọn" });
            }

            try
            {
                var addedItems = new List<object>();
                var errors = new List<string>();

                foreach (var item in request.Products)
                {
                    try
                    {
                        var cartItem = await _cartService.AddItemAsync(customerId, item.ProductId, item.Quantity);
                        if (cartItem != null)
                        {
                            addedItems.Add(new { 
                                productId = item.ProductId, 
                                quantity = item.Quantity,
                                success = true 
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Sản phẩm {item.ProductId}: {ex.Message}");
                    }
                }

                return Ok(new
                {
                    message = addedItems.Any() 
                        ? $"Đã thêm {addedItems.Count} sản phẩm vào giỏ hàng" 
                        : "Không thể thêm sản phẩm nào",
                    addedItems,
                    errors = errors.Any() ? errors : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding AI suggested products to cart");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi thêm vào giỏ hàng" });
            }
        }

        /// <summary>
        /// Refresh product embeddings (admin only, dùng khi update catalog)
        /// POST: api/customer/ai/refresh-embeddings
        /// </summary>
        [HttpPost("refresh-embeddings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RefreshEmbeddings()
        {
            try
            {
                await _aiService.RefreshProductEmbeddingsAsync();
                return Ok(new { message = "Đã cập nhật embeddings thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing embeddings");
                return StatusCode(500, new { message = "Lỗi khi cập nhật embeddings" });
            }
        }
    }
}
