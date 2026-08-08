// Services/ProductService.cs
using Microsoft.EntityFrameworkCore;
using dotnet_backend.Database;
using dotnet_backend.Services.Interface;
using dotnet_backend.Models;
using dotnet_backend.Dtos;

namespace dotnet_backend.Services;

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;
    private readonly IS3Service _s3Service;
    private static int? _cachedProductCount = null;
    private static DateTime? _cacheTime = null;

    // Dùng Dependency Injection để inject DbContext vào
    public ProductService(ApplicationDbContext context, IS3Service s3Service)
    {
        _context = context;
        _s3Service = s3Service;
    }

    public async Task<IEnumerable<ProductDto>> GetAllProductsAsync()
    {
        var products = await _context.Products
        .Where(p => !p.Deleted)
        .Include(p => p.Category)
        .Include(p => p.Supplier)
        .Include(p => p.Inventories)
        .Select(p => new ProductDto
        {
            ProductId = p.ProductId,
            ProductName = p.ProductName,
            Price = p.Price,
            Barcode = p.Barcode,
            Unit = p.Unit,
            ImageUrl = p.ImageUrl,
            CategoryId = p.CategoryId,
            SupplierId = p.SupplierId,
            Deleted = p.Deleted,
            Quantity = p.Inventories.Select(i => i.Quantity).FirstOrDefault() ?? 0,
            Category = p.Category != null ? new CategoryDto
            {
                CategoryId = p.Category.CategoryId,
                CategoryName = p.Category.CategoryName
            } : null,
            Supplier = p.Supplier != null ? new SupplierDto
            {
                SupplierId = p.Supplier.SupplierId,
                Name = p.Supplier.Name,
                Phone = p.Supplier.Phone,
                Email = p.Supplier.Email,
                Address = p.Supplier.Address
            } : null
        }).ToListAsync();

        // Generate presigned URLs for images (including 0.png)
        foreach (var product in products)
        {
            if (!string.IsNullOrEmpty(product.ImageUrl))
            {
                product.ImageUrl = await _s3Service.GetImageUrlAsync(product.ImageUrl);
            }
        }

        return products;
    }

    public async Task<IEnumerable<ProductDto>> GetAllProductsPosAsync()
    {
        var products = await _context.Products
        .Where(p => !p.Deleted)
        .Include(p => p.Category)
        .Include(p => p.Supplier)
        .Include(p => p.Inventories)
        .Select(p => new ProductDto
        {
            ProductId = p.ProductId,
            ProductName = p.ProductName,
            Price = p.Price,
            Barcode = p.Barcode,
            Unit = p.Unit,
            ImageUrl = p.ImageUrl,
            CategoryId = p.CategoryId,
            SupplierId = p.SupplierId,
            Deleted = p.Deleted,
            Quantity = p.Inventories.Select(i => i.Quantity).FirstOrDefault() ?? 0,
            Category = p.Category != null ? new CategoryDto
            {
                CategoryId = p.Category.CategoryId,
                CategoryName = p.Category.CategoryName
            } : null,
            Supplier = p.Supplier != null ? new SupplierDto
            {
                SupplierId = p.Supplier.SupplierId,
                Name = p.Supplier.Name,
                Phone = p.Supplier.Phone,
                Email = p.Supplier.Email,
                Address = p.Supplier.Address
            } : null
        }).ToListAsync();

        foreach (var product in products)
        {
            if (!string.IsNullOrEmpty(product.ImageUrl))
            {
                product.ImageUrl = await _s3Service.GetImageUrlAsync(product.ImageUrl);
            }
        }

        return products;
    }

    public async Task<IEnumerable<TopProductDto>> GetTopProductsByOrderCountAsync(int topCount = 3)
    {
        var result = await _context.OrderItems
            .Join(
                _context.Products,
                oi => oi.ProductId,        
                p => p.ProductId,          
                (oi, p) => new { p.ProductName, oi.ProductId }
            )
            .GroupBy(x => x.ProductName)
            .Select(g => new TopProductDto
            {
                ProductName = g.Key,
                TotalOrders = g.Count()
            })
            .OrderByDescending(x => x.TotalOrders)
            .Take(topCount)
            .ToListAsync();

        return result;
    }

    public async Task<int> GetTotalProductsAsync()
    {
        // Cache kết quả trong 5 phút để tránh query chậm
        if (_cachedProductCount.HasValue && _cacheTime.HasValue && 
            (DateTime.Now - _cacheTime.Value).TotalMinutes < 5)
        {
            return _cachedProductCount.Value;
        }

        var count = await _context.Products.CountAsync();
        _cachedProductCount = count;
        _cacheTime = DateTime.Now;
        return count;
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id)
    {
        var productDto = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Include(p => p.Inventories)
            .Where(p => p.ProductId == id)
            .Select(p => new ProductDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                Price = p.Price,
                Barcode = p.Barcode,
                Unit = p.Unit,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                SupplierId = p.SupplierId,
                Deleted = p.Deleted,
                Quantity = p.Inventories.Select(i => i.Quantity).FirstOrDefault() ?? 0,
                Category = p.Category != null ? new CategoryDto
                {
                    CategoryId = p.Category.CategoryId,
                    CategoryName = p.Category.CategoryName
                } : null,
                Supplier = p.Supplier != null ? new SupplierDto
                {
                    SupplierId = p.Supplier.SupplierId,
                    Name = p.Supplier.Name,
                    Phone = p.Supplier.Phone,
                    Email = p.Supplier.Email,
                    Address = p.Supplier.Address
                } : null
            })
            .FirstOrDefaultAsync();

        if (productDto != null && !string.IsNullOrEmpty(productDto.ImageUrl))
        {
            productDto.ImageUrl = await _s3Service.GetImageUrlAsync(productDto.ImageUrl);
        }

        return productDto;
    }

    public async Task<ProductDto> CreateProductAsync(ProductDto productDto)
    {
        // 1. Kiểm tra CategoryId có tồn tại không?
        if (productDto.CategoryId.HasValue && !await _context.Categories.AnyAsync(c => c.CategoryId == productDto.CategoryId.Value))
        {
            throw new ArgumentException($"Đã tồn tại danh mục với Id {productDto.CategoryId}.");
        }

        // 2. Kiểm tra SupplierId có tồn tại không?
        if (productDto.SupplierId.HasValue && !await _context.Suppliers.AnyAsync(s => s.SupplierId == productDto.SupplierId.Value))
        {
            throw new ArgumentException($"Đã tồn tại nhà cung cấp với Id {productDto.SupplierId}.");
        }

        // 3. Kiểm tra Barcode đã tồn tại chưa? (nếu có cung cấp)
        if (!string.IsNullOrEmpty(productDto.Barcode) && await _context.Products.AnyAsync(p => p.Barcode == productDto.Barcode))
        {
            throw new InvalidOperationException($"Đã tồn tại sản phẩm với mã vạch '{productDto.Barcode}'.");
        }

        // 4. Kiểm tra ProductName đã tồn tại chưa?
        if (await _context.Products.AnyAsync(p => p.ProductName == productDto.ProductName))
        {
            throw new InvalidOperationException($"Đã tồn tại sản phẩm với tên '{productDto.ProductName}'.");
        }

        // 5. Kiểm tra giá hợp lệ
        if (productDto.Price <= 0)
        {
            throw new ArgumentException("Giá phải lớn hơn 0.");
        }

        var product = new Product
        {
            ProductName = productDto.ProductName,
            Price = productDto.Price,
            Barcode = productDto.Barcode,
            Unit = productDto.Unit,
            ImageUrl = string.IsNullOrEmpty(productDto.ImageUrl) ? "0.png" : productDto.ImageUrl,
            CategoryId = productDto.CategoryId,
            SupplierId = productDto.SupplierId
        };

        var inventory = new Inventory
        {
            Product = product,
            Quantity = 0 // Luôn khởi tạo tồn kho là 0
        };

        _context.Products.Add(product);
        _context.Inventories.Add(inventory);

        // Lưu tất cả thay đổi trong một giao dịch duy nhất
        await _context.SaveChangesAsync();

        // Lấy lại thông tin product với Category và Supplier để trả về đầy đủ
        var createdProduct = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Include(p => p.Inventories)
            .Where(p => p.ProductId == product.ProductId)
            .Select(p => new ProductDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                Price = p.Price,
                Barcode = p.Barcode,
                Unit = p.Unit,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                SupplierId = p.SupplierId,
                Deleted = p.Deleted,
                Quantity = p.Inventories.Select(i => i.Quantity).FirstOrDefault() ?? 0,
                Category = p.Category != null ? new CategoryDto
                {
                    CategoryId = p.Category.CategoryId,
                    CategoryName = p.Category.CategoryName
                } : null,
                Supplier = p.Supplier != null ? new SupplierDto
                {
                    SupplierId = p.Supplier.SupplierId,
                    Name = p.Supplier.Name,
                    Phone = p.Supplier.Phone,
                    Email = p.Supplier.Email,
                    Address = p.Supplier.Address
                } : null
            })
            .FirstOrDefaultAsync();

        // Generate presigned URL for image (including 0.png)
        if (createdProduct != null && !string.IsNullOrEmpty(createdProduct.ImageUrl))
        {
            createdProduct.ImageUrl = await _s3Service.GetImageUrlAsync(createdProduct.ImageUrl);
        }

        return createdProduct ?? throw new InvalidOperationException("Không thể tải sản phẩm vừa tạo.");
    }

    public async Task<ProductDto?> UpdateProductAsync(int id, ProductDto productDto)
    {
        var productToUpdate = await _context.Products.FindAsync(id);
        if (productToUpdate == null)
        {
            return null;
        }

        // 1. Kiểm tra CategoryId có tồn tại không?
        if (productDto.CategoryId.HasValue && !await _context.Categories.AnyAsync(c => c.CategoryId == productDto.CategoryId.Value))
        {
            throw new ArgumentException($"Đã tồn tại danh mục với Id {productDto.CategoryId}.");
        }

        // 2. Kiểm tra SupplierId có tồn tại không?
        if (productDto.SupplierId.HasValue && !await _context.Suppliers.AnyAsync(s => s.SupplierId == productDto.SupplierId.Value))
        {
            throw new ArgumentException($"Đã tồn tại nhà cung cấp với Id {productDto.SupplierId}.");
        }

        // 3. Kiểm tra Barcode mới có bị trùng với một sản phẩm KHÁC không?
        if (!string.IsNullOrEmpty(productDto.Barcode) &&
         await _context.Products.AnyAsync(p => p.Barcode == productDto.Barcode && p.ProductId != productToUpdate.ProductId))
        {
            throw new InvalidOperationException($"Đã tồn tại sản phẩm với mã vạch '{productDto.Barcode}'.");
        }

        // 4. Kiểm tra ProductName mới có bị trùng với một sản phẩm KHÁC không?
        if (await _context.Products.AnyAsync(p => p.ProductName == productDto.ProductName && p.ProductId != id))
        {
            throw new InvalidOperationException($"Đã tồn tại sản phẩm với tên '{productDto.ProductName}'.");
        }

        // 5. Kiểm tra giá hợp lệ
        if (productDto.Price <= 0)
        {
            throw new ArgumentException("Giá phải lớn hơn 0.");
        }

        // Cập nhật các thuộc tính của entity đã được Entity Framework theo dõi
        productToUpdate.ProductName = productDto.ProductName;
        productToUpdate.Price = productDto.Price;
        productToUpdate.Barcode = productDto.Barcode;
        productToUpdate.Unit = productDto.Unit;
        // Chỉ cập nhật ImageUrl nếu không phải là presigned URL (giữ nguyên giá trị cũ nếu frontend gửi URL)
        if (!string.IsNullOrEmpty(productDto.ImageUrl))
        {
            // Nếu là presigned URL hoặc full URL, giữ nguyên giá trị cũ
            if (productDto.ImageUrl.StartsWith("http"))
            {
                // Giữ nguyên ImageUrl cũ trong DB (không thay đổi)
            }
            else
            {
                // Đây là key hoặc "0.png"
                productToUpdate.ImageUrl = productDto.ImageUrl;
            }
        }
        // Nếu null thì giữ nguyên giá trị cũ (không thay đổi)
        productToUpdate.CategoryId = productDto.CategoryId;
        productToUpdate.SupplierId = productDto.SupplierId;

        // Lưu các thay đổi vào database
        await _context.SaveChangesAsync();

        // Tương tự như hàm Create, ta truy vấn lại để lấy đầy đủ thông tin CategoryName và SupplierName
        var updatedProduct = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Include(p => p.Inventories)
            .Where(p => p.ProductId == id)
            .Select(p => new ProductDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                Price = p.Price,
                Barcode = p.Barcode,
                Unit = p.Unit,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                SupplierId = p.SupplierId,
                Quantity = p.Inventories.Select(i => i.Quantity).FirstOrDefault() ?? 0,
                Category = p.Category != null ? new CategoryDto
                {
                    CategoryId = p.Category.CategoryId,
                    CategoryName = p.Category.CategoryName
                } : null,
                Supplier = p.Supplier != null ? new SupplierDto
                {
                    SupplierId = p.Supplier.SupplierId,
                    Name = p.Supplier.Name,
                    Phone = p.Supplier.Phone,
                    Email = p.Supplier.Email,
                    Address = p.Supplier.Address
                } : null
            })
            .FirstOrDefaultAsync();

        // Generate presigned URL for image (including 0.png)
        if (updatedProduct != null && !string.IsNullOrEmpty(updatedProduct.ImageUrl))
        {
            updatedProduct.ImageUrl = await _s3Service.GetImageUrlAsync(updatedProduct.ImageUrl);
        }

        return updatedProduct;
    }
    public async Task<bool> DeleteProductAsync(int id)
    {
        var productToDelete = await _context.Products.FindAsync(id);
        if (productToDelete == null)
        {
            return false;
        }

        // Xóa mềm sản phẩm
        productToDelete.Deleted = true;
        _context.Products.Update(productToDelete);

        // Lưu các thay đổi vào database
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> UploadProductImageAsync(int productId, Microsoft.AspNetCore.Http.IFormFile imageFile)
    {
        // Tìm sản phẩm
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy sản phẩm với ID {productId}");
        }

        // Tạo tên file mới với timestamp (giây)
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();
        var newFileName = $"public/{timestamp}{extension}";

        // Xóa ảnh cũ nếu không phải 0.png
        if (!string.IsNullOrEmpty(product.ImageUrl) && product.ImageUrl != "0.png")
        {
            try
            {
                await _s3Service.DeleteFileAsync(product.ImageUrl);
            }
            catch (Exception ex)
            {
                // Log lỗi nhưng không throw để không ảnh hưởng đến upload ảnh mới
                Console.WriteLine($"Không thể xóa ảnh cũ: {ex.Message}");
            }
        }

        // Upload lên S3
        string s3Key;
        using (var stream = imageFile.OpenReadStream())
        {
            s3Key = await _s3Service.UploadFileAsync(stream, newFileName, imageFile.ContentType);
        }

        // Cập nhật ImageUrl trong database (chỉ lưu key, không lưu full URL)
        product.ImageUrl = s3Key;
        _context.Products.Update(product);
        await _context.SaveChangesAsync();

        return s3Key;
    }
}