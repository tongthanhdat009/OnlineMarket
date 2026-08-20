using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using dotnet_backend.Database; // ✅ Thêm dòng này để có ApplicationDbContext

namespace dotnet_backend.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context; // ✅ đổi lại cho đúng

        public CategoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
        {
            return await _context.Categories
                .Select(c => new CategoryDto
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName
                })
                .ToListAsync();
        }

        public async Task<int> GetTotalCategoriesAsync()
        {
            return await _context.Categories.CountAsync();
        }

        public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return null;

            return new CategoryDto
            {
                CategoryId = category.CategoryId,
                CategoryName = category.CategoryName
            };
        }

        public async Task<CategoryDto> AddCategoryAsync(CategoryDto dto)
        {
            var category = new Category { CategoryName = dto.CategoryName };
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            dto.CategoryId = category.CategoryId;
            return dto;
        }

        public async Task<CategoryDto?> UpdateCategoryAsync(int id, CategoryDto dto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return null;

            category.CategoryName = dto.CategoryName;
            await _context.SaveChangesAsync();

            return dto;
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return false;

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }

    public async Task<PagedResultDto<CategoryDto>> GetPagedAsync(int page, int pageSize, string? search, string? searchField)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var q = search?.Trim().ToLower();
        var query = _context.Categories.AsQueryable();
        if (!string.IsNullOrEmpty(q))
            query = query.Where(c => c.CategoryName.ToLower().Contains(q));
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(c => c.CategoryId).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new CategoryDto { CategoryId = c.CategoryId, CategoryName = c.CategoryName })
            .ToListAsync();
        return new PagedResultDto<CategoryDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }
    }
}
                                                                                                        