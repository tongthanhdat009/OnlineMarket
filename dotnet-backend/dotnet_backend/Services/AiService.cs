using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;

namespace dotnet_backend.Services
{
    /// <summary>
    /// Service xử lý AI Chat với RAG (Retrieval Augmented Generation)
    /// Sử dụng OpenRouter API với model amazon/nova-2-lite-v1:free
    /// </summary>
    public class AiService : IAiService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly ILogger<AiService> _logger;

        // Cache products cho RAG (simple in-memory)
        private static List<ProductSearchData>? _productCache;
        private static DateTime _cacheLastUpdated = DateTime.MinValue;
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

        public AiService(
            ApplicationDbContext context, 
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            ILogger<AiService> logger)
        {
            _context = context;
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;
        }

        public async Task<AiChatResponseDto> ProcessChatAsync(AiChatRequestDto request, int? customerId = null)
        {
            try
            {
                // 1. Refresh cache nếu cần
                await EnsureProductCacheAsync();

                // 2. Tìm sản phẩm liên quan (RAG - Retrieval)
                var relevantProducts = await RetrieveRelevantProductsAsync(request.Message);

                // 3. Xây dựng context từ products
                var context = BuildContextFromProducts(relevantProducts);
                var contextSources = relevantProducts.Select(p => new ContextSourceDto
                {
                    ProductName = p.ProductName,
                    Excerpt = $"{p.CategoryName} - {p.Price:N0}đ/{p.Unit}"
                }).ToList();

                // 4. Gọi OpenRouter API
                var aiResponse = await CallOpenRouterAsync(request.Message, context, request.History);

                // 5. Parse response để tìm product suggestions
                var (message, suggestions) = ParseAiResponse(aiResponse, relevantProducts);

                return new AiChatResponseDto
                {
                    Message = message,
                    HasProductSuggestion = suggestions.Any(),
                    SuggestedProducts = suggestions,
                    ContextSources = contextSources
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI chat");
                return new AiChatResponseDto
                {
                    Message = "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
                    HasProductSuggestion = false
                };
            }
        }

        public async Task RefreshProductEmbeddingsAsync()
        {
            _productCache = null;
            _cacheLastUpdated = DateTime.MinValue;
            await EnsureProductCacheAsync();
        }

        #region Private Methods

        private async Task EnsureProductCacheAsync()
        {
            if (_productCache == null || DateTime.UtcNow - _cacheLastUpdated > CacheDuration)
            {
                var products = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Inventories)
                    .Where(p => !p.Deleted)
                    .Select(p => new ProductSearchData
                    {
                        ProductId = p.ProductId,
                        ProductName = p.ProductName,
                        CategoryName = p.Category != null ? p.Category.CategoryName : "",
                        Price = p.Price,
                        Unit = p.Unit ?? "cái",
                        ImageUrl = p.ImageUrl,
                        StockQuantity = p.Inventories.Sum(i => i.Quantity ?? 0),
                        // Tạo search text cho lexical matching
                        SearchText = $"{p.ProductName} {(p.Category != null ? p.Category.CategoryName : "")} {p.Unit}".ToLower()
                    })
                    .ToListAsync();

                _productCache = products;
                _cacheLastUpdated = DateTime.UtcNow;
                _logger.LogInformation($"Product cache refreshed with {products.Count} products");
            }
        }

