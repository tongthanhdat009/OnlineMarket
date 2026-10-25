using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using dotnet_backend.Database;
using dotnet_backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Services;

/// <summary>
/// Day don sang Odoo master (sale.channel, channel_code=onlinemarket).
/// Fail-open: Odoo down khong block checkout, chi log + retry o lan goi sau.
/// Contract: custom_addons/multi_channel_base/SYNC_CONTRACT.md (repo odoo).
/// </summary>
public class OdooHookService : IOdooSyncService
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<OdooHookService> _log;
    private readonly string _url;
    private readonly string _key;
    private readonly string _code;

    public OdooHookService(
        ApplicationDbContext db,
        IHttpClientFactory httpFactory,
        ILogger<OdooHookService> log,
        IConfiguration configuration)
    {
        _db = db;
        _httpFactory = httpFactory;
        _log = log;
        _url = (configuration["Odoo:Url"] ?? configuration["Odoo__Url"] ?? "http://localhost:8069").TrimEnd('/');
        _key = configuration["Odoo:ChannelKey"] ?? configuration["Odoo__ChannelKey"] ?? "";
        _code = configuration["Odoo:ChannelCode"] ?? configuration["Odoo__ChannelCode"] ?? "onlinemarket";
    }

    public Task FirePaidAsync(int orderId) => PushOrderAsync(orderId);

    public async Task PushOrderAsync(int orderId, CancellationToken ct = default)
    {
        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                var o = await _db.Orders
                    .Include(x => x.OrderItems)
                    .Include(x => x.Payments)
                    .FirstOrDefaultAsync(x => x.OrderId == orderId, ct);
                if (o == null) return;
                var pay = o.Payments.OrderByDescending(p => p.PaymentDate).FirstOrDefault();
                var payload = new
                {
                    channel_code = _code,
                    external_id = $"OM-{o.OrderId}",
                    items = o.OrderItems.Select(i => new
                    {
                        sku = $"P-{i.ProductId}",
                        qty = i.Quantity,
                        price_vnd = Vnd.Round(i.Price),
                    }).ToList(),
                    customer = new
                    {
                        name = o.Name ?? "",
                        phone = o.Phone ?? "",
                        email = o.Email ?? "",
                    },
                    payment_method = MapPayment(pay?.PaymentMethod),
                };
                var json = JsonSerializer.Serialize(payload);
                using var req = new HttpRequestMessage(HttpMethod.Post, _url + "/api/channel/order_push");
                req.Content = new StringContent(json, Encoding.UTF8, "application/json");
                req.Headers.Add("X-Channel-Key", _key);
                using var res = await _httpFactory.CreateClient("odoo").SendAsync(req, ct);
                var body = await res.Content.ReadAsStringAsync(ct);
                if (!res.IsSuccessStatusCode)
                    throw new HttpRequestException($"Odoo {((int)res.StatusCode)}: {body[..Math.Min(body.Length, 300)]}");
                _log.LogInformation("Odoo push ok OM-{OrderId} attempt {Attempt}", o.OrderId, attempt);
                return;
            }
            catch (Exception ex) when (attempt < 3)
            {
                _log.LogWarning(ex, "Odoo push OM-{OrderId} attempt {Attempt} failed, retry", orderId, attempt);
                await Task.Delay(TimeSpan.FromSeconds(5 * attempt), ct);
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Odoo push OM-{OrderId} failed after 3 attempts (fail-open)", orderId);
            }
        }
    }

    public async Task<double?> PullStockAsync(string sku, CancellationToken ct = default)
    {
        try
        {
            using var req = new HttpRequestMessage(
                HttpMethod.Get, $"{_url}/api/channel/stock/{Uri.EscapeDataString(sku)}?channel_code={Uri.EscapeDataString(_code)}");
            req.Headers.Add("X-Channel-Key", _key);
            using var res = await _httpFactory.CreateClient("odoo").SendAsync(req, ct);
            if (!res.IsSuccessStatusCode) return null;
            using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
            if (doc.RootElement.TryGetProperty("success", out var ok) && ok.GetBoolean()
                && doc.RootElement.TryGetProperty("data", out var data)
                && data.TryGetProperty("qty", out var qty))
                return qty.GetDouble();
            return null;
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Odoo stock pull {Sku} failed", sku);
            return null;
        }
    }

    private static string MapPayment(string? method)
    {
        var m = (method ?? "").ToLowerInvariant();
        if (m.Contains("vnpay")) return "vnpay";
        if (m.Contains("cod") || m.Contains("cash") || m.Contains("tien mat") || m.Contains("tiền mặt")) return "cod";
        if (m.Contains("bank") || m.Contains("chuyen khoan") || m.Contains("chuyển khoản")) return "bank";
        return string.IsNullOrWhiteSpace(m) ? "unknown" : m;
    }
}
