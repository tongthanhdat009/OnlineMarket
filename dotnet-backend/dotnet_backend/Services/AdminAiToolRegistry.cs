namespace dotnet_backend.Services;

internal static class AdminAiToolRegistry
{
    public const string SearchProducts = "search_products";
    public const string GetStock = "get_stock";
    public const string SearchInventory = "search_inventory";
    public const string SearchOrders = "search_orders";
    public const string GetOrder = "get_order";
    public const string SalesSummary = "sales_summary";

    public static readonly object[] Declarations =
    {
        new
        {
            type = "function",
            function = new
            {
                name = SearchProducts,
                description = "Tìm sản phẩm, giá và tồn kho hiện tại của OnlineMarket.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        query = new { type = "string", description = "Từ khóa sản phẩm, tối đa 200 ký tự" },
                        category = new { type = "string", description = "Tên danh mục nếu biết" },
                        max_results = new { type = "integer", description = "Số kết quả từ 1 đến 20" },
                        only_in_stock = new { type = "boolean", description = "Chỉ lấy sản phẩm còn hàng" }
                    },
                    required = new[] { "query" }
                }
            }
        },
        new
        {
            type = "function",
            function = new
            {
                name = GetStock,
                description = "Tra cứu tồn kho theo sản phẩm, danh mục, nhà cung cấp hoặc mức tồn thấp.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        query = new { type = "string", description = "Tên hoặc mã sản phẩm, tối đa 200 ký tự" },
                        category = new { type = "string", description = "Tên danh mục" },
                        supplier = new { type = "string", description = "Tên nhà cung cấp" },
                        low_stock_only = new { type = "boolean", description = "Chỉ lấy sản phẩm tồn thấp" },
                        low_stock_threshold = new { type = "integer", description = "Ngưỡng tồn thấp, mặc định 5" },
                        max_results = new { type = "integer", description = "Số kết quả từ 1 đến 20" }
                    }
                }
            }
        },
        new
        {
            type = "function",
            function = new
            {
                name = SearchInventory,
                description = "Tìm kiếm inventory hiện tại với bộ lọc tồn kho có giới hạn.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        query = new { type = "string", description = "Tên hoặc mã sản phẩm, tối đa 200 ký tự" },
                        category = new { type = "string", description = "Tên danh mục" },
                        supplier = new { type = "string", description = "Tên nhà cung cấp" },
                        low_stock_only = new { type = "boolean", description = "Chỉ lấy sản phẩm tồn thấp" },
                        low_stock_threshold = new { type = "integer", description = "Ngưỡng tồn thấp, mặc định 5" },
                        max_results = new { type = "integer", description = "Số kết quả từ 1 đến 20" }
                    }
                }
            }
        },
        new
        {
            type = "function",
            function = new
            {
                name = SearchOrders,
                description = "Tìm đơn hàng theo thời gian, trạng thái, loại đơn hoặc khách hàng; kết quả đã ẩn PII.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        query = new { type = "string", description = "Mã đơn, trạng thái hoặc từ khóa khách hàng, tối đa 200 ký tự" },
                        customer_query = new { type = "string", description = "Từ khóa khách hàng, tối đa 200 ký tự" },
                        order_id = new { type = "integer", description = "Mã đơn hàng" },
                        from = new { type = "string", description = "Ngày bắt đầu, ISO date, bao gồm" },
                        to = new { type = "string", description = "Ngày kết thúc, ISO date, không bao gồm" },
                        status = new { type = "string", description = "Trạng thái đơn hàng" },
                        payment_status = new { type = "string", description = "Trạng thái thanh toán" },
                        order_type = new { type = "string", description = "online hoặc offline" },
                        max_results = new { type = "integer", description = "Số kết quả từ 1 đến 20" }
                    }
                }
            }
        },
        new
        {
            type = "function",
            function = new
            {
                name = GetOrder,
                description = "Xem chi tiết vận hành của một đơn hàng; PII khách hàng luôn được ẩn.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        order_id = new { type = "integer", description = "Mã đơn hàng" }
                    },
                    required = new[] { "order_id" }
                }
            }
        },
        new
        {
            type = "function",
            function = new
            {
                name = SalesSummary,
                description = "Tóm tắt doanh thu từ đơn completed và paid, cùng số đơn và giảm giá.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        from = new { type = "string", description = "Ngày bắt đầu, ISO date, bao gồm; mặc định 30 ngày gần nhất" },
                        to = new { type = "string", description = "Ngày kết thúc, ISO date, không bao gồm" },
                        order_type = new { type = "string", description = "online hoặc offline" }
                    }
                }
            }
        }
    };

    public static bool IsAllowed(string name) => name is SearchProducts or GetStock or SearchInventory or SearchOrders or GetOrder or SalesSummary;
}
