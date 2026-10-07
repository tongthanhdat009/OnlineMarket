using System.Text.Json.Serialization;

namespace dotnet_backend.Dtos;

public class UserDto
{
    public int UserId { get; set; }

    public string Username { get; set; } = null!;

    /// <summary>Never serialized; used internally for create/update and hashing only.</summary>
    [JsonIgnore]
    public string Password { get; set; } = null!;

    public string? FullName { get; set; }

    public int? Role { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<OrderDto> Orders { get; set; } = new List<OrderDto>();

    public virtual RoleDto? RoleNavigation { get; set; }
}