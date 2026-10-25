using dotnet_backend.Database;
using dotnet_backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Services;

/// <summary>
/// Pull ton Odoo 5p/lan -> Inventory local. Fail-open: loi chi log.
/// </summary>
public class OdooSyncWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<OdooSyncWorker> _log;

    public OdooSyncWorker(IServiceScopeFactory scopes, ILogger<OdooSyncWorker> log)
    {
        _scopes = scopes;
        _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var sync = scope.ServiceProvider.GetRequiredService<IOdooSyncService>();
                var rows = await db.Inventories.Take(200).ToListAsync(stoppingToken);
                var updated = 0;
                foreach (var inv in rows)
                {
                    var qty = await sync.PullStockAsync($"P-{inv.ProductId}", stoppingToken);
                    if (qty.HasValue && inv.Quantity != (int)qty.Value)
                    {
                        inv.Quantity = (int)qty.Value;
                        updated++;
                    }
                }
                if (updated > 0) await db.SaveChangesAsync(stoppingToken);
                _log.LogInformation("Odoo stock pull: {Total} checked, {Updated} updated", rows.Count, updated);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "OdooSyncWorker iteration failed (fail-open)");
            }
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
