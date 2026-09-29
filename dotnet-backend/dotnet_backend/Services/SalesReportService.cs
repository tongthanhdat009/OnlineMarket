using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Services.Reporting;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Services;

public sealed class SalesReportService : ISalesReportService
{
    private readonly ApplicationDbContext _context;
    public SalesReportService(ApplicationDbContext context) => _context = context;

    public async Task<SalesReportDto> GetSalesReportAsync(SalesReportQueryDto query, CancellationToken cancellationToken = default)
    {
        if (query.To <= query.From || query.To.DayNumber - query.From.DayNumber > 366)
            throw new ArgumentException("Date range must be [from,to), positive, and at most 366 days.");
        if (query.OrderType is not (null or "" or "online" or "offline"))
            throw new ArgumentException("Order type must be online or offline.");
        var from = query.From.ToDateTime(TimeOnly.MinValue);
        var to = query.To.ToDateTime(TimeOnly.MinValue);
        var orders = _context.Orders.AsNoTracking().Where(x => x.OrderStatus == "completed" && x.PayStatus == "paid" && x.OrderDate >= from && x.OrderDate < to);
        if (!string.IsNullOrWhiteSpace(query.OrderType)) orders = orders.Where(x => x.OrderType == query.OrderType);
        var rows = await orders.Select(x => new { x.OrderId, x.OrderDate, x.TotalAmount, x.DiscountAmount }).ToListAsync(cancellationToken);
        var ids = rows.Select(x => x.OrderId).ToList();
        var refunds = await _context.RefundRequests.AsNoTracking()
            .Where(x => ids.Contains(x.OrderId) && x.Status == "completed")
            .SumAsync(x => (decimal?)x.RefundAmount, cancellationToken) ?? 0;
        return new SalesReportDto
        {
            From = query.From,
            To = query.To,
            CompletedPaidOrderCount = rows.Count,
            Revenue = rows.Sum(x => x.TotalAmount ?? 0),
            DiscountAmount = rows.Sum(x => x.DiscountAmount ?? 0),
            RefundAmount = refunds,
            Series = rows.GroupBy(x => DateOnly.FromDateTime(x.OrderDate ?? from)).OrderBy(x => x.Key)
                .Select(x => new SalesReportPointDto { Date = x.Key, OrderCount = x.Count(), Revenue = x.Sum(y => y.TotalAmount ?? 0) }).ToList()
        };
    }
}
