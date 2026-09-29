using System.Text.Json;
using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using dotnet_backend.Services.Reporting;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace dotnet_backend.Services;

public sealed class AgentReportService : IAgentReportService
{
    private readonly ApplicationDbContext _context; private readonly ISalesReportService _sales; private readonly IAgentRuntime _runtime;
    public AgentReportService(ApplicationDbContext context, ISalesReportService sales, IAgentRuntime runtime) { _context = context; _sales = sales; _runtime = runtime; QuestPDF.Settings.License = LicenseType.Community; }

    public async Task<AgentReportDto> GenerateSalesReportAsync(int userId, GenerateAgentReportDto request, CancellationToken cancellationToken)
    {
        if (request.From == default || request.To == default) throw new ArgumentException("From and To are required.");
        var run = await _runtime.StartAsync(userId, null, "REPORT", JsonSerializer.Serialize(request), cancellationToken);
        AgentToolCall? call = null;
        try
        {
            var arguments = JsonSerializer.Serialize(new { from = request.From, to = request.To, order_type = request.OrderType });
            call = await _runtime.StartToolCallAsync(run, AdminAiToolRegistry.SalesSummary, arguments, cancellationToken);
            var sales = await _sales.GetSalesReportAsync(new SalesReportQueryDto { From = request.From, To = request.To, OrderType = request.OrderType, Grouping = "daily" }, cancellationToken);
            await _runtime.CompleteToolCallAsync(run, call, sales, cancellationToken);
            var severity = sales.Revenue - sales.RefundAmount < 0 ? "HIGH" : sales.CompletedPaidOrderCount == 0 ? "MEDIUM" : "INFO";
            var structured = new
            {
                Summary = $"{sales.CompletedPaidOrderCount} completed+paid orders",
                Metrics = new { sales.Revenue, sales.DiscountAmount, sales.RefundAmount, NetRevenue = sales.Revenue - sales.RefundAmount, sales.CompletedPaidOrderCount },
                Findings = new[] { sales.CompletedPaidOrderCount == 0 ? "No completed and paid orders in range." : "Sales data validated using completed+paid semantics." },
                Recommendations = new[] { sales.RefundAmount > sales.Revenue * 0.1m ? "Review elevated refund volume." : "Continue monitoring daily revenue and refunds." },
                RelatedEntities = new { RunId = run.AgentRunId, ToolCallId = call.AgentToolCallId },
                Severity = severity,
                Series = sales.Series
            };
            var markdown = $"# Sales report\n\n**Period:** {request.From:yyyy-MM-dd} – {request.To:yyyy-MM-dd}\n\n- Completed + paid orders: {sales.CompletedPaidOrderCount}\n- Revenue: {sales.Revenue:N2}\n- Discounts: {sales.DiscountAmount:N2}\n- Refunds: {sales.RefundAmount:N2}\n- Net revenue: {sales.Revenue - sales.RefundAmount:N2}\n\n## Recommendation\n{(sales.RefundAmount > sales.Revenue * 0.1m ? "Review elevated refund volume." : "Continue monitoring daily revenue and refunds.")}";
            var report = new AgentReport { AgentRunId = run.AgentRunId, AgentToolCallId = call.AgentToolCallId, ReportType = "SALES", Title = $"Sales report {request.From:yyyy-MM-dd} - {request.To:yyyy-MM-dd}", Severity = severity, From = request.From, To = request.To, StructuredContent = JsonSerializer.Serialize(structured), Markdown = markdown, CreatedAt = DateTime.UtcNow };
            _context.AgentReports.Add(report); await _context.SaveChangesAsync(cancellationToken); await _runtime.AddEventAsync(run, AgentEventType.ReportCreated, new { report.AgentReportId, report.ReportType }, cancellationToken); await _runtime.CompleteAsync(run, JsonSerializer.Serialize(new { report.AgentReportId }), cancellationToken); return AgentOperationsService.MapReport(report);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { await _runtime.CancelAsync(run, CancellationToken.None); throw; }
        catch (Exception ex) { if (call is { Status: "RUNNING" }) await _runtime.FailToolCallAsync(run, call, ex.Message, CancellationToken.None); await _runtime.FailAsync(run, ex.Message, CancellationToken.None); throw; }
    }

    public async Task<byte[]?> GeneratePdfAsync(long reportId, CancellationToken cancellationToken)
    {
        var report = await _context.AgentReports.AsNoTracking().SingleOrDefaultAsync(x => x.AgentReportId == reportId, cancellationToken); if (report == null) return null;
        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4); page.Margin(40); page.DefaultTextStyle(x => x.FontSize(11));
            page.Header().Text(report.Title).FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
            page.Content().PaddingVertical(20).Column(column =>
            {
                column.Spacing(8); column.Item().Text($"Report #{report.AgentReportId} | Run #{report.AgentRunId} | Severity: {report.Severity}").Bold(); column.Item().Text($"Period: {report.From:yyyy-MM-dd} – {report.To:yyyy-MM-dd}");
                foreach (var line in report.Markdown.Split('\n')) column.Item().Text(line.TrimStart('#', ' '));
            });
            page.Footer().AlignCenter().Text(x => { x.Span("OnlineMarket AI Operations | "); x.CurrentPageNumber(); });
        })).GeneratePdf();
    }
}
