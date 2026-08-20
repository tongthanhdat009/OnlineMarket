using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using dotnet_backend.Dtos;
using dotnet_backend.Services.Interface;
using dotnet_backend.Database;
using dotnet_backend.Models;
using dotnet_backend.Controllers; 

namespace dotnet_backend.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly PromotionService _promotionService;
    private readonly IS3Service _s3Service;

    public OrderService(ApplicationDbContext context, PromotionService promotionService, IS3Service s3Service)
    {
        _context = context;
        _promotionService = promotionService;
        _s3Service = s3Service;
    }

    public async Task<IEnumerable<PromotionDto>> GetAllPromosAsync()
    {
        return await _context.Promotions
            .Select(p => new PromotionDto
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
                Status = p.Status,
            })
            .ToListAsync();
    }
    public async Task<IEnumerable<OrderDto>> GetOrdersOfflineAsync()
    {
        return await _context.Orders
            .Where(o => o.OrderType == "offline")
            // sort by OrderDate descending (newest first)
            .OrderByDescending(o => o.OrderDate)
            .Include(o => o.Customer)
            .Include(o => o.Payments)
            .Include(o => o.User)
            .Select(o => new OrderDto
            {
                OrderId = o.OrderId,
                CustomerId = o.CustomerId,
                UserId = o.UserId,
                PromoId = o.PromoId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                DiscountAmount = o.DiscountAmount,
                PayStatus = o.PayStatus,
                OrderStatus = o.OrderStatus,
                OrderType = o.OrderType,
                Name = o.Name,
                Address = o.Address,
                Phone = o.Phone,
                Email = o.Email,

                Customer = o.Customer == null ? null : new CustomerDto
                {
                    CustomerId = o.Customer.CustomerId,
                    Name = o.Customer.Name,
                    Email = o.Customer.Email,
                    Phone = o.Customer.Phone,
                    Address = o.Customer.Address,
                    CreatedAt = o.Customer.CreatedAt
                },

                Payments = o.Payments.Select(p => new PaymentDto
                {
                    PaymentId = p.PaymentId,
                    OrderId = p.OrderId,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod ?? "",
                    PaymentDate = p.PaymentDate ?? DateTime.MinValue
                }).ToList(),

                User = o.User == null ? null : new UserDto
                {
                    UserId = o.User.UserId,
                    Username = o.User.Username,
                    Password = "",
                    FullName = o.User.FullName,
                    Role = o.User.Role,
                    CreatedAt = o.User.CreatedAt
                }
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<OrderDto>> GetOrdersOnlineAsync()
    {
        return await _context.Orders
            .Where(o => o.OrderType == "online" && !o.RefundRequests.Any(r => r.Status == "pending"))
            // sort by OrderDate descending (newest first)
            .OrderByDescending(o => o.OrderDate)
            .Include(o => o.Customer)
            .Include(o => o.Payments)
            .Include(o => o.User)
            .Select(o => new OrderDto
            {
                OrderId = o.OrderId,
                CustomerId = o.CustomerId,
                UserId = o.UserId,
                PromoId = o.PromoId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                DiscountAmount = o.DiscountAmount,
                PayStatus = o.PayStatus,
                OrderStatus = o.OrderStatus,
                OrderType = o.OrderType,
                Name = o.Name,
                Address = o.Address,
                Phone = o.Phone,
                Email = o.Email,

                Customer = o.Customer == null ? null : new CustomerDto
                {
                    CustomerId = o.Customer.CustomerId,
                    Name = o.Customer.Name,
                    Email = o.Customer.Email,
                    Phone = o.Customer.Phone,
                    Address = o.Customer.Address,
                    CreatedAt = o.Customer.CreatedAt
                },

                Payments = o.Payments.Select(p => new PaymentDto
                {
                    PaymentId = p.PaymentId,
                    OrderId = p.OrderId,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod ?? "",
                    PaymentDate = p.PaymentDate ?? DateTime.MinValue
                }).ToList(),

                User = o.User == null ? null : new UserDto
                {
                    UserId = o.User.UserId,
                    Username = o.User.Username,
                    Password = "",
                    FullName = o.User.FullName,
                    Role = o.User.Role,
                    CreatedAt = o.User.CreatedAt
                }
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<OrderDto>> GetOrdersByUserIdAsync(int userId)
    {
        // Deprecated: replaced by GetOrdersByCustomerIdAsync
        return Enumerable.Empty<OrderDto>();
    }

    public async Task<PagedResultDto<OrderDto>> GetOnlineOrdersByCustomerPagedAsync(
        int customerId, int page, int pageSize, string? status = null, string? keyword = null)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _context.Orders
            .AsNoTracking()
            .Where(o => o.CustomerId == customerId && o.OrderType == "online");

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (status.Equals("refund", StringComparison.OrdinalIgnoreCase))
                query = query.Where(o => o.RefundRequests.Any(r => r.Status == "pending" || r.Status == "approved"));
            else
                query = query.Where(o => o.OrderStatus == status);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            if (int.TryParse(normalized, out var orderId))
            {
                query = query.Where(o => o.OrderId == orderId ||
                    (o.PayStatus != null && o.PayStatus.Contains(normalized)) ||
                    (o.OrderStatus != null && o.OrderStatus.Contains(normalized)));
            }
            else
            {
                query = query.Where(o =>
                    (o.PayStatus != null && o.PayStatus.Contains(normalized)) ||
                    (o.OrderStatus != null && o.OrderStatus.Contains(normalized)));
            }
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new OrderDto
            {
                OrderId = o.OrderId,
                CustomerId = o.CustomerId,
                UserId = o.UserId,
                PromoId = o.PromoId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                DiscountAmount = o.DiscountAmount,
                PayStatus = o.PayStatus,
                OrderStatus = o.OrderStatus,
                OrderType = o.OrderType,
                PaymentMethod = o.Payments.Select(p => p.PaymentMethod).FirstOrDefault(),
                Name = o.Name,
                Address = o.Address,
                Phone = o.Phone,
                Email = o.Email
            })
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<OrderDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<IEnumerable<OrderDto>> GetOrdersByCustomerIdAsync(int customerId)
    {
        // Return summary order info for a customer (no OrderItems/detail)
        return await _context.Orders
            .Where(o => o.CustomerId == customerId)
            .Include(o => o.Customer)
            .Include(o => o.Payments)
            .Include(o => o.User)
            .Select(o => new OrderDto
            {
                OrderId = o.OrderId,
                CustomerId = o.CustomerId,
                UserId = o.UserId,
                PromoId = o.PromoId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                DiscountAmount = o.DiscountAmount,
                PayStatus = o.PayStatus,
                OrderStatus = o.OrderStatus,
                OrderType = o.OrderType,
                Name = o.Name,
                Address = o.Address,
                Phone = o.Phone,
                Email = o.Email,

                Customer = o.Customer == null ? null : new CustomerDto
                {
                    CustomerId = o.Customer.CustomerId,
                    Name = o.Customer.Name,
                    Email = o.Customer.Email,
                    Phone = o.Customer.Phone,
                    Address = o.Customer.Address,
                    CreatedAt = o.Customer.CreatedAt
                },

                Payments = o.Payments.Select(p => new PaymentDto
                {
                    PaymentId = p.PaymentId,
                    OrderId = p.OrderId,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod ?? "",
                    PaymentDate = p.PaymentDate ?? DateTime.MinValue
                }).ToList(),

                User = o.User == null ? null : new UserDto
                {
                    UserId = o.User.UserId,
                    Username = o.User.Username,
                    Password = "",
                    FullName = o.User.FullName,
                    Role = o.User.Role,
                    CreatedAt = o.User.CreatedAt
                }
            })
            .ToListAsync();
    }

    public async Task<int> UpdateOrderAndBillStatusAsync(int orderId, string statusOrder, string statusBill)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Lấy thông tin ORDER
            var order = await _context.Orders
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
                throw new Exception("Khong tim thay don hang");

            // Lấy thông tin BILL
            var bill = await _context.Bills
                .FirstOrDefaultAsync(b => b.OrderId == orderId);

            if (bill == null)
                throw new Exception("Khong tim thay hoa don");

            // LOGIC HỦY ĐỌN HÀNG
            if (statusOrder == "canceled")
            {
                // Kiểm tra xem đơn hàng đã thanh toán thành công chưa
                bool isPaid = order.PayStatus == "paid";
                bool hasSuccessfulPayment = order.Payments.Any(p => p.TransactionStatus == "success");

                if (isPaid && hasSuccessfulPayment)
                {
                    // Đơn hàng đã thanh toán thành công -> Cần REFUND
                    order.PayStatus = "refunded";
                    order.OrderStatus = "canceled";
                    
                    bill.PayStatus = "refunded";
                    bill.BillStatus = "canceled";

                    // Cập nhật trạng thái payment về pending (chờ hoàn tiền)
                    foreach (var payment in order.Payments.Where(p => p.TransactionStatus == "success"))
                    {
                        payment.TransactionStatus = "pending";
                    }
                }
                else
                {
                    // Đơn hàng chưa thanh toán -> HỦY BÌNH THƯỜNG
                    order.PayStatus = "canceled";
                    order.OrderStatus = "canceled";
                    
                    bill.PayStatus = "unpaid";
                    bill.BillStatus = "canceled";

                    // Cập nhật trạng thái payment về failed
                    foreach (var payment in order.Payments)
                    {
                        if (payment.TransactionStatus == "pending")
                        {
                            payment.TransactionStatus = "failed";
                        }
                    }
                }
            }
            else
            {
                // CẬP NHẬT TRẠNG THÁI THÔNG THƯỜNG (không phải hủy đơn)
                order.PayStatus = statusOrder;
                order.OrderStatus = statusOrder;
                
                bill.PayStatus = statusBill;
                bill.BillStatus = statusBill;

                if (statusBill == "paid")
                {
                    bill.PaidAt = DateTime.Now;
                }
            }

            // Lưu thay đổi
            int result = await _context.SaveChangesAsync();

            // Commit transaction
            await transaction.CommitAsync();

            return result; // số dòng bị ảnh hưởng
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<IEnumerable<OrderDto>> GetOnlineOrdersByCustomerIdAsync(int customerId)
    {
        return await _context.Orders
            .Where(o => o.CustomerId == customerId && o.OrderType == "online")
            .OrderByDescending(o => o.OrderDate)
            .Include(o => o.Customer)
            .Include(o => o.Payments)
            .Include(o => o.User)
            .Select(o => new OrderDto
            {
                OrderId = o.OrderId,
                CustomerId = o.CustomerId,
                UserId = o.UserId,
                PromoId = o.PromoId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                DiscountAmount = o.DiscountAmount,
                PayStatus = o.PayStatus,
                OrderStatus = o.OrderStatus,
                OrderType = o.OrderType,
                PaymentMethod = o.Payments.FirstOrDefault() != null ? o.Payments.FirstOrDefault()!.PaymentMethod : null,
                Name = o.Name,
                Address = o.Address,
                Phone = o.Phone,
                Email = o.Email,

                Customer = o.Customer == null ? null : new CustomerDto
                {
                    CustomerId = o.Customer.CustomerId,
                    Name = o.Customer.Name,
                    Email = o.Customer.Email,
                    Phone = o.Customer.Phone,
                    Address = o.Customer.Address,
                    CreatedAt = o.Customer.CreatedAt
                },

                Payments = o.Payments.Select(p => new PaymentDto
                {
                    PaymentId = p.PaymentId,
                    OrderId = p.OrderId,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod ?? "",
                    PaymentDate = p.PaymentDate ?? DateTime.MinValue
                }).ToList(),

                User = o.User == null ? null : new UserDto
                {
                    UserId = o.User.UserId,
                    Username = o.User.Username,
                    Password = "",
                    FullName = o.User.FullName,
                    Role = o.User.Role,
                    CreatedAt = o.User.CreatedAt
                }
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<PeakTimeDto>> GetPeakTimeStatsAsync()
    {
        var result = await _context.Orders
            .Where(o => o.OrderDate.HasValue)
            .Select(o => o.OrderDate!.Value.TimeOfDay)
            .ToListAsync();

        if (!result.Any()) return new List<PeakTimeDto>();

        int morning = result.Count(t => t >= new TimeSpan(7, 0, 0) && t < new TimeSpan(11, 30, 0));
        int afternoon = result.Count(t => t >= new TimeSpan(11, 30, 0) && t < new TimeSpan(17, 0, 0));
        int evening = result.Count(t => t >= new TimeSpan(17, 0, 0) && t < new TimeSpan(20, 30, 0));

        int total = morning + afternoon + evening;

        if (total == 0) return new List<PeakTimeDto>();

        return new List<PeakTimeDto>
        {
            new PeakTimeDto { TimeRange = "07:00 - 11:30", Percentage = Math.Round((decimal)morning / total * 100, 2) },
            new PeakTimeDto { TimeRange = "11:30 - 17:00", Percentage = Math.Round((decimal)afternoon / total * 100, 2) },
            new PeakTimeDto { TimeRange = "17:00 - 20:30", Percentage = Math.Round((decimal)evening / total * 100, 2) },
        };
    }

    public async Task<int> GetTotalOrdersAsync()
    {
        return await _context.Orders.CountAsync();
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var orders = await _context.Orders.ToListAsync();
        
        // All orders count
        var totalOrders = orders.Count;
        var totalOnlineOrders = orders.Count(o => o.OrderType == "online");
        var totalOfflineOrders = orders.Count(o => o.OrderType == "offline");
        
        // Completed & Paid orders
        var completedOrders = orders.Where(o => o.OrderStatus == "completed" && o.PayStatus == "paid").ToList();
        var completedCount = completedOrders.Count;
        var completedOnlineCount = completedOrders.Count(o => o.OrderType == "online");
        var completedOfflineCount = completedOrders.Count(o => o.OrderType == "offline");
        
        // Revenue from completed & paid orders
        var totalRevenue = completedOrders.Sum(o => o.TotalAmount ?? 0);
        var onlineRevenue = completedOrders.Where(o => o.OrderType == "online").Sum(o => o.TotalAmount ?? 0);
        var offlineRevenue = completedOrders.Where(o => o.OrderType == "offline").Sum(o => o.TotalAmount ?? 0);
        
        return new DashboardStatsDto
        {
            TotalOrders = totalOrders,
            TotalOnlineOrders = totalOnlineOrders,
            TotalOfflineOrders = totalOfflineOrders,
            CompletedOrders = completedCount,
            CompletedOnlineOrders = completedOnlineCount,
            CompletedOfflineOrders = completedOfflineCount,
            TotalRevenue = totalRevenue,
            OnlineRevenue = onlineRevenue,
            OfflineRevenue = offlineRevenue
        };
    }


    public async Task<IEnumerable<OrderByMonthDto>> GetOrdersByYearAsync(int year)
    {
        var result = await _context.Orders
                    .Where(o => o.OrderDate.HasValue && o.OrderDate.Value.Year == year)
                    .GroupBy(o => o.OrderDate!.Value.Month)
                    .Select(g => new OrderByMonthDto
                    {
                        Month = g.Key,
                        TotalOrders = g.Count()
                    })
                    .OrderBy(o => o.Month)
                    .ToListAsync();



        var fullYear = Enumerable.Range(1, 12)
            .GroupJoin(result,
                m => m,
                r => r.Month,
                (m, r) => new OrderByMonthDto
                {
                    Month = m,
                    TotalOrders = r.FirstOrDefault()?.TotalOrders ?? 0
                })
            .ToList();

        return fullYear;
    }

    public async Task<IEnumerable<SalesByMonthDto>> GetSalesByYearAsync(int year)
    {
        var result = await _context.Orders
            .Where(o => o.OrderDate.HasValue && o.OrderDate.Value.Year == year)
            .GroupBy(o => o.OrderDate!.Value.Month)
            .Select(g => new SalesByMonthDto
            {
                Month = g.Key,
                TotalSales = g.Sum(o => o.TotalAmount ?? 0)
            })
            .OrderBy(o => o.Month)
            .ToListAsync();

        var fullYear = Enumerable.Range(1, 12)
            .GroupJoin(result,
                m => m,
                r => r.Month,
                (m, r) => new SalesByMonthDto
                {
                    Month = m,
                    TotalSales = r.FirstOrDefault()?.TotalSales ?? 0
                })
            .ToList();

        return fullYear;
    }

    public async Task<IEnumerable<OrderByMonthDto>> GetCompletedOrdersByYearAsync(int year)
    {
        var result = await _context.Orders
            .Where(o => o.OrderDate.HasValue && o.OrderDate.Value.Year == year && o.OrderStatus == "completed" && o.PayStatus == "paid")
            .GroupBy(o => o.OrderDate!.Value.Month)
            .Select(g => new OrderByMonthDto
            {
                Month = g.Key,
                TotalOrders = g.Count()
            })
            .OrderBy(o => o.Month)
            .ToListAsync();

        var fullYear = Enumerable.Range(1, 12)
            .GroupJoin(result,
                m => m,
                r => r.Month,
                (m, r) => new OrderByMonthDto
                {
                    Month = m,
                    TotalOrders = r.FirstOrDefault()?.TotalOrders ?? 0
                })
            .ToList();

        return fullYear;
    }

    public async Task<IEnumerable<SalesByMonthDto>> GetCompletedSalesByYearAsync(int year)
    {
        var result = await _context.Orders
            .Where(o => o.OrderDate.HasValue && o.OrderDate.Value.Year == year && o.OrderStatus == "completed" && o.PayStatus == "paid")
            .GroupBy(o => o.OrderDate!.Value.Month)
            .Select(g => new SalesByMonthDto
            {
                Month = g.Key,
                TotalSales = g.Sum(o => o.TotalAmount ?? 0)
            })
            .OrderBy(o => o.Month)
            .ToListAsync();

        var fullYear = Enumerable.Range(1, 12)
            .GroupJoin(result,
                m => m,
                r => r.Month,
                (m, r) => new SalesByMonthDto
                {
                    Month = m,
                    TotalSales = r.FirstOrDefault()?.TotalSales ?? 0
                })
            .ToList();

        return fullYear;
    }

    public async Task<IEnumerable<DailyOrderStatsDto>> GetDailyOrderStatsAsync(int year, int month)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        // Lấy đơn hàng hoàn thành & đã thanh toán trong tháng
        var ordersInMonth = await _context.Orders
            .Where(o => o.OrderDate.HasValue 
                && o.OrderDate.Value >= startDate 
                && o.OrderDate.Value < endDate
                && o.OrderStatus == "completed"
                && o.PayStatus == "paid")
            .Include(o => o.Customer)
            .ToListAsync();

        // Group theo ngày và tính toán thống kê
        var dailyStats = ordersInMonth
            .GroupBy(o => o.OrderDate!.Value.Date)
            .Select(g =>
            {
                // Tìm khách hàng mua nhiều nhất trong ngày
                var topCustomer = g
                    .Where(o => o.Customer != null)
                    .GroupBy(o => new { o.CustomerId, o.Customer!.Name })
                    .Select(cg => new
                    {
                        CustomerId = cg.Key.CustomerId,
                        CustomerName = cg.Key.Name,
                        TotalAmount = cg.Sum(o => o.TotalAmount ?? 0),
                        TotalOrders = cg.Count()
                    })
                    .OrderByDescending(c => c.TotalAmount)
                    .FirstOrDefault();

                // Online/Offline breakdown
                var onlineOrders = g.Where(o => o.OrderType == "online").ToList();
                var offlineOrders = g.Where(o => o.OrderType == "offline").ToList();

                return new DailyOrderStatsDto
                {
                    Date = g.Key,
                    TotalOrders = g.Count(),
                    TotalAmount = g.Sum(o => o.TotalAmount ?? 0),
                    TopCustomerName = topCustomer?.CustomerName ?? "Khách lẻ",
                    TopCustomerAmount = topCustomer?.TotalAmount ?? 0,
                    TopCustomerOrders = topCustomer?.TotalOrders ?? 0,
                    OnlineOrders = onlineOrders.Count,
                    OnlineAmount = onlineOrders.Sum(o => o.TotalAmount ?? 0),
                    OfflineOrders = offlineOrders.Count,
                    OfflineAmount = offlineOrders.Sum(o => o.TotalAmount ?? 0)
                };
            })
            .OrderBy(d => d.Date)
            .ToList();

        return dailyStats;
    }


    public async Task<OrderDto> GetOrderByIdAsync(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Payments)
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.OrderId == id);

        if (order == null) return null!;

        var result = new OrderDto
        {
            OrderId = order.OrderId,
            CustomerId = order.CustomerId,
            UserId = order.UserId,
            PromoId = order.PromoId,          // <- thêm
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,  // <- thêm
            DiscountAmount = order.DiscountAmount, // <- thêm
            PayStatus = order.PayStatus,
            OrderStatus = order.OrderStatus,
            OrderType = order.OrderType,
            Name = order.Name,
            Address = order.Address,
            Phone = order.Phone,
            Email = order.Email,

            Customer = order.Customer == null ? null : new CustomerDto
            {
                CustomerId = order.Customer.CustomerId,
                Name = order.Customer.Name,
                Email = order.Customer.Email,
                Phone = order.Customer.Phone,
                Address = order.Customer.Address,
                CreatedAt = order.Customer.CreatedAt
            },

            Payments = order.Payments.Select(p => new PaymentDto
            {
                PaymentId = p.PaymentId,
                OrderId = p.OrderId,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod ?? "",
                PaymentDate = p.PaymentDate ?? DateTime.MinValue
            }).ToList(),

            User = order.User == null ? null : new UserDto
            {
                UserId = order.User.UserId,
                Username = order.User.Username,
                Password = "",
                FullName = order.User.FullName,
                Role = order.User.Role,
                CreatedAt = order.User.CreatedAt
            },

            OrderItems = order.OrderItems.Select(oi => new OrderItemDto
            {
                OrderItemId = oi.OrderItemId,
                OrderId = oi.OrderId,
                ProductId = oi.ProductId,
                Quantity = oi.Quantity,
                Price = oi.Price,
                Subtotal = oi.Subtotal,
                Product = oi.Product == null ? null : new ProductDto
                {
                    ProductId = oi.Product.ProductId,
                    ProductName = oi.Product.ProductName,
                    Price = oi.Product.Price,
                    Barcode = oi.Product.Barcode ?? "",
                    Unit = oi.Product.Unit ?? "",
                    CreatedAt = oi.Product.CreatedAt,
                    CategoryId = oi.Product.CategoryId,
                    SupplierId = oi.Product.SupplierId,
                    ImageUrl = oi.Product.ImageUrl
                }
            }).ToList()
        };

        foreach (var item in result.OrderItems)
        {
            if (!string.IsNullOrWhiteSpace(item.Product?.ImageUrl) &&
                !(Uri.TryCreate(item.Product.ImageUrl, UriKind.Absolute, out var imageUri) &&
                  (imageUri.Scheme == Uri.UriSchemeHttp || imageUri.Scheme == Uri.UriSchemeHttps)))
            {
                item.Product!.ImageUrl = await _s3Service.GetImageUrlAsync(item.Product.ImageUrl);
            }
        }

        return result;
    }


    public async Task<bool> CancelOrderAsync(int orderId, CancelOrderDto? cancelDto = null)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.Payments)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (order == null)
                throw new Exception("Khong tim thay don hang");

            if (order.PayStatus == "canceled")
                throw new Exception("Don hang da bi huy truoc do");

            // Lấy bill một lần ở đầu
            var bill = await _context.Bills.FirstOrDefaultAsync(b => b.OrderId == orderId);
            
            // Lấy payment method
            var payment = order.Payments.FirstOrDefault();
            var paymentMethod = payment?.PaymentMethod?.ToLower() ?? "cash";
            var isVNPay = paymentMethod == "bank_transfer" || paymentMethod == "vnpay";

            // Nếu là pending thì chỉ cần đổi trạng thái, không cần hoàn kho hoặc kiểm tra ngày
            if (order.PayStatus == "pending")
            {
                order.PayStatus = "canceled";
                order.OrderStatus = "canceled";
                
                // Cập nhật bill nếu có
                if (bill != null)
                {
                    bill.PayStatus = "unpaid";
                    bill.BillStatus = "canceled";
                }
                
                // Cập nhật payment status
                if (payment != null)
                {
                    payment.TransactionStatus = "failed";
                }
                
                _context.Orders.Update(order);
                await _context.SaveChangesAsync();
                return true;
            }

            // Nếu đã thanh toán (paid)
            if (order.PayStatus == "paid")
            {
                // Kiểm tra ngày đặt hàng
                if (order.OrderDate == null)
                    throw new Exception("Đơn hàng không có ngày đặt hợp lệ.");

                if (order.OrderDate.Value.Date != DateTime.Now.Date)
                    throw new Exception("Chỉ có thể hủy đơn hàng trong cùng ngày.");

                // Tính tổng tiền cần hoàn
                var refundAmount = (order.TotalAmount ?? 0) - (order.DiscountAmount ?? 0);

                if (isVNPay)
                {
                    // ĐƠN VNPAY ĐÃ THANH TOÁN: Tạo Refund Request và cập nhật trạng thái
                    Console.WriteLine($"[CancelOrder] Đơn VNPAY - Tạo RefundRequest cho OrderId={orderId}");
                    
                    // Kiểm tra xem đã có refund request pending chưa
                    var existingRefund = await _context.RefundRequests
                        .AnyAsync(r => r.OrderId == orderId && r.Status == "pending");
                    
                    if (!existingRefund)
                    {
                        // Tạo Refund Request với thông tin từ cancelDto
                        var refundRequest = new RefundRequest
                        {
                            OrderId = orderId,
                            RefundAmount = refundAmount,
                            Reason = cancelDto?.Reason ?? "Khách hàng yêu cầu hủy đơn",
                            CustomerBankName = cancelDto?.CustomerBankName,
                            CustomerBankAccount = cancelDto?.CustomerBankAccount,
                            CustomerAccountHolder = cancelDto?.CustomerAccountHolder,
                            Status = "pending",
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        _context.RefundRequests.Add(refundRequest);
                    }

                    // GIỮ NGUYÊN pay_status = "paid" - Chờ Admin duyệt yêu cầu hoàn tiền
                    // Chỉ đổi order_status thành "canceled"
                    order.OrderStatus = "canceled";
                    
                    if (bill != null)
                    {
                        // Giữ nguyên bill.PayStatus = "paid"
                        bill.BillStatus = "canceled";
                    }

                    // KHÔNG hoàn kho - Chờ Admin xác nhận yêu cầu hoàn tiền
                }
                else
                {
                    // ĐƠN TIỀN MẶT ĐÃ THANH TOÁN: Hủy và hoàn tiền trực tiếp
                    Console.WriteLine($"[CancelOrder] Đơn tiền mặt - Hủy trực tiếp OrderId={orderId}");
                    
                    // GIỮ NGUYÊN pay_status = "paid" - Chờ xử lý hoàn tiền
                    order.OrderStatus = "canceled";

                    // Tạo payment âm để đánh dấu hoàn tiền
                    var refundPayment = new Payment
                    {
                        OrderId = orderId,
                        Amount = -refundAmount,
                        PaymentMethod = paymentMethod,
                        TransactionStatus = "success",
                        PaymentDate = DateTime.Now
                    };
                    _context.Payments.Add(refundPayment);

                    if (bill != null)
                    {
                        // Giữ nguyên bill.PayStatus = "paid"
                        bill.BillStatus = "canceled";
                    }

                    // Tiền mặt không trừ kho khi thanh toán, chỉ trừ khi Admin duyệt
                    // Nên không cần hoàn kho ở đây
                }
            }

            _context.Orders.Update(order);
            
            Console.WriteLine($"[CancelOrder] Bắt đầu SaveChanges cho OrderId={orderId}");
            await _context.SaveChangesAsync();
            Console.WriteLine($"[CancelOrder] Hoàn tất hủy đơn hàng OrderId={orderId}");

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CancelOrder] LỖI: {ex.Message}");
            Console.WriteLine($"[CancelOrder] StackTrace: {ex.StackTrace}");
            throw new Exception($"Lỗi khi hủy đơn hàng ID {orderId}: {ex.Message}", ex);
        }
    }

    public async Task<OrderDto> CreateOrderAsync(OrderDto orderDto)
    {
        // Require customerId provided by frontend. Accept 0 or any integer, but ensure the customer exists.
        if (orderDto.CustomerId == null)
        {
            throw new ArgumentException("customerId là bắt buộc.");
        }

        var customer = await _context.Customers.FindAsync(orderDto.CustomerId.Value);
        if (customer == null)
        {
            throw new ArgumentException("customerId không tồn tại trong hệ thống.");
        }
        if (orderDto.OrderItems.Count == 0)
        {
            throw new ArgumentException("Đơn hàng phải có ít nhất một món.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            orderDto.TotalAmount = 0;
            foreach (var itemDto in orderDto.OrderItems)
            {
                // ... (Logic kiểm tra giá và tạo OrderItem không đổi) ...
                var product = await _context.Products.FindAsync(itemDto.ProductId);
                if (product == null) throw new ArgumentException($"Sản phẩm với ID {itemDto.ProductId} không tồn tại.");
                if (product.Price != itemDto.Price) throw new ArgumentException($"Giá của sản phẩm '{product.ProductName}' không chính xác.");
                itemDto.Subtotal = itemDto.Quantity * product.Price ?? 0;
                orderDto.TotalAmount += itemDto.Subtotal;
            }

            if (orderDto.PromoId == null)
            {
                orderDto.DiscountAmount = 0;
            }
            else
            {
                var promo = await _context.Promotions.FindAsync(orderDto.PromoId);
                if (promo == null)
                    throw new ArgumentException("Không tìm thấy khuyến mãi.");

                if (promo.Status != "active")
                    throw new ArgumentException("Khuyến mãi không còn hiệu lực.");

                if (promo.UsedCount >= promo.UsageLimit)
                    throw new ArgumentException("Khuyến mãi đã đạt giới hạn sử dụng.");

                if (orderDto.TotalAmount < promo.MinOrderAmount)
                    throw new ArgumentException("Tổng đơn hàng không đạt yêu cầu để áp dụng khuyến mãi.");

                if (promo.DiscountType == "percent")
                {
                    orderDto.DiscountAmount = orderDto.TotalAmount * promo.DiscountValue / 100;
                }
                else if (promo.DiscountType == "fixed")
                {
                    orderDto.DiscountAmount = promo.DiscountValue;
                }
                else
                {
                    throw new ArgumentException("Loại khuyến mãi không hợp lệ.");
                }
                promo.UsedCount++;
                _context.Promotions.Update(promo);
            }
            
            // Lưu lại subtotal trước khi trừ discount để lưu vào Bill
            var subTotal = orderDto.TotalAmount;
            
            orderDto.TotalAmount -= orderDto.DiscountAmount;

            var order = new Order
            {
                CustomerId = orderDto.CustomerId,
                UserId = orderDto.UserId,
                PromoId = orderDto.PromoId,
                OrderDate = orderDto.OrderDate,
                TotalAmount = orderDto.TotalAmount,
                DiscountAmount = orderDto.DiscountAmount,
                PayStatus = "paid", // Offline order is paid immediately
                OrderStatus = "completed",
                OrderType = orderDto.OrderType ?? "offline",
                Name = orderDto.Name,
                Address = orderDto.Address,
                Phone = orderDto.Phone,
                Email = orderDto.Email,
                OrderItems = orderDto.OrderItems.Select(oi => new OrderItem
                {
                    ProductId = oi.ProductId,
                    Quantity = oi.Quantity ?? 1,
                    Price = oi.Price,
                    Subtotal = oi.Subtotal
                }).ToList()
            };

            // Add Payment (1 order chỉ có 1 payment)
            if (orderDto.Payments != null && orderDto.Payments.Any())
            {
                var paymentDto = orderDto.Payments.First();
                var payment = new Payment
                {
                    Amount = orderDto.TotalAmount ?? 0,
                    PaymentMethod = paymentDto.PaymentMethod,
                    PaymentDate = DateTime.Now,
                    TransactionStatus = "success"
                };
                order.Payments.Add(payment);
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Create Bill
            var bill = new Bill
            {
                OrderId = order.OrderId,
                CustomerId = order.CustomerId,
                TotalAmount = subTotal ?? 0,
                DiscountAmount = orderDto.DiscountAmount,
                FinalAmount = orderDto.TotalAmount ?? 0,
                PaymentMethod = order.Payments.FirstOrDefault()?.PaymentMethod ?? "cash",
                PayStatus = "paid",
                BillStatus = "pending",
                CreatedAt = DateTime.Now,
                Name = order.Name,
                Address = order.Address,
                Phone = order.Phone,
                Email = order.Email
            };
            _context.Bills.Add(bill);

            // Deduct Inventory
            foreach (var item in order.OrderItems)
            {
                var inventory = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == item.ProductId);
                if (inventory != null)
                {
                    inventory.Quantity -= item.Quantity;
                    _context.Inventories.Update(inventory);
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return await GetOrderByIdAsync(order.OrderId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    // Implement interface
    public async Task<OrderDto> PreviewOrderFromCartAsync(int customerId, int? promoId = null, string paymentMethod = "cash")
    {
        // Build order DTO from current cart without persisting or modifying DB
        // 1. Lấy giỏ hàng
        var cartItems = await _context.CartItems
            .Include(ci => ci.Product)
            .Where(ci => ci.CustomerId == customerId)
            .ToListAsync();

        if (!cartItems.Any())
            throw new ArgumentException("Giỏ hàng trống.");

        // 2. Kiểm tra tồn kho - ĐÃ TẮT: Không cần kiểm tra tồn kho
        // foreach (var ci in cartItems)
        // {
        //     var inv = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == ci.ProductId);
        //     if (inv == null) throw new Exception($"Không tìm thấy tồn kho cho sản phẩm {ci.Product.ProductName}");
        //     if (inv.Quantity < ci.Quantity) throw new Exception($"Sản phẩm {ci.Product.ProductName} chỉ còn {inv.Quantity} trong kho.");
        // }

        // 3. Tạo OrderItems
        var orderItems = cartItems.Select(ci => new OrderItemDto
        {
            ProductId = ci.ProductId,
            Quantity = ci.Quantity,
            Price = ci.Price,
            Subtotal = ci.Subtotal,
            Product = ci.Product == null ? null : new ProductDto
            {
                ProductId = ci.Product.ProductId,
                ProductName = ci.Product.ProductName,
                Price = ci.Product.Price,
                ImageUrl = ci.Product.ImageUrl
            }
        }).ToList();

        foreach (var item in orderItems)
        {
            if (!string.IsNullOrWhiteSpace(item.Product?.ImageUrl) &&
                !(Uri.TryCreate(item.Product.ImageUrl, UriKind.Absolute, out var imageUri) &&
                  (imageUri.Scheme == Uri.UriSchemeHttp || imageUri.Scheme == Uri.UriSchemeHttps)))
            {
                item.Product!.ImageUrl = await _s3Service.GetImageUrlAsync(item.Product.ImageUrl);
            }
        }

        var total = orderItems.Sum(x => x.Subtotal);

        // 4. Tính discount nếu có
        decimal discount = 0;
        int? appliedPromoId = null;
        if (promoId.HasValue)
        {
            var promoResp = await _promotionService.ValidatePromoAsync(promoId.Value, total);
            discount = promoResp.DiscountAmount;
            appliedPromoId = promoResp.PromoId;
        }

        // 5. Build OrderDto
        var orderDto = new OrderDto
        {
            CustomerId = customerId,
            PromoId = appliedPromoId,
            OrderDate = DateTime.Now,
            TotalAmount = total,
            DiscountAmount = discount,
            PayStatus = "pending",
            OrderItems = orderItems
        };

        return orderDto;
    }

    public async Task<OrderDto> CheckoutFromCartAsync(int customerId, int? userId = null, int? promoId = null, 
        string? customerName = null, string? customerAddress = null, string? customerPhone = null, string? customerEmail = null)
    {
        string? promoCode = null;

        if (promoId.HasValue)
        {
            var promo = await _context.Promotions.FindAsync(promoId.Value);
            promoCode = promo?.PromoCode;
        }

        return await CheckoutFromCartInternalAsync(customerId, userId, promoCode, "cash", customerName, customerAddress, customerPhone, customerEmail);
    }

    
    // OrderService
    public async Task<OrderDto> CheckoutFromCartAsync(CheckoutDto checkout)
    {
        if (checkout == null) throw new ArgumentNullException(nameof(checkout));

        // Nếu có PromoId nhưng không có PromoCode, lấy PromoCode từ database
        string? promoCode = checkout.PromoCode;
        if (string.IsNullOrEmpty(promoCode) && checkout.PromoId.HasValue)
        {
            var promo = await _context.Promotions.FindAsync(checkout.PromoId.Value);
            promoCode = promo?.PromoCode;
            Console.WriteLine($"[OrderService] PromoId={checkout.PromoId} -> PromoCode={promoCode}");
        }
        
        Console.WriteLine($"[OrderService] CheckoutFromCart: PromoId={checkout.PromoId}, PromoCode={promoCode}");

        return await CheckoutFromCartInternalAsync(
            checkout.CustomerId,
            null,
            promoCode,
            checkout.PaymentMethod ?? "cash",
            checkout.CustomerName,
            checkout.CustomerAddress,
            checkout.CustomerPhone,
            checkout.CustomerEmail,
            checkout.SelectedProductIds
        );
    }

    // Nếu muốn dùng từ backend theo CustomerId, UserId
    public async Task<OrderDto> CheckoutFromCartAsync(int customerId, int? userId, string? promoCode, string paymentMethod = "cash")
    {
        return await CheckoutFromCartInternalAsync(customerId, userId, promoCode, paymentMethod, null, null, null, null, null);
    }

    // Hàm private xử lý chung
    private async Task<OrderDto> CheckoutFromCartInternalAsync(
        int customerId,
        int? userId,
        string? promoCode,
        string paymentMethod,
        string? customerName = null,
        string? customerAddress = null,
        string? customerPhone = null,
        string? customerEmail = null,
        List<int>? selectedProductIds = null)
    {
        await using var tx = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1. Lấy giỏ hàng
            var cartQuery = _context.CartItems
                .Include(ci => ci.Product)
                .Where(ci => ci.CustomerId == customerId);

            // Filter by selected product IDs if provided
            if (selectedProductIds != null && selectedProductIds.Any())
            {
                cartQuery = cartQuery.Where(ci => selectedProductIds.Contains(ci.ProductId));
            }

            var cartItems = await cartQuery.ToListAsync();

            if (!cartItems.Any())
                throw new ArgumentException("Giỏ hàng trống.");

            // 2. Kiểm tra tồn kho - ĐÃ TẮT: Không cần kiểm tra tồn kho vì không trừ số lượng
            // foreach (var ci in cartItems)
            // {
            //     var inv = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == ci.ProductId);
            //     if (inv == null) throw new Exception($"Không tìm thấy tồn kho cho sản phẩm {ci.Product.ProductName}");
            //     if (inv.Quantity < ci.Quantity) throw new Exception($"Sản phẩm {ci.Product.ProductName} chỉ còn {inv.Quantity} trong kho.");
            // }

            // 3. Tạo OrderItems
            var orderItems = cartItems.Select(ci => new OrderItem
            {
                ProductId = ci.ProductId,
                Quantity = ci.Quantity,
                Price = ci.Price,
                Subtotal = ci.Subtotal
            }).ToList();

            var total = orderItems.Sum(x => x.Subtotal);

            // 4. Tính discount
            decimal discount = 0;
            int? appliedPromoId = null;

            Console.WriteLine($"[OrderService] CheckoutInternal: promoCode={promoCode}, totalAmount={total}");

            if (!string.IsNullOrWhiteSpace(promoCode))
            {
                var promoResponse = await _promotionService.ValidatePromoByCodeAsync(promoCode, total);
                discount = promoResponse.DiscountAmount;
                appliedPromoId = promoResponse.PromoId;
                
                Console.WriteLine($"[OrderService] Promo validated: discount={discount}, appliedPromoId={appliedPromoId}");

                if (appliedPromoId.HasValue)
                {
                    var promo = await _context.Promotions.FindAsync(appliedPromoId.Value);
                    if (promo != null)
                    {
                        promo.UsedCount = (promo.UsedCount ?? 0) + 1;
                        _context.Promotions.Update(promo);
                    }
                }
            }

            var finalTotal = total - discount;

            // 5. Tạo Order
            var order = new Order
            {
                CustomerId     = customerId,
                UserId         = userId,
                PromoId        = appliedPromoId,
                OrderDate      = DateTime.Now,
                TotalAmount    = total,
                DiscountAmount = discount,
                PayStatus      = "pending",
                OrderItems     = orderItems,
                OrderType      = "online",
                Name           = customerName,
                Address        = customerAddress,
                Phone          = customerPhone,
                Email          = customerEmail
            };
            
            Console.WriteLine($"[OrderService] Created Order: PromoId={order.PromoId}, Discount={order.DiscountAmount}, Total={order.TotalAmount}");
            
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // 6. Tạo Payment
            // Map vnpay to bank_transfer for database ENUM
            var dbPaymentMethod = paymentMethod?.ToLower() == "vnpay" ? "bank_transfer" : paymentMethod;
            
            var payment = new Payment
            {
                OrderId       = order.OrderId,
                Amount        = finalTotal,
                PaymentMethod = dbPaymentMethod,
                PaymentDate   = DateTime.Now
            };
            _context.Payments.Add(payment);
            // 7. Tạo Bill
            var bill = new Bill
            {
                OrderId        = order.OrderId,
                CustomerId     = customerId,
                TotalAmount    = total,
                DiscountAmount = discount,
                FinalAmount    = finalTotal,
                PaymentMethod  = paymentMethod,
                PayStatus      = "unpaid",
                CreatedAt      = DateTime.Now,
                Name           = order.Name,
                Address        = order.Address,
                Phone          = order.Phone,
                Email          = order.Email
            };

            // Cash & VNPay: giữ trạng thái pending/unpaid
            // VNPay sẽ được cập nhật qua callback
            var method = (paymentMethod ?? "").ToLower();
            if (method == "cash" || method == "vnpay")
            {
                order.PayStatus = "pending";
                bill.PayStatus = "unpaid";
                payment.TransactionStatus = "pending";
            }

            _context.Bills.Add(bill);

            // 8. Cập nhật tồn kho - ĐÃ TẮT: Không trừ số lượng inventory khi thanh toán
            // foreach (var ci in cartItems)
            // {
            //     var inv = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == ci.ProductId);
            //     if (inv != null)
            //     {
            //         inv.Quantity -= ci.Quantity;
            //         _context.Inventories.Update(inv);
            //     }
            // }

            // 9. Xóa cart items
            _context.CartItems.RemoveRange(cartItems);

            // 10. Lưu tất cả thay đổi
            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return await GetOrderByIdAsync(order.OrderId);
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            Console.WriteLine($"[ERROR] Checkout failed: {ex.Message}");
            throw;
        }
    }

    public async Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus)
    {
        var validStatuses = new List<string> { "pending", "approved", "processing", "shipping", "delivered", "completed" };
        if (!validStatuses.Contains(newStatus))
        {
            throw new ArgumentException("Invalid status. Allowed: " + string.Join(", ", validStatuses));
        }

        var order = await _context.Orders
            .Include(o => o.Payments)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null) return false;

        // Check flow
        int currentIndex = validStatuses.IndexOf(order.OrderStatus ?? string.Empty);
        int newIndex = validStatuses.IndexOf(newStatus);

        if (order.OrderStatus == "canceled") 
        {
             throw new InvalidOperationException("Cannot update a canceled order.");
        }
        
        if (currentIndex != -1 && newIndex <= currentIndex)
        {
            throw new InvalidOperationException($"Cannot update status from '{order.OrderStatus}' to '{newStatus}'. Status must move forward.");
        }

        // Logic for 'approved'
        if (newStatus == "approved")
        {
            var cashPayment = order.Payments.FirstOrDefault(p => p.PaymentMethod == "cash");
            if (cashPayment != null)
            {
                // 1. Check stock availability first
                foreach (var item in order.OrderItems)
                {
                    var inventory = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == item.ProductId);
                    if (inventory == null)
                    {
                        throw new InvalidOperationException($"Không tìm thấy kho cho sản phẩm ID {item.ProductId}");
                    }
                    if (inventory.Quantity < item.Quantity)
                    {
                        var productName = item.Product?.ProductName ?? $"ID {item.ProductId}";
                        throw new InvalidOperationException($"Không đủ hàng trong kho cho sản phẩm '{productName}'. Cần: {item.Quantity}, Còn: {inventory.Quantity}");
                    }
                }

                // 2. Deduct stock
                foreach (var item in order.OrderItems)
                {
                    var inventory = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == item.ProductId);
                    if (inventory != null)
                    {
                        inventory.Quantity -= item.Quantity;
                        _context.Inventories.Update(inventory);
                    }
                }
            }
        }

        // Logic for 'completed'
        if (newStatus == "completed")
        {
            var cashPayment = order.Payments.FirstOrDefault(p => p.PaymentMethod == "cash");
            if (cashPayment != null)
            {
                cashPayment.TransactionStatus = "success";
                order.PayStatus = "paid";
            }

            var bill = await _context.Bills.FirstOrDefaultAsync(b => b.OrderId == orderId);
            if (bill != null)
            {
                bill.BillStatus = "exported";
                bill.PayStatus = "paid";
            }
        }

        order.OrderStatus = newStatus;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelOrderAdminAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null) throw new Exception("Không tìm thấy đơn hàng.");

        if (order.OrderStatus == "completed")
            throw new Exception("Không thể hủy đơn hàng đã hoàn tất.");

        if (order.PayStatus != "pending")
            throw new Exception("Chỉ có thể hủy đơn hàng khi trạng thái thanh toán là pending.");

        // Hoàn hàng nếu đơn hàng đã qua bước duyệt (đã trừ kho)
        // Các trạng thái đã trừ kho: approved, processing, shipping, delivered
        // Trạng thái chưa trừ kho: pending
        if (order.OrderStatus != "pending")
        {
            foreach (var item in order.OrderItems)
            {
                var inventory = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == item.ProductId);
                if (inventory != null)
                {
                    inventory.Quantity += item.Quantity;
                    _context.Inventories.Update(inventory);
                }
            }
        }

        // Cập nhật trạng thái Order
        order.OrderStatus = "canceled";
        order.PayStatus = "canceled";

        // Cập nhật trạng thái Bill
        var bill = await _context.Bills.FirstOrDefaultAsync(b => b.OrderId == orderId);
        if (bill != null)
        {
            bill.BillStatus = "canceled";
            // bill.PayStatus giữ nguyên hoặc set về unpaid/refunded tùy logic, 
            // nhưng ở đây đơn chưa thanh toán (pending) nên bill cũng là unpaid.
            // Schema bill.pay_status chỉ có unpaid, paid, refunded.
            bill.PayStatus = "unpaid"; 
        }

        // Cập nhật trạng thái Payment (nếu là cash/pending)
        foreach (var p in order.Payments)
        {
            if (p.PaymentMethod == "cash" && p.TransactionStatus == "pending")
            {
                p.TransactionStatus = "failed";
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<RefundRequestDto>> GetRefundRequestsAsync()
    {
        return await _context.RefundRequests
            .Include(r => r.Order)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RefundRequestDto
            {
                RefundId = r.RefundId,
                OrderId = r.OrderId,
                RefundAmount = r.RefundAmount,
                Reason = r.Reason,
                CustomerBankName = r.CustomerBankName,
                CustomerBankAccount = r.CustomerBankAccount,
                CustomerAccountHolder = r.CustomerAccountHolder,
                Status = r.Status,
                ProcessedBy = r.ProcessedBy,
                AdminNote = r.AdminNote,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                // Map Order info if needed, or just basic info
            })
            .ToListAsync();
    }

    public async Task<bool> ConfirmRefundAsync(int refundId)
    {
        var refund = await _context.RefundRequests
            .Include(r => r.Order)
            .ThenInclude(o => o.Payments)
            .FirstOrDefaultAsync(r => r.RefundId == refundId);

        if (refund == null) throw new Exception("Yêu cầu hoàn tiền không tồn tại.");
        if (refund.Status != "pending") throw new Exception("Yêu cầu hoàn tiền không ở trạng thái chờ xử lý.");

        var order = refund.Order;
        if (order == null) throw new Exception("Không tìm thấy đơn hàng liên quan.");

        // 1. Cập nhật trạng thái Refund Request
        refund.Status = "completed";
        refund.UpdatedAt = DateTime.Now;

        // 2. Cập nhật trạng thái Order
        order.OrderStatus = "canceled";
        order.PayStatus = "refunded";

        // 3. Cập nhật trạng thái Bill
        var bill = await _context.Bills.FirstOrDefaultAsync(b => b.OrderId == order.OrderId);
        if (bill != null)
        {
            bill.BillStatus = "canceled";
            bill.PayStatus = "refunded";
        }

        // 4. Tạo Payment âm (Hoàn tiền)
        // Theo yêu cầu: Luôn dùng bank_transfer cho giao dịch hoàn tiền
        var refundPayment = new Payment
        {
            OrderId = order.OrderId,
            Amount = -refund.RefundAmount, // Số tiền âm
            PaymentMethod = "bank_transfer",
            TransactionStatus = "success",
            PaymentDate = DateTime.Now
        };
        _context.Payments.Add(refundPayment);

        // 5. Hoàn kho
        // Vì đơn hàng chuyển sang canceled, nên cần hoàn lại kho
        var orderItems = await _context.OrderItems.Where(oi => oi.OrderId == order.OrderId).ToListAsync();
        foreach (var item in orderItems)
        {
            var inventory = await _context.Inventories.FirstOrDefaultAsync(i => i.ProductId == item.ProductId);
            if (inventory != null)
            {
                inventory.Quantity += item.Quantity;
                _context.Inventories.Update(inventory);
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }


    private static IQueryable<Order> ApplyOrderSearch(IQueryable<Order> query, string? search)
    {
        var q = search?.Trim().ToLower();
        if (string.IsNullOrEmpty(q)) return query;
        return query.Where(o => o.OrderId.ToString().Contains(q) || (o.Name != null && o.Name.ToLower().Contains(q)) || (o.Phone != null && o.Phone.ToLower().Contains(q)) || (o.Customer != null && o.Customer.Name.ToLower().Contains(q)) || (o.Customer != null && o.Customer.Phone != null && o.Customer.Phone.ToLower().Contains(q)));
    }
    public async Task<PagedResultDto<OrderDto>> GetOrdersOfflinePagedAsync(int page, int pageSize, string? search, string? searchField)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = ApplyOrderSearch(_context.Orders.Where(o => o.OrderType == "offline"), search);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(o => o.OrderId).Skip((page - 1) * pageSize).Take(pageSize)
            .Include(o => o.Customer).Include(o => o.Payments).Include(o => o.User)
            .Select(o => new OrderDto { OrderId = o.OrderId, CustomerId = o.CustomerId, UserId = o.UserId, PromoId = o.PromoId, OrderDate = o.OrderDate, TotalAmount = o.TotalAmount, DiscountAmount = o.DiscountAmount, PayStatus = o.PayStatus, OrderStatus = o.OrderStatus, OrderType = o.OrderType, Name = o.Name, Address = o.Address, Phone = o.Phone, Email = o.Email,
                Customer = o.Customer == null ? null : new CustomerDto { CustomerId = o.Customer.CustomerId, Name = o.Customer.Name, Email = o.Customer.Email, Phone = o.Customer.Phone, Address = o.Customer.Address, CreatedAt = o.Customer.CreatedAt },
                Payments = o.Payments.Select(p => new PaymentDto { PaymentId = p.PaymentId, OrderId = p.OrderId, Amount = p.Amount, PaymentMethod = p.PaymentMethod ?? "", PaymentDate = p.PaymentDate ?? DateTime.MinValue }).ToList(),
                User = o.User == null ? null : new UserDto { UserId = o.User.UserId, Username = o.User.Username, Password = "", FullName = o.User.FullName, Role = o.User.Role, CreatedAt = o.User.CreatedAt } })
            .ToListAsync();
        return new PagedResultDto<OrderDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }
    public async Task<PagedResultDto<OrderDto>> GetOrdersOnlinePagedAsync(int page, int pageSize, string? search, string? searchField)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = ApplyOrderSearch(_context.Orders.Where(o => o.OrderType == "online" && !o.RefundRequests.Any(r => r.Status == "pending")), search);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(o => o.OrderId).Skip((page - 1) * pageSize).Take(pageSize)
            .Include(o => o.Customer).Include(o => o.Payments).Include(o => o.User)
            .Select(o => new OrderDto { OrderId = o.OrderId, CustomerId = o.CustomerId, UserId = o.UserId, PromoId = o.PromoId, OrderDate = o.OrderDate, TotalAmount = o.TotalAmount, DiscountAmount = o.DiscountAmount, PayStatus = o.PayStatus, OrderStatus = o.OrderStatus, OrderType = o.OrderType, Name = o.Name, Address = o.Address, Phone = o.Phone, Email = o.Email,
                Customer = o.Customer == null ? null : new CustomerDto { CustomerId = o.Customer.CustomerId, Name = o.Customer.Name, Email = o.Customer.Email, Phone = o.Customer.Phone, Address = o.Customer.Address, CreatedAt = o.Customer.CreatedAt },
                Payments = o.Payments.Select(p => new PaymentDto { PaymentId = p.PaymentId, OrderId = p.OrderId, Amount = p.Amount, PaymentMethod = p.PaymentMethod ?? "", PaymentDate = p.PaymentDate ?? DateTime.MinValue }).ToList(),
                User = o.User == null ? null : new UserDto { UserId = o.User.UserId, Username = o.User.Username, Password = "", FullName = o.User.FullName, Role = o.User.Role, CreatedAt = o.User.CreatedAt } })
            .ToListAsync();
        return new PagedResultDto<OrderDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }
    public async Task<PagedResultDto<RefundRequestDto>> GetRefundRequestsPagedAsync(int page, int pageSize, string? search, string? searchField)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var q = search?.Trim().ToLower();
        var query = _context.RefundRequests.Include(r => r.Order).ThenInclude(o => o.Customer).Include(r => r.ProcessedByUser).AsQueryable();
        if (!string.IsNullOrEmpty(q))
            query = query.Where(r => r.RefundId.ToString().Contains(q) || r.OrderId.ToString().Contains(q) || (r.Order != null && r.Order.Name != null && r.Order.Name.ToLower().Contains(q)) || (r.Order != null && r.Order.Phone != null && r.Order.Phone.ToLower().Contains(q)) || (r.Order != null && r.Order.Customer != null && r.Order.Customer.Name.ToLower().Contains(q)) || (r.Order != null && r.Order.Customer != null && r.Order.Customer.Phone != null && r.Order.Customer.Phone.ToLower().Contains(q)));
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(r => r.RefundId).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        var dtos = items.Select(r => new RefundRequestDto { RefundId = r.RefundId, OrderId = r.OrderId, RefundAmount = r.RefundAmount, Reason = r.Reason, CustomerBankName = r.CustomerBankName, CustomerBankAccount = r.CustomerBankAccount, CustomerAccountHolder = r.CustomerAccountHolder, Status = r.Status, ProcessedBy = r.ProcessedBy, ProcessedByName = r.ProcessedByUser?.FullName, AdminNote = r.AdminNote, GatewayRefundId = r.GatewayRefundId, CreatedAt = r.CreatedAt, UpdatedAt = r.UpdatedAt, CustomerName = r.Order?.Name, CustomerPhone = r.Order?.Phone, CustomerEmail = r.Order?.Email }).ToList();
        return new PagedResultDto<RefundRequestDto> { Items = dtos, TotalCount = total, Page = page, PageSize = pageSize };
    }
}