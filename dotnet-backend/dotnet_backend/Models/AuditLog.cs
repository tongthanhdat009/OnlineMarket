using System;

namespace dotnet_backend.Models;

/// <summary>
/// Nhật ký audit: mỗi dòng là một API thành công có thay đổi dữ liệu,
/// kèm người thực hiện, sự kiện (event) và đối tượng bị tác động.
/// </summary>
public class AuditLog
{
    public long EventId { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>UserId (admin/staff) hoặc CustomerId (khách) thực hiện; null nếu là hệ thống.</summary>
    public int? ActorId { get; set; }

    public string? ActorName { get; set; }

    /// <summary>admin | customer | system</summary>
    public string ActorType { get; set; } = "admin";

    /// <summary>Khóa sự kiện, ví dụ: OrderCreated, InventoryChanged, PermissionAssigned.</summary>
    public string Action { get; set; } = "";

    /// <summary>order | product | customer | bill | refund | user | role ...</summary>
    public string? SubjectType { get; set; }

    /// <summary>Id của đối tượng bị tác động (nếu trích được từ route hoặc response).</summary>
    public string? Subject { get; set; }

    /// <summary>Mô tả ngắn gọn bằng tiếng Việt.</summary>
    public string? Note { get; set; }

    public string? Method { get; set; }

    public string? Path { get; set; }

    public int? StatusCode { get; set; }
}
