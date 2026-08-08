using dotnet_backend.Services;

namespace dotnet_backend.Services.Interface;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllProductsAsync();
    Task<IEnumerable<ProductDto>> GetAllProductsPosAsync();
    Task<ProductDto?> GetProductByIdAsync(int id);
    Task<int> GetTotalProductsAsync();
    Task<IEnumerable<TopProductDto>> GetTopProductsByOrderCountAsync(int topCount = 3);
    Task<ProductDto> CreateProductAsync(ProductDto productDto);
    Task<ProductDto?> UpdateProductAsync(int id, ProductDto productDto);
    Task<bool> DeleteProductAsync(int id);
    Task<string> UploadProductImageAsync(int productId, Microsoft.AspNetCore.Http.IFormFile imageFile);
}
