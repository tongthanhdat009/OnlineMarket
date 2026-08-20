using Microsoft.EntityFrameworkCore;
using dotnet_backend.Database;
using dotnet_backend.Services.Interface;
using dotnet_backend.Models;
using dotnet_backend.Dtos;

namespace dotnet_backend.Services;

public class PromotionService : IPromotionService
{
    private readonly ApplicationDbContext _context;
    private readonly EmailService _emailService;

    public PromotionService(ApplicationDbContext context, EmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<IEnumerable<PromotionDto>> GetAllPromotionsAsync()
    {
        var promotions = await _context.Promotions.AsNoTracking().ToListAsync();
        return promotions.Select(p => new PromotionDto
        {
            PromoId = p.PromoId,
            PromoCode = p.PromoCode,
            Description = p.Description,
            DiscountType = p.DiscountType,
            DiscountValue = p.DiscountValue,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            MinOrderAmount = p.MinOrderAmount,
            UsageLimit = p.UsageLimit,
            UsedCount = p.UsedCount,
            Status = p.Status
        });
    }

    public async Task<PromotionDto> GetPromotionByIdAsync(int id)
    {
        var promo = await _context.Promotions.FindAsync(id);
        if (promo == null)
        {
            throw new KeyNotFoundException("Không tìm thấy khuyến mãi với ID/Mã code này.");
        }
        return new PromotionDto
        {
            PromoId = promo.PromoId,
            PromoCode = promo.PromoCode,
            Description = promo.Description,
            DiscountType = promo.DiscountType ?? string.Empty,
            DiscountValue = promo.DiscountValue,
            StartDate = promo.StartDate,
            EndDate = promo.EndDate,
            MinOrderAmount = promo.MinOrderAmount,
            UsageLimit = promo.UsageLimit,
            UsedCount = promo.UsedCount,
            Status = promo.Status
        };
    }

    public async Task<PromotionDto> CreatePromotionAsync(PromotionDto dto)
    {
        // Basic null check
        if (dto == null)
        {
            throw new ArgumentException("Dữ liệu không hợp lệ.");
        }

        // Validate enums
        var discountType = (dto.DiscountType ?? "").ToLower();
        if (discountType != "percent" && discountType != "fixed")
        {
            throw new ArgumentException("Loại giảm giá không hợp lệ");
        }

        var status = (dto.Status ?? "").ToLower();
        if (status != "active" && status != "inactive")
        {
            throw new ArgumentException("Trạng thái không hợp lệ.");
        }

        // Date validation
        if (dto.EndDate < dto.StartDate)
        {
            throw new ArgumentException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        }

        // Discount value
        if (dto.DiscountValue <= 0)
        {
            throw new ArgumentException("Giá trị giảm giá phải lớn hơn 0.");
        }

        if (discountType == "percent" && (dto.DiscountValue < 1 || dto.DiscountValue > 100))
        {
            throw new ArgumentException("Loại giảm giá 'percent' (phần trăm) phải nằm trong khoảng từ 1 đến 100.");
        }

        // Non-negative fields
        if ((dto.MinOrderAmount ?? 0) < 0)
        {
            throw new ArgumentException("Giá trị đơn hàng tối thiểu không được âm.");
        }
        if ((dto.UsageLimit ?? 0) < 0)
        {
            throw new ArgumentException("Giới hạn sử dụng không được âm.");
        }

        // Unique promo_code
        var exists = await _context.Promotions.AnyAsync(p => p.PromoCode == dto.PromoCode);
        if (exists)
        {
            throw new InvalidOperationException("Mã khuyến mãi đã tồn tại.");
        }

        var model = new Promotion
        {
            PromoCode = dto.PromoCode,
            Description = dto.Description,
            DiscountType = dto.DiscountType!,
            DiscountValue = dto.DiscountValue,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MinOrderAmount = dto.MinOrderAmount,
            UsageLimit = dto.UsageLimit ?? 0,
            UsedCount = dto.UsedCount ?? 0,
            Status = dto.Status
        };

        _context.Promotions.Add(model);
        await _context.SaveChangesAsync();

        return new PromotionDto
        {
            PromoId = model.PromoId,
            PromoCode = model.PromoCode,
            Description = model.Description,
            DiscountType = model.DiscountType,
            DiscountValue = model.DiscountValue,
            StartDate = model.StartDate,
            EndDate = model.EndDate,
            MinOrderAmount = model.MinOrderAmount,
            UsageLimit = model.UsageLimit,
            UsedCount = model.UsedCount,
            Status = model.Status
        };
    }

    public async Task<PromotionDto> UpdatePromotionAsync(int id, PromotionDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException("Dữ liệu không hợp lệ.");
        }

        var promo = await _context.Promotions.FindAsync(id);
        if (promo == null)
        {
            throw new KeyNotFoundException("Không tìm thấy khuyến mãi với ID/Mã code này.");
        }

        // Unique promo_code check if changed
        if (!string.Equals(promo.PromoCode, dto.PromoCode, StringComparison.OrdinalIgnoreCase))
        {
            var exists = await _context.Promotions.AnyAsync(p => p.PromoCode == dto.PromoCode && p.PromoId != id);
            if (exists)
            {
                throw new InvalidOperationException("Mã khuyến mãi đã tồn tại.");
            }
        }

        // Date check
        if (dto.EndDate < dto.StartDate)
        {
            throw new ArgumentException("Không thể đặt ngày kết thúc (end_date) sớm hơn ngày bắt đầu (start_date).");
        }

        // Validate enums
        var discountType = (dto.DiscountType ?? "").ToLower();
        if (discountType != "percent" && discountType != "fixed")
        {
            throw new ArgumentException("Loại giảm giá không hợp lệ");
        }
        var status = (dto.Status ?? "").ToLower();
        if (status != "active" && status != "inactive")
        {
            throw new ArgumentException("Trạng thái không hợp lệ.");
        }

        // Validate numeric
        if (dto.DiscountValue <= 0)
        {
            throw new ArgumentException("Giá trị giảm giá phải lớn hơn 0.");
        }
        if (discountType == "percent" && (dto.DiscountValue < 1 || dto.DiscountValue > 100))
        {
            throw new ArgumentException("Loại giảm giá 'percent' (phần trăm) phải nằm trong khoảng từ 1 đến 100.");
        }
        if ((dto.MinOrderAmount ?? 0) < 0)
        {
            throw new ArgumentException("Giá trị đơn hàng tối thiểu không được âm.");
        }
        if ((dto.UsageLimit ?? 0) < 0)
        {
            throw new ArgumentException("Giới hạn sử dụng không được âm.");
        }

        // Business rules for used_count
        var usedCount = promo.UsedCount ?? 0;
        if ((dto.UsageLimit ?? 0) < usedCount)
        {
            throw new ArgumentException($"Không thể đặt giới hạn sử dụng ({dto.UsageLimit}) thấp hơn số lần đã sử dụng ({usedCount}).");
        }

        if (usedCount > 0)
        {
            // Do not allow changing discount type/value if already used
            if (!string.Equals(promo.DiscountType, dto.DiscountType, StringComparison.OrdinalIgnoreCase) || promo.DiscountValue != dto.DiscountValue)
            {
                throw new ArgumentException("Không thể thay đổi giá trị (discount_value) hoặc loại (discount_type) của khuyến mãi đã được sử dụng.");
            }
        }

        // Apply updates
        promo.PromoCode = dto.PromoCode;
        promo.Description = dto.Description;
        // Only update discount fields if used_count == 0
        if (usedCount == 0)
        {
            promo.DiscountType = dto.DiscountType!;
            promo.DiscountValue = dto.DiscountValue;
        }
        promo.StartDate = dto.StartDate;
        promo.EndDate = dto.EndDate;
        promo.MinOrderAmount = dto.MinOrderAmount;
        promo.UsageLimit = dto.UsageLimit ?? 0;
        promo.Status = dto.Status;

        _context.Promotions.Update(promo);
        await _context.SaveChangesAsync();

        return new PromotionDto
        {
            PromoId = promo.PromoId,
            PromoCode = promo.PromoCode,
            Description = promo.Description,
            DiscountType = promo.DiscountType ?? string.Empty,
            DiscountValue = promo.DiscountValue,
            StartDate = promo.StartDate,
            EndDate = promo.EndDate,
            MinOrderAmount = promo.MinOrderAmount,
            UsageLimit = promo.UsageLimit,
            UsedCount = promo.UsedCount,
            Status = promo.Status
        };
    }

