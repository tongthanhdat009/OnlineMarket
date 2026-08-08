using dotnet_backend.Database;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using dotnet_backend.Dtos;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace dotnet_backend.Services
{
    public class CartService : ICartService
    {
        private readonly ApplicationDbContext _context;
        private readonly IPromotionService _promotionService;
        private readonly IS3Service _s3Service;

        public CartService(ApplicationDbContext context, IPromotionService promotionService, IS3Service s3Service)
        {
            _context = context;
            _promotionService = promotionService;
            _s3Service = s3Service;
        }

        /// <summary>
        /// Lấy tất cả items trong giỏ hàng của khách hàng
        /// </summary>
        public async Task<List<CartItem>> GetCartItemsAsync(int customerId)
        {
            var cartItems = await _context.CartItems
                .Include(ci => ci.Product)
                .ThenInclude(p => p.Category)
                .Where(ci => ci.CustomerId == customerId)
                .ToListAsync();

            foreach (var item in cartItems)
            {
                if (!string.IsNullOrWhiteSpace(item.Product?.ImageUrl) &&
                    !(Uri.TryCreate(item.Product.ImageUrl, UriKind.Absolute, out var imageUri) &&
                      (imageUri.Scheme == Uri.UriSchemeHttp || imageUri.Scheme == Uri.UriSchemeHttps)))
                {
                    item.Product!.ImageUrl = await _s3Service.GetImageUrlAsync(item.Product.ImageUrl!);
                }
            }

            return cartItems;
        }

        /// <summary>
        /// Thêm sản phẩm vào giỏ hàng
        /// </summary>
        public async Task<CartItem> AddItemAsync(int customerId, int productId, int quantity = 1)
        {
            if (quantity <= 0)
                throw new ArgumentException("Số lượng phải lớn hơn 0", nameof(quantity));

            // Lấy sản phẩm từ database
            var product = await _context.Products.FindAsync(productId);
            if (product == null)
                throw new ArgumentException("Sản phẩm không tồn tại", nameof(productId));

            // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CustomerId == customerId && ci.ProductId == productId);

            if (existingItem != null)
            {
                // Nếu đã có, cập nhật số lượng
                existingItem.Quantity += quantity;
                existingItem.Subtotal = existingItem.Quantity * existingItem.Price;
                _context.CartItems.Update(existingItem);
            }
            else
            {
                // Nếu chưa có, thêm mới
                var newItem = new CartItem
                {
                    CustomerId = customerId,
                    ProductId = productId,
                    Quantity = quantity,
                    Price = product.Price,
                    Subtotal = quantity * product.Price,
                    AddedAt = DateTime.Now
                };
                _context.CartItems.Add(newItem);
                existingItem = newItem;
            }

            await _context.SaveChangesAsync();

            // Load lại Product để trả về đầy đủ thông tin
            return await _context.CartItems
                .Include(ci => ci.Product)
                .ThenInclude(p => p.Category)
                .FirstOrDefaultAsync(ci =>
                    ci.CustomerId == existingItem.CustomerId &&
                    ci.ProductId == existingItem.ProductId)
                ?? throw new InvalidOperationException("Không thể tải lại sản phẩm trong giỏ hàng.");

        }

        /// <summary>
        /// Cập nhật số lượng của một item trong giỏ hàng
        /// </summary>
        public async Task<CartItem?> UpdateItemQuantityAsync(int customerId, int productId, int quantity)
        {
            if (quantity <= 0)
                throw new ArgumentException("Số lượng phải lớn hơn 0", nameof(quantity));

            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CustomerId == customerId && ci.ProductId == productId);

            if (cartItem == null)
                return null;

            cartItem.Quantity = quantity;
            cartItem.Subtotal = quantity * cartItem.Price;

            _context.CartItems.Update(cartItem);
            await _context.SaveChangesAsync();

            return cartItem;
        }

        /// <summary>
        /// Xóa một item khỏi giỏ hàng
        /// </summary>
        public async Task<bool> RemoveItemAsync(int customerId, int productId)
        {
            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CustomerId == customerId && ci.ProductId == productId);

            if (cartItem == null)
                return false;

            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Xóa toàn bộ giỏ hàng của khách hàng
        /// </summary>
        public async Task<bool> ClearCartAsync(int customerId)
        {
            var cartItems = await _context.CartItems
                .Where(c => c.CustomerId == customerId)
                .ToListAsync();

            if (!cartItems.Any())
                return false;

            _context.CartItems.RemoveRange(cartItems);
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Tính tổng giá trị giỏ hàng
        /// </summary>
        public async Task<decimal> GetCartTotalAsync(int customerId)
        {
            var total = await _context.CartItems
                .Where(ci => ci.CustomerId == customerId)
                .SumAsync(ci => ci.Subtotal);

            return total;
        }

        /// <summary>
        /// Lấy cart item theo sản phẩm
        /// </summary>
        public async Task<CartItem?> GetCartItemByProductAsync(int customerId, int productId)
        {
            return await _context.CartItems
                .Include(ci => ci.Product)
                .FirstOrDefaultAsync(ci => ci.CustomerId == customerId && ci.ProductId == productId);
        }

        /// <summary>
        /// Validate giỏ hàng trước khi checkout
        /// Kiểm tra: tồn kho, giá sản phẩm, sản phẩm bị xóa mềm, khuyến mãi
        /// </summary>
        public async Task<ValidateCheckoutResponse> ValidateCheckoutAsync(int customerId, string? promoCode)
        {
            var response = new ValidateCheckoutResponse
            {
                IsValid = true,
                Errors = new List<string>(),
                OutOfStockProducts = new List<OutOfStockProduct>(),
                DeletedProducts = new List<DeletedProduct>(),
                PriceChangedProducts = new List<PriceChangedProduct>()
            };

            // Lấy tất cả items trong giỏ hàng
            var cartItems = await _context.CartItems
                .Include(ci => ci.Product)
                .ThenInclude(p => p.Inventories)
                .Where(ci => ci.CustomerId == customerId)
                .ToListAsync();

            if (!cartItems.Any())
            {
                response.IsValid = false;
                response.Errors.Add("Giỏ hàng trống");
                return response;
            }

            decimal cartTotal = 0;

            foreach (var cartItem in cartItems)
            {
                var product = cartItem.Product;
                if (product == null) continue;

                // 1. Kiểm tra sản phẩm bị xóa mềm
                if (product.Deleted)
                {
                    response.IsValid = false;
                    response.DeletedProducts.Add(new DeletedProduct
                    {
                        ProductId = product.ProductId,
                        ProductName = product.ProductName,
                        Quantity = cartItem.Quantity
                    });
                    response.Errors.Add($"Sản phẩm '{product.ProductName}' đã ngừng kinh doanh");
                    continue;
                }

                // 2. Kiểm tra giá sản phẩm có thay đổi không
                if (cartItem.Price != product.Price)
                {
                    response.IsValid = false;
                    response.PriceChangedProducts.Add(new PriceChangedProduct
                    {
                        ProductId = product.ProductId,
                        ProductName = product.ProductName,
                        CartPrice = cartItem.Price,
                        CurrentPrice = product.Price
                    });
                    response.Errors.Add($"Giá sản phẩm '{product.ProductName}' đã thay đổi từ {cartItem.Price:N0}đ thành {product.Price:N0}đ");
                }

                // 3. Kiểm tra tồn kho
                var inventory = product.Inventories.FirstOrDefault();
                if (inventory == null || inventory.Quantity < cartItem.Quantity)
                {
                    response.IsValid = false;
                    response.OutOfStockProducts.Add(new OutOfStockProduct
                    {
                        ProductId = product.ProductId,
                        ProductName = product.ProductName,
                        RequestedQuantity = cartItem.Quantity,
                        AvailableQuantity = inventory?.Quantity ?? 0
                    });
                    response.Errors.Add($"Sản phẩm '{product.ProductName}' chỉ còn {inventory?.Quantity ?? 0} trong kho, không đủ số lượng yêu cầu ({cartItem.Quantity})");
                }

                // Tính tổng giá trị giỏ hàng (dùng giá hiện tại từ database)
                cartTotal += product.Price * cartItem.Quantity;
            }

            // 4. Validate khuyến mãi (nếu có)
            if (!string.IsNullOrWhiteSpace(promoCode))
            {
                try
                {
                    var promoResponse = await _promotionService.ValidatePromoByCodeAsync(promoCode, cartTotal);
                    response.PromotionValidation = new PromotionValidationResult
                    {
                        IsValid = true,
                        Message = "Mã khuyến mãi hợp lệ",
                        PromoId = promoResponse.PromoId,
                        DiscountAmount = promoResponse.DiscountAmount
                    };
                }
                catch (Exception ex)
                {
                    response.IsValid = false;
                    response.PromotionValidation = new PromotionValidationResult
                    {
                        IsValid = false,
                        Message = ex.Message,
                        PromoId = null,
                        DiscountAmount = 0
                    };
                    response.Errors.Add($"Mã khuyến mãi không hợp lệ: {ex.Message}");
                }
            }

            return response;
        }
    }
}