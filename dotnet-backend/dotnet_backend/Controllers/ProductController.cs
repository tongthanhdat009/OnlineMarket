using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using dotnet_backend.Services.Interface;
using dotnet_backend.Dtos;

namespace dotnet_backend.Controllers;

[Authorize] // Bảo vệ toàn bộ controller
[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _productService.GetAllProductsAsync();
        return Ok(products);
    }

    [HttpGet("pos")]
    public async Task<IActionResult> GetProductsPos()
    {
        var products = await _productService.GetAllProductsPosAsync();
        return Ok(products);
    }

    [HttpGet("total")]
    public async Task<IActionResult> GetTotalProducts()
    {
        var totalProducts = await _productService.GetTotalProductsAsync();
        return Ok(totalProducts);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts(int top = 3)
    {
        var topProducts = await _productService.GetTopProductsByOrderCountAsync(top);
        return Ok(topProducts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(int id)
    {
        var product = await _productService.GetProductByIdAsync(id);
        if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm" });
        return Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] ProductDto productDto)
    {
        ProductDto createdProduct;
        try
        {
            createdProduct = await _productService.CreateProductAsync(productDto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        return CreatedAtAction(nameof(GetProduct), new { id = createdProduct.ProductId }, createdProduct);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductDto productDto)
    {
        if (id != productDto.ProductId)
        {
            return BadRequest(new { message = "ID trên endpoint khác với body" });
        }

        ProductDto? updatedProduct;
        try
        {
            updatedProduct = await _productService.UpdateProductAsync(id, productDto);
            if (updatedProduct == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        return Ok(updatedProduct);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var result = await _productService.DeleteProductAsync(id);
        if (!result)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm" });
        }
        return Ok(new { message = "Xóa sản phẩm thành công" });
    }

    [Authorize(Roles = "1")]
    [HttpPost("{id}/upload-image")]
    public async Task<IActionResult> UploadProductImage(int id, IFormFile image)
    {
        if (image == null || image.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn file ảnh" });
        }

        // Validate declared file type before the service validates the binary signature.
        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(image.ContentType.ToLowerInvariant()))
        {
            return BadRequest(new { message = "Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)" });
        }

        // Validate file size (max 5MB)
        if (image.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "Kích thước ảnh không được vượt quá 5MB" });
        }

        try
        {
            var imageUrl = await _productService.UploadProductImageAsync(id, image);
            return Ok(new { imageUrl, message = "Upload ảnh thành công" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Có lỗi xảy ra khi upload ảnh." });
        }
    }
}
