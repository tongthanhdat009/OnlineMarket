using dotnet_backend.Dtos;

namespace dotnet_backend.Services.Reporting;

public interface ISalesReportService
{
    Task<SalesReportDto> GetSalesReportAsync(SalesReportQueryDto query, CancellationToken cancellationToken = default);
}
