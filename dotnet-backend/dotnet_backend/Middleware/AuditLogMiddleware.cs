using System.Text.Json;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;

namespace dotnet_backend.Middleware;

/// <summary>
/// Ghi lại mỗi API thành công có thay đổi dữ liệu (POST/PUT/PATCH/DELETE)
/// vào bảng audit_logs: người thực hiện, sự kiện, đối tượng, mô tả.
/// </summary>
public sealed class AuditLogMiddleware
{
    private readonly RequestDelegate _next;

    public AuditLogMiddleware(RequestDelegate next) => _next = next;

    /// <summary>Nhóm API không phải thay đổi dữ liệu nghiệp vụ (đăng nhập, AI stream, giỏ hàng phiên).</summary>
    private static readonly string[] ExcludedPrefixes =
    {
        "/api/auth", "/api/customer/auth", "/api/admin/ai", "/api/customer/ai",
        "/api/cart", "/api/customer/cart",
    };

    /// <summary>Verb không làm thay đổi dữ liệu (chỉ kiểm tra/preview).</summary>
    private static readonly string[] ReadVerbs = { "preview", "validate-checkout", "validate-cart-stock", "apply" };

    public async Task InvokeAsync(HttpContext context, IServiceScopeFactory scopeFactory)
    {
        var method = context.Request.Method;
        var isMutation = HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsPatch(method) || HttpMethods.IsDelete(method);
        if (!isMutation || IsExcluded(context.Request.Path))
        {
            await _next(context);
            return;
        }

        // Buffer response để trích id vừa tạo (OrderId, ProductId...) và trả y nguyên cho client.
        var originalBody = context.Response.Body;
        await using var buffer = new MemoryStream();
        context.Response.Body = buffer;
        var copied = false;
        try
        {
            await _next(context);

            // Chỉ ghi các call thành công — call lỗi không thay đổi dữ liệu.
            if (context.Response.StatusCode is < 200 or >= 300)
            {
                buffer.Position = 0;
                await buffer.CopyToAsync(originalBody);
                copied = true;
                return;
            }

            buffer.Position = 0;
            var responseBody = string.Empty;
            if (context.Response.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true)
            {
                using var reader = new StreamReader(buffer, leaveOpen: true);
                responseBody = await reader.ReadToEndAsync();
            }
            buffer.Position = 0;
            await buffer.CopyToAsync(originalBody);
            copied = true;

            var requestBody = NeedsStatus(context.Request.Path)
                ? await ReadRequestBodyAsync(context.Request)
                : null;
            var entry = BuildEntry(context, method, responseBody, requestBody);
            if (entry == null) return;

            using var scope = scopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IAuditLogService>();
            await service.LogAsync(entry);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Audit log ghi lỗi: {ex.Message}");
        }
        finally
        {
            if (!copied)
            {
                try { buffer.Position = 0; await buffer.CopyToAsync(originalBody); } catch { /* response đã đóng */ }
            }
            context.Response.Body = originalBody;
        }
    }

    private static bool IsExcluded(PathString path)
    {
        var value = path.Value ?? string.Empty;
        return ExcludedPrefixes.Any(prefix => value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
    }

    private static bool NeedsStatus(PathString path)
        => (path.Value ?? string.Empty).EndsWith("/process", StringComparison.OrdinalIgnoreCase);

    private static async Task<string?> ReadRequestBodyAsync(HttpRequest request)
    {
        try
        {
            if (request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) != true) return null;
            request.EnableBuffering();
            request.Body.Position = 0;
            using var reader = new StreamReader(request.Body, leaveOpen: true);
            var text = await reader.ReadToEndAsync();
            request.Body.Position = 0;
            return text;
        }
        catch { return null; }
    }

    // ---------- Xây bản ghi audit từ route + response ----------

