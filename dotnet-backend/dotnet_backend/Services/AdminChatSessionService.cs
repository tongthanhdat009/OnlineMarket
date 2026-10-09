using dotnet_backend.Database;
using dotnet_backend.Dtos;
using dotnet_backend.Models;
using dotnet_backend.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Services;

public sealed class AdminChatSessionService : IAdminChatSessionService
{
    private const int MaxMessageLength = 4000;
    private const int MaxHistoryMessages = 30;
    private const int CompactKeepMessages = 4;
    private readonly ApplicationDbContext _context;

    public AdminChatSessionService(ApplicationDbContext context) => _context = context;

    public async Task<List<AdminChatSessionDto>> GetSessionsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var sessions = await _context.AdminChatSessions.AsNoTracking().Where(x => x.UserId == userId)
            .OrderByDescending(x => x.UpdatedAt).ToListAsync(cancellationToken);
        var ids = sessions.Select(x => x.AdminChatSessionId).ToList();
        var counts = await _context.AdminChatMessages.AsNoTracking().Where(x => ids.Contains(x.AdminChatSessionId))
            .GroupBy(x => x.AdminChatSessionId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync(cancellationToken);
        var map = counts.ToDictionary(x => x.Id, x => x.Count);
        return sessions.Select(x => Map(x, null, map.TryGetValue(x.AdminChatSessionId, out var c) ? c : 0)).ToList();
    }

    public async Task<AdminChatSessionDto?> GetSessionAsync(int userId, int sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _context.AdminChatSessions.AsNoTracking().Include(x => x.Messages)
            .SingleOrDefaultAsync(x => x.AdminChatSessionId == sessionId && x.UserId == userId, cancellationToken);
        return session == null ? null : Map(session, session.Messages.OrderBy(x => x.AdminChatMessageId));
    }

    public async Task<bool> DeleteSessionAsync(int userId, int sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _context.AdminChatSessions.SingleOrDefaultAsync(
            x => x.AdminChatSessionId == sessionId && x.UserId == userId, cancellationToken);
        if (session == null) return false;
        _context.AdminChatSessions.Remove(session);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<AdminChatSessionContext?> PrepareChatAsync(int userId, AdminChatStreamRequestDto request, CancellationToken cancellationToken = default)
    {
        var message = request.Message?.Trim() ?? string.Empty;
        if (message.Length is 0 or > MaxMessageLength)
            throw new ArgumentException($"Message is required and must be at most {MaxMessageLength} characters.");

        AdminChatSession? session;
        if (request.SessionId.HasValue)
        {
            session = await _context.AdminChatSessions.Include(x => x.Messages)
                .SingleOrDefaultAsync(x => x.AdminChatSessionId == request.SessionId && x.UserId == userId, cancellationToken);
            if (session == null) return null;
        }
        else
        {
            session = new AdminChatSession
            {
                UserId = userId,
                Title = message.Length <= 80 ? message : message[..80],
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            // Legacy migration keeps messages_json nullable for normalized writes.

            _context.AdminChatSessions.Add(session);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return new AdminChatSessionContext
        {
            SessionId = session.AdminChatSessionId,
            UserId = userId,
            Message = message,
            Summary = session.Summary,
            SummaryMessageCount = session.SummaryMessageCount,
            History = session.Messages.OrderBy(x => x.AdminChatMessageId).TakeLast(MaxHistoryMessages)
                .Select(x => new ChatMessageDto { Role = x.Role, Content = x.Content, CreatedAt = x.CreatedAt }).ToList()
        };
    }

    public async Task SaveChatAsync(AdminChatSessionContext context, string assistantText, CancellationToken cancellationToken = default)
    {
        var session = await _context.AdminChatSessions.SingleOrDefaultAsync(
            x => x.AdminChatSessionId == context.SessionId && x.UserId == context.UserId, cancellationToken)
            ?? throw new InvalidOperationException("Chat session no longer exists.");

        var summaryChanged = session.SummaryMessageCount != context.SummaryMessageCount ||
            !string.Equals(session.Summary, context.Summary, StringComparison.Ordinal);
        if (summaryChanged && context.SummaryMessageCount > 0)
        {
            var existingMessages = await _context.AdminChatMessages
                .Where(x => x.AdminChatSessionId == session.AdminChatSessionId)
                .OrderByDescending(x => x.AdminChatMessageId)
                .ToListAsync(cancellationToken);
            _context.AdminChatMessages.RemoveRange(existingMessages.Skip(CompactKeepMessages));
        }

        session.Summary = context.Summary;
        session.SummaryMessageCount = context.SummaryMessageCount;
        session.UpdatedAt = DateTime.UtcNow;
        _context.AdminChatMessages.AddRange(
            new AdminChatMessage { AdminChatSessionId = session.AdminChatSessionId, Role = "user", Content = context.Message, CreatedAt = DateTime.UtcNow },
            new AdminChatMessage { AdminChatSessionId = session.AdminChatSessionId, Role = "assistant", Content = assistantText[..Math.Min(assistantText.Length, MaxMessageLength)], CreatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static AdminChatSessionDto Map(AdminChatSession session, IEnumerable<AdminChatMessage>? messages, int messageCount = 0) => new()
    {
        SessionId = session.AdminChatSessionId,
        Title = session.Title,
        Summary = session.Summary,
        SummaryMessageCount = session.SummaryMessageCount,
        CreatedAt = session.CreatedAt,
        UpdatedAt = session.UpdatedAt,
        MessageCount = messages?.Count() ?? messageCount,
        Messages = messages?.Select(x => new ChatMessageDto { Role = x.Role, Content = x.Content, CreatedAt = x.CreatedAt }).ToList() ?? new()
    };
}
