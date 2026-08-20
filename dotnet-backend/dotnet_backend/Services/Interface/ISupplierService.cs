using System.Collections.Generic;
using System.Threading.Tasks;
using dotnet_backend.Dtos;

namespace dotnet_backend.Services.Interface
{
    public interface ISupplierService
    {
        // 🔹 Lấy toàn bộ nhà cung cấp
        Task<IEnumerable<SupplierDto>> GetAllSuppliersAsync();

        // 🔹 Lấy 1 nhà cung cấp theo ID
        Task<SupplierDto?> GetSupplierByIdAsync(int id);

        // 🔹 Thêm mới nhà cung cấp
        Task<SupplierDto> AddSupplierAsync(SupplierDto dto);

        // 🔹 Cập nhật nhà cung cấp
        Task<SupplierDto?> UpdateSupplierAsync(int id, SupplierDto dto);

        // 🔹 Xóa nhà cung cấp
        Task<bool> DeleteSupplierAsync(int id);
        Task<PagedResultDto<SupplierDto>> GetPagedAsync(int page, int pageSize, string? search, string? searchField);
}
}
