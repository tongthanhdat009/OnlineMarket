using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Services;

public sealed class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;

    public AuditLogService(ApplicationDbContext context) => _context = context;

    public async Task LogAsync(AuditLog entry, CancellationToken ct = default)
    {
        _context.AuditLogs.Add(entry);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<PagedResultDto<AuditLog>> GetPagedAsync(int page, int pageSize, string? search, string? @event, string? actor, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _context.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(@event))
            query = query.Where(x => x.Action == @event);

        if (!string.IsNullOrWhiteSpace(actor))
            query = query.Where(x => x.ActorName == actor);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                (x.Action != null && x.Action.Contains(term)) ||
                (x.ActorName != null && x.ActorName.Contains(term)) ||
                (x.Note != null && x.Note.Contains(term)) ||
                (x.Subject != null && x.Subject.Contains(term)) ||
                (x.SubjectType != null && x.SubjectType.Contains(term)) ||
                (x.Path != null && x.Path.Contains(term)));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResultDto<AuditLog> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<IReadOnlyList<string>> GetEventKeysAsync(CancellationToken ct = default) =>
        await _context.AuditLogs.AsNoTracking()
            .Where(x => x.Action != null)
            .Select(x => x.Action)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<string>> GetActorNamesAsync(CancellationToken ct = default) =>
        await _context.AuditLogs.AsNoTracking()
            .Where(x => x.ActorName != null)
            .Select(x => x.ActorName!)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync(ct);
}