    public async Task<bool> DeletePromotionAsync(int id)
    {
        var promo = await _context.Promotions.FindAsync(id);
        if (promo == null)
        {
            return false;
        }

        var usedCount = promo.UsedCount ?? 0;
        if (usedCount > 0)
        {
            throw new InvalidOperationException("Không thể xóa khuyến mãi đã được sử dụng. Vui lòng chuyển trạng thái sang 'inactive' (không hoạt động) để vô hiệu hóa.");
        }

        _context.Promotions.Remove(promo);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ApplyPromoResponseDto> ApplyPromotionAsync(ApplyPromoRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.PromoCode))
            throw new ArgumentException("Dữ liệu không hợp lệ.");

        var promo = await _context.Promotions.FirstOrDefaultAsync(p => p.PromoCode == request.PromoCode);
        if (promo == null)
            throw new KeyNotFoundException("Không tìm thấy mã khuyến mãi.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Check trạng thái
        if ((promo.Status ?? "").ToLower() != "active")
            throw new InvalidOperationException("Mã giảm giá không còn hoạt động.");

        // Check ngày
        if (promo.StartDate > today)
            throw new InvalidOperationException("Mã giảm giá chưa có hiệu lực.");
        if (promo.EndDate < today)
            throw new InvalidOperationException("Mã giảm giá đã hết hạn.");

        // Check lượt sử dụng
        if ((promo.UsageLimit ?? 0) <= 0)
            throw new InvalidOperationException("Mã giảm giá đã hết lượt sử dụng.");
        if ((promo.UsedCount ?? 0) >= (promo.UsageLimit ?? 0))
            throw new InvalidOperationException("Mã giảm giá đã đạt giới hạn sử dụng.");

        // Check đơn hàng tối thiểu
        if ((promo.MinOrderAmount ?? 0) > request.TotalAmount)
            throw new InvalidOperationException($"Đơn hàng phải từ {(promo.MinOrderAmount ?? 0):N0} để áp dụng mã này.");

        // Tính giá trị giảm giá
        decimal discount = promo.DiscountType?.ToLower() == "percent"
            ? Math.Round(request.TotalAmount * (promo.DiscountValue / 100m), 2)
            : promo.DiscountValue;

        return new ApplyPromoResponseDto
        {
            PromoId = promo.PromoId,
            PromoCode = promo.PromoCode,
            Description = promo.Description,
            DiscountType = promo.DiscountType ?? string.Empty,
            DiscountValue = promo.DiscountValue,
            DiscountAmount = discount,
            MinOrderAmount = promo.MinOrderAmount,
            UsageLimit = promo.UsageLimit,
            UsedCount = promo.UsedCount,
            Status = promo.Status
        };
    }

