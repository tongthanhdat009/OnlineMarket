using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Services.Interface;

namespace dotnet_backend.Controllers;

/// <summary>
/// Nhan master data tu odoo-connector-service: gia + ton kho cho san pham khop theo SKU.
/// POST /internal/import/catalog
/// Header: X-Source-Token (khong hop le => 401).
///
/// Khop san pham theo SKU "P-{ProductId}" (xem InternalExportController).
/// SKU khong theo mau => tao san pham moi voi Barcode = SKU.
/// </summary>
[ApiController]
[Route("internal/import")]
public class InternalCatalogImportController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IProductService _products;
    private readonly IInventoryService _inventory;

    public InternalCatalogImportController(
        ApplicationDbContext db,
        IProductService products,
        IInventoryService inventory)
    {
        _db = db;
        _products = products;
        _inventory = inventory;
    }

    [HttpPost("catalog")]
    public async Task<IActionResult> Catalog([FromBody] CatalogImportRequest request)
    {
        var expected = Environment.GetEnvironmentVariable("ODOO_SOURCE_TOKEN");
        var provided = Request.Headers["X-Source-Token"].ToString();
        if (string.IsNullOrEmpty(expected) || provided != expected)
        {
            return Unauthorized(new { error = new { code = "BAD_SOURCE_TOKEN", message = "X-Source-Token khong hop le" } });
        }

        int created = 0;
        int priceUpdated = 0;
        int stocked = 0;
        var errors = new List<object>();

        foreach (var item in request.Products ?? new List<CatalogProductDto>())
        {
            try
            {
                var productId = ParseMarketId(item.Sku);
                var product = productId.HasValue
                    ? await _db.Products.FirstOrDefaultAsync(p => p.ProductId == productId.Value)
                    : null;

                if (product == null)
                {
                    await _products.CreateProductAsync(new ProductDto
                    {
                        ProductName = item.Name,
                        Price = item.PriceVnd,
                        Barcode = item.Sku,
                        Unit = "cái",
                    });
                    created++;
                }
                else if (product.Price != item.PriceVnd)
                {
                    // Giu nguyen ten/barcode/image hien tai, chi doi gia
                    await _products.UpdateProductAsync(product.ProductId, new ProductDto
                    {
                        ProductId = product.ProductId,
                        ProductName = product.ProductName,
                        Price = item.PriceVnd,
                        Barcode = product.Barcode,
                        Unit = product.Unit,
                        ImageUrl = product.ImageUrl,
                        CategoryId = product.CategoryId,
                        SupplierId = product.SupplierId,
                    });
                    priceUpdated++;
                }

                if (item.Stock.HasValue && productId.HasValue)
                {
                    // Set ton kho tuyet doi; vo qua neu san pham chua co dong inventory
                    await _inventory.UpdateQuantityAsync(productId.Value, item.Stock.Value);
                    stocked++;
                }
            }
            catch (Exception e)
            {
                errors.Add(new { sku = item.Sku, error = e.Message });
            }
        }

        return Ok(new
        {
            data = new
            {
                created,
                price_updated = priceUpdated,
                stocked,
                errors,
            },
        });
    }

    /// <summary>SKU "P-{ProductId}" -> ProductId.</summary>
    private static int? ParseMarketId(string? sku)
    {
        if (!string.IsNullOrEmpty(sku) && sku.StartsWith("P-") && int.TryParse(sku.AsSpan(2), out var id))
        {
            return id;
        }
        return null;
    }
}
