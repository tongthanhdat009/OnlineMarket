namespace dotnet_backend.Services.Interface;

public interface IOdooSyncService
{
    Task PushOrderAsync(int orderId, CancellationToken ct = default);
    Task<double?> PullStockAsync(string sku, CancellationToken ct = default);
}
