using Microsoft.EntityFrameworkCore;
using dotnet_backend.Database;
using dotnet_backend.Services.Interface;
using dotnet_backend.Models;
using dotnet_backend.Dtos;
namespace dotnet_backend.Services;

public class OrderItemService : IOrderItemService
{
    private readonly ApplicationDbContext _context;
    private readonly IS3Service _s3Service;

    public OrderItemService(ApplicationDbContext context, IS3Service s3Service)
    {
        _context = context;
        _s3Service = s3Service;
    }

    public async Task<IEnumerable<OrderItemWithProductDto>> GetOrderItemsWithProductsAsync(int orderId)
    {
        var orderItems = await _context.OrderItems
            .Where(oi => oi.OrderId == orderId)
            .Join(
                _context.Products,
                oi => oi.ProductId,
                p => p.ProductId,
                (oi, p) => new OrderItemWithProductDto
                {
                    OrderItemId = oi.OrderItemId,
                    OrderId = oi.OrderId,
                    ProductId = oi.ProductId,
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    Subtotal = oi.Subtotal,

                    ProductName = p.ProductName,
                    Barcode = p.Barcode,
                    ProductPrice = p.Price,
                    Unit = p.Unit,
                    ImageUrl = p.ImageUrl
                }
            )
            .ToListAsync();

        foreach (var item in orderItems)
        {
            if (!string.IsNullOrWhiteSpace(item.ImageUrl) &&
                !(Uri.TryCreate(item.ImageUrl, UriKind.Absolute, out var imageUri) &&
                  (imageUri.Scheme == Uri.UriSchemeHttp || imageUri.Scheme == Uri.UriSchemeHttps)))
            {
                item.ImageUrl = await _s3Service.GetImageUrlAsync(item.ImageUrl);
            }
        }

        return orderItems;
    }

}