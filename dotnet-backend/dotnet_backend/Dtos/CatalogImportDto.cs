using System.Text.Json.Serialization;

namespace dotnet_backend.Dtos;

/// <summary>Payload nhan master data tu odoo-connector-service (snake_case).</summary>
public class CatalogImportRequest
{
    [JsonPropertyName("products")]
    public List<CatalogProductDto> Products { get; set; } = new();
}

public class CatalogProductDto
{
    /// <summary>SKU = default_code cua Odoo. Market dung "P-{ProductId}".</summary>
    [JsonPropertyName("sku")]
    public string Sku { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("price_vnd")]
    public int PriceVnd { get; set; }

    /// <summary>Ton kho tuyet doi. Null = khong dung vao ton kho.</summary>
    [JsonPropertyName("stock")]
    public int? Stock { get; set; }
}
