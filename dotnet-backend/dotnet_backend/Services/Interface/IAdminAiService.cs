using System.Security.Claims;
using dotnet_backend.Dtos;

namespace dotnet_backend.Services.Interface;

public interface IAdminAiService
{
    IAsyncEnumerable<AiChatStreamEventDto> StreamChatAsync(
        AiChatRequestDto request,
        ClaimsPrincipal user,
        int? sessionId = null,
        CancellationToken cancellationToken = default);
}