        /// <summary>
        /// RAG Retrieval: Tìm sản phẩm liên quan bằng lexical matching
        /// (Có thể upgrade lên vector search sau)
        /// </summary>
        private Task<List<ProductSearchData>> RetrieveRelevantProductsAsync(string query)
        {
            if (_productCache == null) return Task.FromResult(new List<ProductSearchData>());

            var queryLower = query.ToLower();
            var queryTokens = queryLower.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            // Food/cooking related keywords
            var foodKeywords = new HashSet<string>
            {
                "nấu", "làm", "chế biến", "món", "ăn", "thức ăn", "nguyên liệu",
                "thịt", "cá", "rau", "gạo", "mì", "bún", "phở", "trứng", "sữa",
                "đường", "muối", "dầu", "nước mắm", "tương", "ớt", "tỏi", "hành",
                "gà", "bò", "heo", "lợn", "tôm", "cua", "mực", "ốc",
                "canh", "xào", "chiên", "hấp", "kho", "nướng", "luộc", "snack"
            };

            // Score each product
            var scoredProducts = _productCache
                .Where(p => p.StockQuantity > 0) // Chỉ lấy sản phẩm còn hàng
                .Select(p =>
                {
                    var score = 0.0;
                    
                    // Exact match in name (highest score)
                    foreach (var token in queryTokens)
                    {
                        if (p.SearchText.Contains(token))
                        {
                            score += 10;
                            // Bonus cho exact word match
                            if (p.ProductName.ToLower().Split(' ').Contains(token))
                                score += 5;
                        }
                    }

                    // Bonus nếu query có food keyword
                    if (queryTokens.Any(t => foodKeywords.Contains(t)))
                    {
                        score += 2;
                    }

                    return new { Product = p, Score = score };
                })
                .Where(x => x.Score > 0)
                .OrderByDescending(x => x.Score)
                .Take(50) // Top-K = 10
                .Select(x => x.Product)
                .ToList();

            return Task.FromResult(scoredProducts);
        }

        private string BuildContextFromProducts(List<ProductSearchData> products)
        {
            if (!products.Any())
            {
                return "Không tìm thấy sản phẩm phù hợp trong cửa hàng.";
            }

            var sb = new StringBuilder();
            sb.AppendLine("Danh sách nguyên liệu/sản phẩm có sẵn trong cửa hàng:");
            sb.AppendLine();

            foreach (var p in products)
            {
                sb.AppendLine($"- ID:{p.ProductId} | {p.ProductName} ({p.CategoryName}) - {p.Price:N0}đ/{p.Unit} - Còn {p.StockQuantity} {p.Unit}");
            }

            return sb.ToString();
        }

        private async Task<string> CallOpenRouterAsync(string userMessage, string context, List<ChatMessageDto>? history)
        {
            var apiKey = _configuration["OpenRouter:ApiKey"];
            var model = _configuration["OpenRouter:Model"] ?? "kwaipilot/kat-coder-pro:free";
            var siteUrl = _configuration["OpenRouter:SiteUrl"] ?? "http://localhost:5192";
            var siteName = _configuration["OpenRouter:SiteName"] ?? "Store Manager";

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("OpenRouter API key not configured");
                return GenerateFallbackResponse(userMessage, context);
            }

            var systemPrompt = @"Bạn là trợ lý AI tư vấn sản phẩm cho cửa hàng tạp hóa/siêu thị. 
Nhiệm vụ của bạn:
1. Tư vấn và gợi ý sản phẩm phù hợp với nhu cầu của khách hàng
2. Tìm sản phẩm từ danh sách có sẵn trong cửa hàng (đã cung cấp trong context)
3. Nếu không tìm thấy sản phẩm phù hợp, hãy nói rõ ràng

Quy tắc response QUAN TRỌNG:
- KHÔNG BAO GIỜ xác nhận đơn hàng hoặc nói 'đã ghi nhận đơn hàng'
- Chỉ GỢI Ý sản phẩm và HỎI khách hàng có muốn thêm vào giỏ hàng không
- Khi gợi ý sản phẩm, luôn đề cập ID và số lượng theo format: [ID:số,QTY:số_lượng]
- Nếu khách hàng không nói rõ số lượng, mặc định là 1
- Trả lời ngắn gọn, thân thiện bằng tiếng Việt
- Ví dụ response đúng: 'Tôi gợi ý: 10 lon Coca Cola (500,000đ/lon) [ID:1,QTY:10]. Bạn có muốn thêm vào giỏ hàng không?'
- Khi khách hỏi về số lượng cho nhiều người (ví dụ: tiệc 10 người), hãy tính toán và gợi ý số lượng hợp lý
- Nếu không có sản phẩm phù hợp, nói: 'Xin lỗi, cửa hàng hiện không có sản phẩm này.'

Context (sản phẩm có sẵn):
" + context;

            var messages = new List<object>
            {
                new { role = "system", content = systemPrompt }
            };

            // Add history if exists
            if (history != null)
            {
                foreach (var msg in history.TakeLast(6)) // Giới hạn 6 tin nhắn gần nhất
                {
                    messages.Add(new { role = msg.Role, content = msg.Content });
                }
            }