    private static AuditLog? BuildEntry(HttpContext context, string method, string responseBody, string? requestBody)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length < 2 || !string.Equals(segments[0], "api", StringComparison.OrdinalIgnoreCase)) return null;

        var index = 1;
        if (index < segments.Length && (string.Equals(segments[index], "admin", StringComparison.OrdinalIgnoreCase)
            || string.Equals(segments[index], "customer", StringComparison.OrdinalIgnoreCase))) index++;
        if (index >= segments.Length) return null;

        var rawEntity = segments[index].ToLowerInvariant();
        var entity = rawEntity switch
        {
            "categories" => "category",
            "refundrequest" or "refundrequests" or "refunds" => "refund-request",
            "rolepermission" or "rolepermissions" => "role-permission",
            _ => rawEntity.EndsWith("ies") ? rawEntity[..^3] + "y" : rawEntity.TrimEnd('s'),
        };

        // Verb = phân đoạn không phải số cuối cùng sau entity (status, cancel, pay, quantity...).
        string? verb = null;
        for (var j = index + 1; j < segments.Length; j++)
        {
            if (long.TryParse(segments[j], out _)) continue;
            verb = segments[j].ToLowerInvariant();
        }
        // id gắn liền với entity (entity/{id}/...) → lấy phân đoạn số ngay sau entity.
        var adjacentId = segments.Length > index + 1 && long.TryParse(segments[index + 1], out _) ? segments[index + 1] : null;

        if (verb != null && ReadVerbs.Contains(verb)) return null;

        var action = ResolveAction(method, entity, rawEntity, verb, requestBody);
        if (action == null) return null;

        var subjectType = SubjectTypeFor(rawEntity, entity, verb);
        var subject = ExtractCreatedId(responseBody, subjectType) ?? adjacentId;
        var (actorId, actorName, actorType) = ResolveActor(context);

        return new AuditLog
        {
            CreatedAt = DateTime.UtcNow,
            ActorId = actorId,
            ActorName = actorName,
            ActorType = actorType,
            Action = action,
            SubjectType = subjectType,
            Subject = subject,
            Note = Describe(action) ?? $"{method.ToUpperInvariant()} {path}",
            Method = method.ToUpperInvariant(),
            Path = path,
            StatusCode = context.Response.StatusCode,
        };
    }

    /// <summary>Map route → khóa sự kiện. Trả null nếu không phải thay đổi dữ liệu.</summary>
    private static string? ResolveAction(string method, string entity, string rawEntity, string? verb, string? requestBody)
    {
        var post = HttpMethods.IsPost(method);
        var remove = HttpMethods.IsDelete(method);

        switch (entity)
        {
            case "order":
                if (verb == "confirm") return "RefundApproved"; // PUT api/order/refund-requests/{id}/confirm
                if (post) return "OrderCreated";
                if (verb is "cancel" or "cancel-admin") return "OrderCancelled";
                if (verb == "status") return "OrderUpdated";
                if (remove) return "OrderDeleted";
                return "OrderUpdated";
            case "refund-request":
                if (post) return "RefundCreated";
                if (verb == "process")
                {
                    var body = requestBody ?? string.Empty;
                    if (body.Contains("reject", StringComparison.OrdinalIgnoreCase)) return "RefundRejected";
                    if (body.Contains("approv", StringComparison.OrdinalIgnoreCase)) return "RefundApproved";
                    return "RefundProcessed";
                }
                return remove ? "RefundDeleted" : "RefundUpdated";
            case "bill":
                if (verb == "pay") return "BillPaid";
                if (verb == "cancel") return "BillCancelled";
                if (verb == "status") return "BillStatusChanged";
                if (post) return "BillCreated";
                if (remove) return "BillDeleted";
                return "BillUpdated";
            case "product":
                if (post) return verb == "upload-image" ? "ProductImageUpdated" : "ProductCreated";
                if (remove) return "ProductDeleted";
                return "ProductUpdated";
            case "inventory":
                return "InventoryChanged";
            case "customer":
                if (post) return "CustomerCreated";
                if (remove) return "CustomerDeleted";
                return "CustomerUpdated";
            case "category":
                if (post) return "CategoryCreated";
                if (remove) return "CategoryDeleted";
                return "CategoryUpdated";
            case "supplier":
                if (post) return "SupplierCreated";
                if (remove) return "SupplierDeleted";
                return "SupplierUpdated";
            case "promotion":
                if (verb == "gift") return "PromotionApplied";
                if (post) return "PromotionCreated";
                if (remove) return "PromotionDeleted";
                return "PromotionUpdated";
            case "user":
                if (post) return "UserCreated";
                if (remove) return "UserDeleted";
                return "UserUpdated";
            case "role":
                if (post) return "RoleCreated";
                if (remove) return "RoleDeleted";
                return "RoleUpdated";
            case "permission":
                if (post) return "PermissionCreated";
                if (remove) return "PermissionDeleted";
                return "PermissionUpdated";
            case "role-permission":
                if (verb == "assign" || post) return "PermissionAssigned";
                return "PermissionRevoked"; // DELETE api/RolePermission/remove
            case "agent":
                if (post) return "AgentCreated";
                if (remove) return "AgentDeleted";
                return "AgentUpdated";
            case "agent-report":
                return "ReportGenerated";
            case "vnpay":
                return "PaymentInitiated";
        }

        // Fallback: mọi API thay đổi dữ liệu khác vẫn được ghi.
        var name = char.ToUpperInvariant(rawEntity[0]) + rawEntity[1..];
        if (post) return $"{name}Created";
        if (remove) return $"{name}Deleted";
        return $"{name}Updated";
    }

    private static string? SubjectTypeFor(string rawEntity, string entity, string? verb) => entity switch
    {
        "order" => "order",
        "product" => "product",
        "inventory" => "product",
        "customer" => "customer",
        "category" => "category",
        "supplier" => "supplier",
        "promotion" => "promotion",
        "bill" => "bill",
        "refund-request" => "refund",
        "user" => "user",
        "role" or "role-permission" => "role",
        "permission" => "permission",
        "agent" => "agent",
        "agent-report" => "report",
        _ => rawEntity,
    };

    /// <summary>Người thực hiện: admin/staff (JWT), khách hàng (customer_id claim) hoặc hệ thống.</summary>
    private static (int? actorId, string? actorName, string actorType) ResolveActor(HttpContext context)
    {
        var user = context.User;
        if (user.Identity?.IsAuthenticated != true) return (null, "Hệ thống", "system");

        if (user.HasClaim(c => c.Type == "customer_id"))
        {
            int.TryParse(user.FindFirst("customer_id")?.Value, out var customerId);
            var customerName = user.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            return (customerId, string.IsNullOrWhiteSpace(customerName) ? $"Khách hàng #{customerId}" : customerName, "customer");
        }

        var idRaw = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
        int.TryParse(idRaw, out var userId);
        var fullName = user.FindFirst(System.Security.Claims.ClaimTypes.GivenName)?.Value;
        var username = user.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var display = !string.IsNullOrWhiteSpace(fullName) ? fullName : username;
        return (userId > 0 ? userId : null, string.IsNullOrWhiteSpace(display) ? $"Quản trị #{idRaw}" : display, "admin");
    }

    /// <summary>Trích id vừa tạo từ response JSON (hỗ trợ lồng nhau: { "Order": { "OrderId": 5 } }).</summary>
    private static string? ExtractCreatedId(string responseBody, string? subjectType)
    {
        if (string.IsNullOrWhiteSpace(responseBody) || string.IsNullOrWhiteSpace(subjectType)) return null;
        var pascal = char.ToUpperInvariant(subjectType[0]) + subjectType[1..];
        var keys = subjectType == "promotion"
            ? new[] { "PromoId", "PromotionId" }
            : subjectType == "report"
                ? new[] { "AgentReportId", "ReportId" }
                : new[] { $"{pascal}Id" };
        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            foreach (var key in keys)
            {
                var found = FindValue(doc.RootElement, key, 0);
                if (found != null) return found;
            }
        }
        catch { /* response không phải JSON */ }
        return null;
    }

    private static string? FindValue(JsonElement element, string key, int depth)
    {
        if (depth > 5) return null;
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                if (string.Equals(property.Name, key, StringComparison.OrdinalIgnoreCase)
                    && property.Value.ValueKind is JsonValueKind.String or JsonValueKind.Number)
                    return property.Value.ToString();
            }
            foreach (var property in element.EnumerateObject())
            {
                var found = FindValue(property.Value, key, depth + 1);
                if (found != null) return found;
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                var found = FindValue(item, key, depth + 1);
                if (found != null) return found;
            }
        }
        return null;
    }

    /// <summary>Mô tả tiếng Việt cho từng sự kiện.</summary>
    private static string? Describe(string action) => action switch
    {
        "OrderCreated" => "Đơn hàng mới được tạo",
        "OrderUpdated" => "Trạng thái đơn hàng được cập nhật",
        "OrderCancelled" => "Đơn hàng đã bị hủy",
        "OrderDeleted" => "Đơn hàng bị xóa",
        "RefundCreated" => "Yêu cầu hoàn tiền được tạo",
        "RefundApproved" => "Yêu cầu hoàn tiền được duyệt",
        "RefundRejected" => "Yêu cầu hoàn tiền bị từ chối",
        "RefundProcessed" => "Yêu cầu hoàn tiền được xử lý",
        "RefundUpdated" => "Yêu cầu hoàn tiền được cập nhật",
        "RefundDeleted" => "Yêu cầu hoàn tiền bị xóa",
        "BillCreated" => "Hóa đơn được xuất",
        "BillPaid" => "Hóa đơn đã được thanh toán",
        "BillCancelled" => "Hóa đơn bị hủy",
        "BillStatusChanged" => "Trạng thái hóa đơn được thay đổi",
        "BillUpdated" => "Hóa đơn được cập nhật",
        "BillDeleted" => "Hóa đơn bị xóa",
        "ProductCreated" => "Sản phẩm mới được tạo",
        "ProductUpdated" => "Sản phẩm được cập nhật",
        "ProductImageUpdated" => "Ảnh sản phẩm được thay đổi",
        "ProductDeleted" => "Sản phẩm bị xóa",
        "InventoryChanged" => "Tồn kho được cập nhật",
        "CustomerCreated" => "Khách hàng mới được tạo",
        "CustomerUpdated" => "Thông tin khách hàng được cập nhật",
        "CustomerDeleted" => "Khách hàng bị xóa",
        "CategoryCreated" => "Danh mục mới được tạo",
        "CategoryUpdated" => "Danh mục được cập nhật",
        "CategoryDeleted" => "Danh mục bị xóa",
        "SupplierCreated" => "Nhà cung cấp mới được tạo",
        "SupplierUpdated" => "Nhà cung cấp được cập nhật",
        "SupplierDeleted" => "Nhà cung cấp bị xóa",
        "PromotionCreated" => "Khuyến mãi mới được tạo",
        "PromotionUpdated" => "Khuyến mãi được cập nhật",
        "PromotionApplied" => "Khuyến mãi được áp dụng",
        "PromotionDeleted" => "Khuyến mãi bị xóa",
        "UserCreated" => "Tài khoản nhân sự mới được tạo",
        "UserUpdated" => "Tài khoản nhân sự được cập nhật",
        "UserDeleted" => "Tài khoản nhân sự bị xóa",
        "RoleCreated" => "Vai trò mới được tạo",
        "RoleUpdated" => "Vai trò được cập nhật",
        "RoleDeleted" => "Vai trò bị xóa",
        "PermissionAssigned" => "Quyền được gán cho vai trò",
        "PermissionRevoked" => "Quyền bị gỡ khỏi vai trò",
        "PermissionCreated" => "Quyền mới được tạo",
        "PermissionUpdated" => "Quyền được cập nhật",
        "PermissionDeleted" => "Quyền bị xóa",
        "AgentCreated" => "Agent mới được tạo",
        "AgentUpdated" => "Cấu hình agent được cập nhật",
        "AgentDeleted" => "Agent bị xóa",
        "ReportGenerated" => "Báo cáo vận hành được tạo",
        "PaymentInitiated" => "Khởi tạo giao dịch thanh toán",
        _ => null,
    };
}
