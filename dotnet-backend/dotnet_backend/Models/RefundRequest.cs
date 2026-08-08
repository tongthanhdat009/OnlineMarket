using System;
using System.Collections.Generic;

namespace dotnet_backend.Models;

public partial class RefundRequest
{
    public int RefundId { get; set; }

    public int OrderId { get; set; }

    // Thông tin yêu cầu
    public decimal RefundAmount { get; set; }

    public string? Reason { get; set; }

    // Thông tin ngân hàng
    public string? CustomerBankName { get; set; }

    public string? CustomerBankAccount { get; set; }

    public string? CustomerAccountHolder { get; set; }

    // Trạng thái xử lý
    public string? Status { get; set; }

    // Audit Trail
    public int? ProcessedBy { get; set; }

    public string? AdminNote { get; set; }

    public string? GatewayRefundId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Order Order { get; set; } = null!;

    public virtual User? ProcessedByUser { get; set; }
}