            // Add current user message
            messages.Add(new { role = "user", content = userMessage });

            var requestBody = new
            {
                model = model,
                messages = messages,
                max_tokens = 1000,
                temperature = 0.7
            };

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
                request.Headers.Add("Authorization", $"Bearer {apiKey}");
                request.Headers.Add("HTTP-Referer", siteUrl);
                request.Headers.Add("X-Title", siteName);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"OpenRouter API error: {response.StatusCode} - {responseContent}");
                    return GenerateFallbackResponse(userMessage, context);
                }

                var jsonResponse = JsonSerializer.Deserialize<OpenRouterResponse>(responseContent);
                return jsonResponse?.Choices?.FirstOrDefault()?.Message?.Content 
                    ?? GenerateFallbackResponse(userMessage, context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling OpenRouter API");
                return GenerateFallbackResponse(userMessage, context);
            }
        }

        private string GenerateFallbackResponse(string userMessage, string context)
        {
            // Fallback khi không có API key hoặc lỗi
            if (context.Contains("Không tìm thấy"))
            {
                return "Xin lỗi, tôi không tìm thấy nguyên liệu phù hợp với yêu cầu của bạn trong cửa hàng. Bạn có thể mô tả cụ thể hơn món ăn muốn nấu được không?";
            }
            
            return $"Dựa trên yêu cầu của bạn, đây là một số nguyên liệu có sẵn:\n\n{context}\n\nBạn muốn thêm sản phẩm nào vào giỏ hàng?";
        }

        private (string message, List<ProductSuggestionDto> suggestions) ParseAiResponse(
            string aiResponse, List<ProductSearchData> relevantProducts)
        {
            var suggestions = new List<ProductSuggestionDto>();

            // Parse [ID:xxx,QTY:yyy] hoặc [ID:xxx] patterns từ response
            var pattern = new System.Text.RegularExpressions.Regex(@"\[ID:(\d+)(?:,QTY:(\d+))?\]");
            var matches = pattern.Matches(aiResponse);

            foreach (System.Text.RegularExpressions.Match match in matches)
            {
                if (int.TryParse(match.Groups[1].Value, out int productId))
                {
                    var product = relevantProducts.FirstOrDefault(p => p.ProductId == productId);
                    if (product != null && !suggestions.Any(s => s.ProductId == productId))
                    {
                        // Parse quantity (mặc định là 1 nếu không có)
                        int quantity = 1;
                        if (match.Groups.Count > 2 && !string.IsNullOrEmpty(match.Groups[2].Value))
                        {
                            int.TryParse(match.Groups[2].Value, out quantity);
                        }

                        // Đảm bảo quantity >= 1
                        if (quantity < 1) quantity = 1;

                        suggestions.Add(new ProductSuggestionDto
                        {
                            ProductId = product.ProductId,
                            ProductName = product.ProductName,
                            SuggestedQuantity = quantity,
                            Price = product.Price,
                            Unit = product.Unit,
                            ImageUrl = product.ImageUrl
                        });
                    }
                }
            }

            // Clean up response (remove [ID:xxx,QTY:yyy] patterns for display)
            var cleanMessage = pattern.Replace(aiResponse, "").Trim();

            return (cleanMessage, suggestions);
        }

        #endregion

        #region Helper Classes

        private class ProductSearchData
        {
            public int ProductId { get; set; }
            public string ProductName { get; set; } = "";
            public string CategoryName { get; set; } = "";
            public decimal Price { get; set; }
            public string Unit { get; set; } = "";
            public string? ImageUrl { get; set; }
            public int StockQuantity { get; set; }
            public string SearchText { get; set; } = "";
        }

        private class OpenRouterResponse
        {
            [JsonPropertyName("choices")]
            public List<OpenRouterChoice>? Choices { get; set; }
        }

        private class OpenRouterChoice
        {
            [JsonPropertyName("message")]
            public OpenRouterMessage? Message { get; set; }
        }

        private class OpenRouterMessage
        {
            [JsonPropertyName("content")]
            public string? Content { get; set; }
        }

        #endregion
    }
}
