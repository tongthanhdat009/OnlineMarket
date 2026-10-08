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
using DotNetEnv;

// Load .env file before configuration is read
Env.Load(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env"));

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

// 🤖 AI Service — OpenAI-compatible (OpenClaw gateway)
// Timeout lấy từ OpenAI__TimeoutSeconds / OPENAI_TIMEOUT_SECONDS (mặc định 1200s)
var openAiTimeoutSeconds = 1200;
{
    var raw = builder.Configuration["OpenAI:TimeoutSeconds"]
        ?? builder.Configuration["OpenAI__TimeoutSeconds"]
        ?? builder.Configuration["OPENAI_TIMEOUT_SECONDS"]
        ?? Environment.GetEnvironmentVariable("OPENAI_TIMEOUT_SECONDS")
        ?? Environment.GetEnvironmentVariable("OpenAI__TimeoutSeconds");
    if (int.TryParse(raw, out var parsed) && parsed > 0) openAiTimeoutSeconds = parsed;
}
builder.Services.AddHttpClient();
builder.Services.AddHttpClient("openai", client =>
{
    client.Timeout = Timeout.InfiniteTimeSpan;
});
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddScoped<IAdminAiService, AdminAiService>();
builder.Services.AddScoped<IAdminChatSessionService, AdminChatSessionService>();
builder.Services.AddScoped<dotnet_backend.Services.Reporting.ISalesReportService, SalesReportService>();
builder.Services.AddSingleton<IAgentActivityBroadcaster, AgentActivityBroadcaster>();
builder.Services.AddScoped<IAgentRuntime, AgentRuntime>();
builder.Services.AddScoped<IAgentOperationsService, AgentOperationsService>();
builder.Services.AddScoped<IAgentReportService, AgentReportService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

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

// ✅ 6. Bật CORS cho các frontend (React admin 5173, React customer 5193)
// Ghi rõ cả localhost và 127.0.0.1: trình duyệt coi chúng là origin khác
// nhau, và CORS khớp theo scheme+host+port chính xác. Thiếu alias loopback
// khiến POST /api/Auth/login bị chặn và màn hình đăng nhập "không hoạt động".
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendApps",
        policy => policy
            .WithOrigins(
                "http://localhost:5173", // React admin
                "http://127.0.0.1:5173",
                "http://localhost:5193", // React customer
                "http://127.0.0.1:5193"
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
app.UseCors("AllowFrontendApps");

// ✅ 8. 🔐 Kích hoạt Authentication và Authorization
app.UseAuthentication();
app.UseAuthorization();

// 📝 Ghi nhật ký audit cho mọi API thay đổi dữ liệu thành công
app.UseMiddleware<dotnet_backend.Middleware.AuditLogMiddleware>();

app.MapControllers();

app.Run();
