using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using dotnet_backend.Database;
using dotnet_backend.Services;
using dotnet_backend.Services.Interface;
using dotnet_backend.Models;
using Amazon.S3;
using Amazon.Runtime;

var builder = WebApplication.CreateBuilder(args);

static string? GetSetting(IConfiguration configuration, string key, string fallbackKey)
{
    var fallback = configuration[fallbackKey];
    return string.IsNullOrWhiteSpace(fallback) ? configuration[key] : fallback;
}

// 1. Lấy chuỗi kết nối từ appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");
}

// 2. Đăng ký DbContext với timeout 600 giây
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(10, 4, 0)) // MariaDB 10.4
    );
});


// 3. 🔐 Cấu hình JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Secret"];
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];
if (string.IsNullOrWhiteSpace(secretKey) || string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
{
    throw new InvalidOperationException("Jwt:Secret, Jwt:Issuer, and Jwt:Audience are required.");
}

var key = Encoding.ASCII.GetBytes(secretKey);

// ✅ Tắt auto-mapping claim types để giữ nguyên tên claim "sub"
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        NameClaimType = "sub" // ✅ Chỉ định claim "sub" là NameIdentifier
    };
});

// 4. Đăng ký dịch vụ
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true; // dễ debug
    });

// 5. Đăng ký các services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICustomerAuthService, CustomerAuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderItemService, OrderItemService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IRolePermissionService, RolePermissionService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IBillService, BillService>();
builder.Services.AddScoped<IInvoicePdfService, InvoicePdfService>();
builder.Services.AddScoped<IVNPayService, VNPayService>();
builder.Services.AddScoped<IRefundRequestService, RefundRequestService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<PromotionService>();
builder.Services.AddScoped<IOrderService, OrderService>();

// 🤖 AI Service
builder.Services.AddHttpClient(); // HttpClientFactory cho AiService
builder.Services.AddScoped<IAiService, AiService>();

// 🔹 Đăng ký AWS S3 Service
var awsAccessKey = GetSetting(builder.Configuration, "AWS:AccessKey", "AWS_ACCESS_KEY_ID");
var awsSecretKey = GetSetting(builder.Configuration, "AWS:SecretKey", "AWS_SECRET_ACCESS_KEY");
var awsRegion = GetSetting(builder.Configuration, "AWS:Region", "AWS_DEFAULT_REGION") ?? "us-east-1";
var awsEndpoint = GetSetting(builder.Configuration, "AWS:Endpoint", "AWS_ENDPOINT");
var awsPathStyle = bool.TryParse(
    GetSetting(builder.Configuration, "AWS:UsePathStyleEndpoint", "AWS_USE_PATH_STYLE_ENDPOINT"),
    out var usePathStyleEndpoint) && usePathStyleEndpoint;
var awsBucket = GetSetting(builder.Configuration, "AWS:BucketName", "AWS_BUCKET");

if (!string.IsNullOrWhiteSpace(awsAccessKey) && !string.IsNullOrWhiteSpace(awsSecretKey) && !string.IsNullOrWhiteSpace(awsBucket))
{
    var credentials = new BasicAWSCredentials(awsAccessKey, awsSecretKey);
    var config = new AmazonS3Config
    {
        RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(awsRegion),
        ForcePathStyle = awsPathStyle
    };

    if (Uri.TryCreate(awsEndpoint, UriKind.Absolute, out var endpoint))
    {
        config.ServiceURL = endpoint.ToString().TrimEnd('/');
        config.AuthenticationRegion = awsRegion;
    }

    builder.Services.AddSingleton<IAmazonS3>(new AmazonS3Client(credentials, config));
    builder.Services.AddScoped<IS3Service, S3Service>();
}
else
{
    builder.Services.AddScoped<IS3Service, UnavailableS3Service>();
    Console.WriteLine("⚠️ AWS credentials or bucket not configured. S3 service will not be available.");
}

// ✅ 6. Bật CORS cho phép Vue (localhost:5173), Blazor (localhost:5000, localhost:5001, localhost:5192)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVueApp",
        policy => policy
            .WithOrigins(
                "http://localhost:5173",  // Vue app
                "https://localhost:5001", // Blazor HTTPS
                "http://localhost:5000",  // Blazor HTTP
                "http://localhost:5192"   // Blazor HTTP (port thực tế)
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()); // Cho phép gửi cookie
});

var app = builder.Build();

// ✅ Áp dụng migrations khi khởi động local/dev
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();
    Console.WriteLine("✅ Database migrations đã được áp dụng.");
}

// ✅ 7. Kích hoạt CORS
app.UseCors("AllowVueApp");

// ✅ 8. 🔐 Kích hoạt Authentication và Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
