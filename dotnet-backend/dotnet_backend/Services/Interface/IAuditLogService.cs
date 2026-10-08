using dotnet_backend.Dtos;
using dotnet_backend.Models;

namespace dotnet_backend.Services.Interface;

public interface IAuditLogService
{
    /// <summary>Ghi một bản ghi audit (gọi từ middleware sau API thay đổi dữ liệu thành công).</summary>
    Task LogAsync(AuditLog entry, CancellationToken ct = default);

    /// <summary>Trang dữ liệu nhật ký, lọc theo từ khóa, sự kiện (event) và người thực hiện (actor).</summary>
    Task<PagedResultDto<AuditLog>> GetPagedAsync(int page, int pageSize, string? search, string? @event, string? actor, CancellationToken ct = default);

    /// <summary>Danh sách khóa sự kiện đã ghi (dùng cho bộ lọc).</summary>
    Task<IReadOnlyList<string>> GetEventKeysAsync(CancellationToken ct = default);

    /// <summary>Danh sách người thực hiện đã ghi (dùng cho bộ lọc).</summary>
    Task<IReadOnlyList<string>> GetActorNamesAsync(CancellationToken ct = default);
}