    public async Task<ApplyPromoResponseDto> ValidatePromoAsync(int promoId, decimal orderTotal)
    {
        var promo = await _context.Promotions.FindAsync(promoId);
        if (promo == null) 
            throw new Exception("Mã giảm giá không hợp lệ.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if ((promo.Status ?? "").ToLower() != "active")
            throw new Exception("Mã giảm giá không còn hoạt động.");
        if (promo.StartDate > today)
            throw new Exception("Mã giảm giá chưa có hiệu lực.");
        if (promo.EndDate < today)
            throw new Exception("Mã giảm giá đã hết hạn.");
        if ((promo.UsageLimit ?? 0) <= 0)
            throw new Exception("Mã giảm giá đã hết lượt sử dụng.");
        if ((promo.UsedCount ?? 0) >= (promo.UsageLimit ?? 0))
            throw new Exception("Mã giảm giá đã đạt giới hạn sử dụng.");
        if ((promo.MinOrderAmount ?? 0) > orderTotal)
            throw new Exception($"Đơn hàng phải từ {(promo.MinOrderAmount ?? 0):N0} để áp dụng mã này.");

        decimal discount = promo.DiscountType?.ToLower() == "percent"
            ? Math.Round(orderTotal * (promo.DiscountValue / 100m), 2)
            : promo.DiscountValue;

        return new ApplyPromoResponseDto
        {
            PromoId = promo.PromoId,
            PromoCode = promo.PromoCode,
            DiscountType = promo.DiscountType ?? string.Empty,
            DiscountValue = promo.DiscountValue,
            DiscountAmount = discount
        };
    }

    public async Task<ApplyPromoResponseDto> ValidatePromoByCodeAsync(string promoCode, decimal orderTotal)
    {
        if (string.IsNullOrWhiteSpace(promoCode))
            throw new ArgumentException("Mã giảm giá không hợp lệ.");

        var promo = await _context.Promotions.FirstOrDefaultAsync(p => p.PromoCode == promoCode);
        if (promo == null)
            throw new KeyNotFoundException("Mã giảm giá không tồn tại.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if ((promo.Status ?? "").ToLower() != "active")
            throw new InvalidOperationException("Mã giảm giá không còn hoạt động.");
        if (promo.StartDate > today)
            throw new InvalidOperationException("Mã giảm giá chưa có hiệu lực.");
        if (promo.EndDate < today)
            throw new InvalidOperationException("Mã giảm giá đã hết hạn.");
        if ((promo.UsageLimit ?? 0) <= 0 || (promo.UsedCount ?? 0) >= (promo.UsageLimit ?? 0))
            throw new InvalidOperationException("Mã giảm giá đã hết lượt sử dụng.");
        if ((promo.MinOrderAmount ?? 0) > orderTotal)
            throw new InvalidOperationException($"Đơn hàng phải từ {(promo.MinOrderAmount ?? 0):N0} để áp dụng mã này.");

        decimal discount = promo.DiscountType?.ToLower() == "percent"
            ? Math.Round(orderTotal * (promo.DiscountValue / 100m), 2)
            : promo.DiscountValue;

        return new ApplyPromoResponseDto
        {
            PromoId = promo.PromoId,
            PromoCode = promo.PromoCode,
            DiscountType = promo.DiscountType ?? string.Empty,
            DiscountValue = promo.DiscountValue,
            DiscountAmount = discount
        };
    }

    public async Task GiftVoucherAsync(GiftVoucherDto dto)
    {
        var promo = await _context.Promotions.FindAsync(dto.PromoId);
        if (promo == null) throw new KeyNotFoundException("Không tìm thấy mã khuyến mãi.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if ((promo.Status ?? "").ToLower() != "active") throw new InvalidOperationException("Mã khuyến mãi không hoạt động.");
        if (promo.EndDate < today) throw new InvalidOperationException("Mã khuyến mãi đã hết hạn.");
        if ((promo.UsedCount ?? 0) >= (promo.UsageLimit ?? 0)) throw new InvalidOperationException("Mã khuyến mãi đã hết lượt sử dụng.");

        var customers = await _context.Customers
            .Where(c => dto.CustomerIds.Contains(c.CustomerId))
            .ToListAsync();

        foreach (var customer in customers)
        {
            if (!string.IsNullOrEmpty(customer.Email))
            {
                string subject = "🎁 Quà Tặng Đặc Biệt Dành Riêng Cho Bạn!";
                string body = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .content {{ padding: 30px 20px; text-align: center; }}
        .greeting {{ font-size: 18px; margin-bottom: 20px; color: #555; }}
        .promo-box {{ background-color: #f8f9fa; border: 2px dashed #764ba2; border-radius: 8px; padding: 20px; margin: 25px 0; display: inline-block; }}
        .promo-code {{ font-size: 32px; font-weight: bold; color: #764ba2; letter-spacing: 2px; margin: 10px 0; display: block; }}
        .promo-desc {{ color: #666; font-style: italic; margin-bottom: 5px; }}
        .expiry {{ color: #e74c3c; font-weight: bold; font-size: 14px; }}
        .cta-button {{ display: inline-block; background-color: #764ba2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; transition: background 0.3s; }}
        .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 Chúc Mừng Bạn Nhận Được Quà Tặng!</h1>
        </div>
        <div class='content'>
            <p class='greeting'>Xin chào <strong>{customer.Name}</strong>,</p>
            <p>Cảm ơn bạn đã luôn tin tưởng và đồng hành cùng chúng tôi. Để tri ân sự ủng hộ của bạn, chúng tôi xin gửi tặng bạn một mã giảm giá đặc biệt:</p>
            
            <div class='promo-box'>
                <span class='promo-desc'>{promo.Description}</span>
                <span class='promo-code'>{promo.PromoCode}</span>
                <span class='expiry'>Hạn sử dụng: {promo.EndDate:dd/MM/yyyy}</span>
            </div>
            
            <p>Hãy sử dụng mã này cho đơn hàng tiếp theo của bạn nhé!</p>
        </div>
        <div class='footer'>
            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
            <p>&copy; {DateTime.Now.Year} Store Management. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
                try
                {
                    await _emailService.SendEmailAsync(customer.Email, subject, body);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send email to {customer.Email}: {ex.Message}");
                }
            }
        }
    }


    public async Task<PagedResultDto<PromotionDto>> GetPagedAsync(int page, int pageSize, string? search, string? searchField)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var q = search?.Trim().ToLower();
        var query = _context.Promotions.AsQueryable();
        if (!string.IsNullOrEmpty(q))
            query = query.Where(p => p.PromoCode.ToLower().Contains(q) || (p.Description != null && p.Description.ToLower().Contains(q)));
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(p => p.PromoId).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new PromotionDto { PromoId = p.PromoId, PromoCode = p.PromoCode, Description = p.Description, DiscountType = p.DiscountType, DiscountValue = p.DiscountValue, StartDate = p.StartDate, EndDate = p.EndDate, MinOrderAmount = p.MinOrderAmount, UsageLimit = p.UsageLimit, UsedCount = p.UsedCount, Status = p.Status })
            .ToListAsync();
        return new PagedResultDto<PromotionDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }
}