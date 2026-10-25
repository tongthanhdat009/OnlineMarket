using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet_backend.Database;
using dotnet_backend.Models;
using dotnet_backend.Services;

namespace dotnet_backend.Controllers;

/// <summary>
/// Export read-only cho odoo-connector-service (batch reconcile).
/// GET /internal/export/Order/paid?since=...
/// Header: X-Source-Token (khong hop le => 401).
/// Response: { "data": [unified order...], "cursor": "&lt;ISO&gt;" }
///
/// Chu ky: orders.pay_status = 'paid' la signal chuan (payments.transaction_status
/// khong reliable: PaymentService tao payment ma khong set TransactionStatus).
/// </summary>
[ApiController]
[Route("internal/export")]
public class InternalExportController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public InternalExportController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("Order/paid")]
    public async Task<IActionResult> PaidOrders([FromQuery] string? since)
    {
        if (!ValidToken())
        {
            return Unauthorized(new { error = new { code = "BAD_SOURCE_TOKEN", message = "X-Source-Token khong hop le" } });
        }

        DateTime? sinceAt = null;
        if (!string.IsNullOrWhiteSpace(since) && DateTime.TryParse(since, out var parsed))
        {
            sinceAt = parsed;
        }

        var orders = await _db.Orders
            .AsNoTracking()
            .Where(o => o.PayStatus == "paid")
            .Include(o => o.OrderItems)
            .Include(o => o.Payments)
            .Include(o => o.Bills)
            .ToListAsync();

        var rows = orders
            .Select(o => new { Order = o, PaidAt = PaidAt(o) })
            .Where(x => x.PaidAt.HasValue && (sinceAt == null || x.PaidAt > sinceAt))
            .OrderBy(x => x.PaidAt)
            .ToList();

        var payload = rows.Select(x =>
        {
            var o = x.Order;
            var pay = o.Payments.OrderByDescending(p => p.PaymentDate).FirstOrDefault();
            return new
            {
                source = "market",
                source_order_id = o.OrderId.ToString(),
                customer_name = o.Name ?? "",
                customer_email = o.Email ?? "",
                customer_phone = o.Phone ?? "",
                address = o.Address ?? "",
                lines = o.OrderItems.Select(i => new
                {
                    sku = $"P-{i.ProductId}",
                    name = $"P-{i.ProductId}",
                    qty = (double)i.Quantity,
                    // VND khong co phan thap phan: lam tron het (truncation lam lech 1 VND/don)
                    unit_price_vnd = Vnd.Round(i.Price),
                    is_service = false,
                }),
                discount_vnd = Vnd.Round(o.DiscountAmount ?? 0),
                shipping_vnd = 0,
                paid_vnd = Vnd.Round(pay?.Amount ?? o.TotalAmount ?? 0),
                payment_method = pay?.PaymentMethod ?? "",
                provider_ref = pay?.PaymentId.ToString() ?? "",
                origin_note = $"market:Order:{o.OrderId}",
            };
        }).ToList();

        var cursor = rows.Count > 0 ? rows.Max(x => x.PaidAt) : sinceAt;
        return Ok(new { data = payload, cursor = cursor?.ToString("o") ?? "" });
    }

    [HttpGet("Refund/completed")]
    public async Task<IActionResult> CompletedRefunds([FromQuery] string? since)
    {
        if (!ValidToken())
        {
            return Unauthorized(new { error = new { code = "BAD_SOURCE_TOKEN", message = "X-Source-Token khong hop le" } });
        }

        DateTime? sinceAt = null;
        if (!string.IsNullOrWhiteSpace(since) && DateTime.TryParse(since, out var parsed))
        {
            sinceAt = parsed;
        }

        var refunds = await _db.RefundRequests
            .AsNoTracking()
            .Where(r => r.Status == "completed")
            .Where(r => sinceAt == null || (r.UpdatedAt != null && r.UpdatedAt > sinceAt))
            .OrderBy(r => r.UpdatedAt)
            .ToListAsync();

        var data = refunds.Select(r => new
        {
            source = "market",
            source_order_id = r.OrderId.ToString(),
            refund_id = r.RefundId.ToString(),
            amount_vnd = Vnd.Round(r.RefundAmount),
            reason = r.Reason ?? "",
            refunded_at = r.UpdatedAt?.ToString("o") ?? "",
        }).ToList();

        var cursor = refunds.Count > 0 ? refunds.Max(r => r.UpdatedAt) : sinceAt;
        return Ok(new { data, cursor = cursor?.ToString("o") ?? "" });
    }

    /// <summary>Token server-to-server: phai khop env ODOO_SOURCE_TOKEN.</summary>
    private bool ValidToken()
    {
        var expected = Environment.GetEnvironmentVariable("ODOO_SOURCE_TOKEN");
        var provided = Request.Headers["X-Source-Token"].ToString();
        return !string.IsNullOrEmpty(expected) && provided == expected;
    }

    /// <summary>Thoi diem don duoc thanh toan: bill.paid_at, fallback payment.payment_date, fallback order_date.</summary>
    private static DateTime? PaidAt(Order order)
    {
        var bills = order.Bills.Where(b => b.PaidAt != null).Select(b => b.PaidAt!.Value).ToList();
        if (bills.Count > 0)
        {
            return bills.Max();
        }
        var pays = order.Payments.Where(p => p.PaymentDate != null).Select(p => p.PaymentDate!.Value).ToList();
        if (pays.Count > 0)
        {
            return pays.Max();
        }
        return order.OrderDate;
    }
}
