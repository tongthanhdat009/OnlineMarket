using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace dotnet_backend.Migrations
{
    /// <inheritdoc />
    public partial class ImportLegacySeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "categories",
                columns: new[] { "category_id", "category_name" },
                values: new object[,]
                {
                    { 1, "Đồ uống" },
                    { 2, "Bánh kẹo" },
                    { 3, "Gia vị" },
                    { 4, "Đồ gia dụng" },
                    { 5, "Mỹ phẩm" }
                });

            migrationBuilder.InsertData(
                table: "customers",
                columns: new[] { "customer_id", "address", "created_at", "email", "name", "Password", "phone" },
                values: new object[,]
                {
                    { 1, "Địa chỉ 1", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh1@mail.com", "Khách hàng 1", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000001" },
                    { 2, "Địa chỉ 2", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh2@mail.com", "Khách hàng 2", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000002" },
                    { 3, "Địa chỉ 3", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh3@mail.com", "Khách hàng 3", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000003" },
                    { 4, "Địa chỉ 4", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh4@mail.com", "Khách hàng 4", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000004" },
                    { 5, "Địa chỉ 5", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh5@mail.com", "Khách hàng 5", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000005" },
                    { 6, "Địa chỉ 6", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh6@mail.com", "Khách hàng 6", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000006" },
                    { 7, "Địa chỉ 7", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh7@mail.com", "Khách hàng 7", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000007" },
                    { 8, "Địa chỉ 8", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh8@mail.com", "Khách hàng 8", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000008" },
                    { 9, "Địa chỉ 9", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh9@mail.com", "Khách hàng 9", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000009" },
                    { 10, "Địa chỉ 10", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh10@mail.com", "Khách hàng 10", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000010" },
                    { 11, "Địa chỉ 11", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh11@mail.com", "Khách hàng 11", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000011" },
                    { 12, "Địa chỉ 12", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh12@mail.com", "Khách hàng 12", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000012" },
                    { 13, "Địa chỉ 13", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh13@mail.com", "Khách hàng 13", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000013" },
                    { 14, "Địa chỉ 14", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh14@mail.com", "Khách hàng 14", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000014" },
                    { 15, "Địa chỉ 15", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh15@mail.com", "Khách hàng 15", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000015" },
                    { 16, "Địa chỉ 16", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh16@mail.com", "Khách hàng 16", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000016" },
                    { 17, "Địa chỉ 17", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh17@mail.com", "Khách hàng 17", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000017" },
                    { 18, "Địa chỉ 18", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh18@mail.com", "Khách hàng 18", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000018" },
                    { 19, "Địa chỉ 19", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh19@mail.com", "Khách hàng 19", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000019" },
                    { 20, "Địa chỉ 20", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kh20@mail.com", "Khách hàng 20", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", "0909000020" }
                });

            migrationBuilder.UpdateData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 1,
                columns: new[] { "description", "permission_name" },
                values: new object[] { "Xem báo cáo tổng quan về tình hình kinh doanh.", "Xem thống kê doanh thu" });

            migrationBuilder.InsertData(
                table: "permissions",
                columns: new[] { "permission_id", "action_key", "description", "permission_name" },
                values: new object[,]
                {
                    { 2, "user_manage", "Tạo, sửa, xóa tài khoản nhân viên và phân quyền.", "Quản lý người dùng" },
                    { 3, "supplier_manage", "Thêm, sửa, xóa thông tin nhà cung cấp.", "Quản lý nhà cung cấp" },
                    { 4, "category_manage", "Quản lý các loại sản phẩm.", "Quản lý danh mục sản phẩm" },
                    { 5, "inventory_manage", "Nhập hàng, kiểm kê và quản lý số lượng tồn kho.", "Quản lý kho" },
                    { 6, "promotion_manage", "Tạo và quản lý các chương trình giảm giá.", "Quản lý khuyến mãi" },
                    { 7, "role_manage", "Tạo và quản lý các nhóm quyền.", "Quản lý phân quyền" },
                    { 8, "permission_manage", "Tạo và quản lý các chức năng.", "Quản lý chức năng" },
                    { 9, "customer_manage", "Thêm, sửa, xóa, tìm kiếm thông tin khách hàng.", "Quản lý khách hàng" },
                    { 10, "product_manage", "Quản lý thông tin sản phẩm và giá cả.", "Quản lý sản phẩm" },
                    { 11, "order_manage", "Tạo đơn hàng mới, thêm chi tiết hóa đơn và thanh toán.", "Quản lý đơn hàng" }
                });

            migrationBuilder.InsertData(
                table: "promotions",
                columns: new[] { "promo_id", "description", "discount_type", "discount_value", "end_date", "min_order_amount", "promo_code", "start_date", "status", "usage_limit", "used_count" },
                values: new object[,]
                {
                    { 1, "Giảm 10% cho mọi đơn hàng", "percent", 10.00m, new DateOnly(2025, 12, 31), 0.00m, "SALE10", new DateOnly(2025, 1, 1), "active", 0, 0 },
                    { 2, "Giảm 50,000 cho đơn từ 300,000 trở lên", "fixed", 50000.00m, new DateOnly(2025, 12, 31), 300000.00m, "FREESHIP50K", new DateOnly(2025, 3, 1), "active", 500, 0 },
                    { 3, "Giảm 20% cho khách hàng mới", "percent", 20.00m, new DateOnly(2025, 6, 30), 0.00m, "NEWUSER", new DateOnly(2025, 1, 1), "active", 1, 0 },
                    { 4, "Giảm 15% mùa hè", "percent", 15.00m, new DateOnly(2025, 8, 31), 50000.00m, "SUMMER15", new DateOnly(2025, 6, 1), "active", 1000, 0 },
                    { 5, "Giảm 100,000 cho đơn từ 1 triệu", "fixed", 100000.00m, new DateOnly(2025, 12, 31), 1000000.00m, "VIP100K", new DateOnly(2025, 1, 1), "active", 200, 0 }
                });

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "role_id",
                keyValue: 1,
                column: "description",
                value: "Quản trị viên hệ thống, có toàn quyền truy cập.");

            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "role_id", "description", "role_name" },
                values: new object[] { 2, "Nhân viên bán hàng, có quyền hạn giới hạn.", "Staff" });

            migrationBuilder.InsertData(
                table: "suppliers",
                columns: new[] { "supplier_id", "address", "email", "name", "phone" },
                values: new object[,]
                {
                    { 1, "Hà Nội", "abc@gmail.com", "Công ty ABC", "0909123456" },
                    { 2, "TP HCM", "xyz@gmail.com", "Công ty XYZ", "0912123456" },
                    { 3, "Đà Nẵng", "123@gmail.com", "Công ty 123", "0933123456" }
                });

            migrationBuilder.InsertData(
                table: "users",
                columns: new[] { "user_id", "created_at", "full_name", "password", "role", "username" },
                values: new object[] { 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "Quản trị viên", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", 1, "admin" });

            migrationBuilder.InsertData(
                table: "products",
                columns: new[] { "product_id", "barcode", "category_id", "created_at", "image_url", "price", "product_name", "supplier_id", "unit" },
                values: new object[,]
                {
                    { 1, "8900000000001", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "coca-cola-lon.jpg", 500000.00m, "Coca Cola lon", 1, "lon" },
                    { 2, "8900000000002", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "pepsi-lon.jpg", 114807.00m, "Pepsi lon", 3, "lon" },
                    { 3, "8900000000003", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "tra-xanh-0-do.jpg", 415725.00m, "Trà Xanh 0 độ", 3, "chai" },
                    { 4, "8900000000004", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "sting-dau.jpg", 351670.00m, "Sting dâu", 1, "lon" },
                    { 5, "8900000000005", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "red-bull.jpg", 402179.00m, "Red Bull", 2, "lon" },
                    { 6, "8900000000006", 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "banh-oreo.jpg", 209283.00m, "Bánh Oreo", 2, "hộp" },
                    { 7, "8900000000007", 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "banh-chocopie.jpg", 212528.00m, "Bánh Chocopie", 3, "hộp" },
                    { 8, "8900000000008", 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "keo-alpenliebe.jpg", 34313.00m, "Kẹo Alpenliebe", 2, "gói" },
                    { 9, "8900000000009", 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "keo-bac-ha.jpg", 316289.00m, "Kẹo bạc hà", 1, "gói" },
                    { 10, "8900000000010", 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "socola-kitKat.jpg", 139959.00m, "Socola KitKat", 2, "cái" },
                    { 11, "8900000000011", 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "nuoc-man-nam-ngu.jpg", 51792.00m, "Nước mắm Nam Ngư", 1, "chai" },
                    { 12, "8900000000012", 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "nuoc-tuong-maggi.jpg", 462539.00m, "Nước tương Maggi", 2, "chai" },
                    { 13, "8900000000013", 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "muoi-i-ot.jpg", 173302.00m, "Muối i-ốt", 3, "gói" },
                    { 14, "8900000000014", 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "bot-ngot-ajinomoto.jpg", 443069.00m, "Bột ngọt Ajinomoto", 1, "gói" },
                    { 15, "8900000000015", 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "dau-an-tuong-an.jpg", 281354.00m, "Dầu ăn Tường An", 2, "chai" },
                    { 16, "8900000000016", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "noi-com-dien.jpg", 405347.00m, "Nồi cơm điện", 1, "cái" },
                    { 17, "8900000000017", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "am-sieu-toc.jpg", 113087.00m, "Ấm siêu tốc", 3, "cái" },
                    { 18, "8900000000018", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "quat-may.jpg", 69968.00m, "Quạt máy", 2, "cái" },
                    { 19, "8900000000019", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "bep-gas-mini.jpg", 416845.00m, "Bếp gas mini", 1, "cái" },
                    { 20, "8900000000020", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "may-xay-sinh-to.jpg", 334564.00m, "Máy xay sinh tố", 3, "cái" },
                    { 21, "8900000000021", 5, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "sua-rua-mat-hazeline.jpg", 188475.00m, "Sữa rửa mặt Hazeline", 1, "chai" },
                    { 22, "8900000000022", 5, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kem-duong-da-pond.jpg", 413840.00m, "Kem dưỡng da Pond's", 1, "hộp" },
                    { 23, "8900000000023", 5, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "dau-goi-sunsilk.jpg", 158950.00m, "Dầu gội Sunsilk", 3, "chai" },
                    { 24, "8900000000024", 5, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "sua-tam-dove.jpg", 336928.00m, "Sữa tắm Dove", 2, "chai" },
                    { 25, "8900000000025", 5, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "nuoc-hoa-romano.jpg", 352508.00m, "Nước hoa Romano", 1, "chai" },
                    { 26, "8900000000026", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "ca-phe-g7.jpg", 201228.00m, "Cà phê G7", 1, "gói" },
                    { 27, "8900000000027", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "tra-lipton.jpg", 38039.00m, "Trà Lipton", 1, "gói" },
                    { 28, "8900000000028", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "sua-vinamilk.jpg", 252845.00m, "Sữa Vinamilk", 1, "hộp" },
                    { 29, "8900000000029", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "sua-th-true-milk.jpg", 35278.00m, "Sữa TH True Milk", 2, "hộp" },
                    { 30, "8900000000030", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "nuoc-suoi-lavie.jpg", 331637.00m, "Nước suối Lavie", 3, "chai" },
                    { 31, "8900000000031", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "khan-giay-tempo.jpg", 102525.00m, "Khăn giấy Tempo", 3, "gói" },
                    { 32, "8900000000032", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "giay-ve-sinh-pulppy.jpg", 495429.00m, "Giấy vệ sinh Pulppy", 3, "cuốn" },
                    { 33, "8900000000033", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "binh-nuoc-lock-lock.jpg", 354771.00m, "Bình nước Lock&Lock", 2, "cái" },
                    { 34, "8900000000034", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "hop-nhua-tupperware.jpg", 297415.00m, "Hộp nhựa Tupperware", 1, "cái" },
                    { 35, "8900000000035", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "dao-inox.jpg", 47523.00m, "Dao Inox", 3, "cái" },
                    { 36, "8900000000036", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "ban-chai-colgate.jpg", 136417.00m, "Bàn chải Colgate", 1, "cái" },
                    { 37, "8900000000037", 5, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "kem-danh-rang-ps.jpg", 93713.00m, "Kem đánh răng P/S", 2, "tuýp" },
                    { 38, "8900000000038", 5, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "nuoc-suc-mieng-listerine.jpg", 223906.00m, "Nước súc miệng Listerine", 3, "chai" },
                    { 39, "8900000000039", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "bong-tay-trang.jpg", 317819.00m, "Bông tẩy trang", 2, "gói" },
                    { 40, "8900000000040", 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "khau-trang-3m.jpg", 464252.00m, "Khẩu trang 3M", 1, "gói" },
                    { 41, "8900000000041", 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "banh-mi-sandwich.jpg", 279350.00m, "Bánh mì sandwich", 1, "ổ" },
                    { 42, "8900000000042", 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "mi-goi-hao-hao.jpg", 9413.00m, "Mì gói Hảo Hảo", 2, "gói" },
                    { 43, "8900000000043", 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "mi-omachi.jpg", 26616.00m, "Mì Omachi", 2, "gói" },
                    { 44, "8900000000044", 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "bun-kho.jpg", 350911.00m, "Bún khô", 1, "gói" },
                    { 45, "8900000000045", 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "pho-an-lien.jpg", 407779.00m, "Phở ăn liền", 1, "gói" },
                    { 46, "8900000000046", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "nuoc_ngot_sprite.jpg", 230083.00m, "Nước ngọt Sprite", 1, "lon" },
                    { 47, "8900000000047", 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "tra-sua-dong-chai.jpg", 15130.00m, "Trà sữa đóng chai", 3, "chai" },
                    { 48, "8900000000048", 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "snack-oishi.jpg", 43415.00m, "Snack Oishi", 3, "gói" },
                    { 49, "8900000000049", 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "snack-lay.jpg", 83536.00m, "Snack Lay's", 2, "gói" },
                    { 50, "8900000000050", 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "keo-deo-haribo.jpg", 328680.00m, "Kẹo dẻo Haribo", 2, "gói" }
                });

            migrationBuilder.InsertData(
                table: "role_permissions",
                columns: new[] { "permission_id", "role_id" },
                values: new object[,]
                {
                    { 2, 1 },
                    { 3, 1 },
                    { 4, 1 },
                    { 5, 1 },
                    { 6, 1 },
                    { 7, 1 },
                    { 8, 1 },
                    { 9, 1 },
                    { 10, 1 },
                    { 11, 1 },
                    { 9, 2 },
                    { 10, 2 },
                    { 11, 2 }
                });

            migrationBuilder.InsertData(
                table: "users",
                columns: new[] { "user_id", "created_at", "full_name", "password", "role", "username" },
                values: new object[,]
                {
                    { 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "Nguyễn Văn A", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", 2, "staff01" },
                    { 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "Lê Thị B", "$2a$11$blVO.EMh9OUxIvmnemek4.tgcv6BZkkCmyRo6Au7guZSUSIwH/foK", 2, "staff02" }
                });

            migrationBuilder.InsertData(
                table: "inventory",
                columns: new[] { "inventory_id", "product_id", "quantity", "updated_at" },
                values: new object[,]
                {
                    { 1, 1, 25, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 2, 2, 169, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 3, 3, 77, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 4, 4, 169, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 5, 5, 90, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 6, 6, 105, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 7, 7, 125, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 8, 8, 37, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 9, 9, 74, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 10, 10, 149, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 11, 11, 69, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 12, 12, 23, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 13, 13, 46, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 14, 14, 144, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 15, 15, 134, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 16, 16, 182, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 17, 17, 99, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 18, 18, 72, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 19, 19, 128, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 20, 20, 123, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 21, 21, 155, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 22, 22, 78, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 23, 23, 166, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 24, 24, 117, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 25, 25, 168, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 26, 26, 197, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 27, 27, 36, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 28, 28, 145, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 29, 29, 61, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 30, 30, 139, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 31, 31, 47, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 32, 32, 154, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 33, 33, 194, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 34, 34, 41, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 35, 35, 154, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 36, 36, 71, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 37, 37, 49, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 38, 38, 165, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 39, 39, 73, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 40, 40, 176, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 41, 41, 41, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 42, 42, 34, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 43, 43, 175, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 44, 44, 59, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 45, 45, 198, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 46, 46, 106, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 47, 47, 99, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 48, 48, 55, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 49, 49, 62, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) },
                    { 50, 50, 33, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified) }
                });

            migrationBuilder.InsertData(
                table: "orders",
                columns: new[] { "order_id", "address", "customer_id", "discount_amount", "email", "name", "order_date", "order_status", "order_type", "pay_status", "phone", "promo_id", "total_amount", "user_id" },
                values: new object[,]
                {
                    { 1, "Địa chỉ 5", 5, 100000.00m, "kh5@mail.com", "Khách hàng 5", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", "0909000005", 5, 1292330.00m, 3 },
                    { 2, null, 17, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 1731608.00m, 3 },
                    { 3, null, 8, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 720782.00m, 3 },
                    { 4, "Địa chỉ 20", 20, 21686.00m, "kh20@mail.com", "Khách hàng 20", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", "0909000020", 5, 21686.00m, 3 },
                    { 5, "Địa chỉ 1", 1, 0.00m, "kh1@mail.com", "Khách hàng 1", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000001", null, 94180.00m, 2 },
                    { 6, "Địa chỉ 5", 5, 100000.00m, "kh5@mail.com", "Khách hàng 5", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", "0909000005", 2, 3888671.00m, 3 },
                    { 7, "Địa chỉ 9", 9, 102518.80m, "kh9@mail.com", "Khách hàng 9", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", "0909000009", 4, 512594.00m, 3 },
                    { 8, "Địa chỉ 11", 11, 171502.90m, "kh11@mail.com", "Khách hàng 11", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000011", 3, 1715029.00m, 3 },
                    { 9, null, 11, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 2484051.00m, 3 },
                    { 10, "Địa chỉ 11", 11, 100000.00m, "kh11@mail.com", "Khách hàng 11", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000011", 2, 1070239.00m, 3 },
                    { 11, null, 20, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 1532741.00m, 3 },
                    { 12, null, 10, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 1785354.00m, 2 },
                    { 13, "Địa chỉ 10", 10, 100000.00m, "kh10@mail.com", "Khách hàng 10", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000010", 2, 1588276.00m, 3 },
                    { 14, "Địa chỉ 6", 6, 50000.00m, "kh6@mail.com", "Khách hàng 6", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", "0909000006", 2, 2896096.00m, 2 },
                    { 15, "Địa chỉ 10", 10, 27900.00m, "kh10@mail.com", "Khách hàng 10", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000010", 3, 186000.00m, 2 },
                    { 16, "Địa chỉ 10", 10, 50000.00m, "kh10@mail.com", "Khách hàng 10", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", "0909000010", 5, 1024090.00m, 2 },
                    { 17, null, 19, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 467148.00m, 3 },
                    { 18, "Địa chỉ 10", 10, 0.00m, "kh10@mail.com", "Khách hàng 10", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000010", null, 394342.00m, 2 },
                    { 19, "Địa chỉ 8", 8, 294845.55m, "kh8@mail.com", "Khách hàng 8", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", "0909000008", 4, 1965637.00m, 3 },
                    { 20, null, 3, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 2889813.00m, 3 },
                    { 21, "Địa chỉ 9", 9, 0.00m, "kh9@mail.com", "Khách hàng 9", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000009", null, 2288406.00m, 2 },
                    { 22, null, 17, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 331008.00m, 3 },
                    { 23, "Địa chỉ 6", 6, 323227.65m, "kh6@mail.com", "Khách hàng 6", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000006", 1, 2154851.00m, 3 },
                    { 24, "Địa chỉ 1", 1, 170802.90m, "kh1@mail.com", "Khách hàng 1", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", "0909000001", 1, 1138686.00m, 3 },
                    { 25, "Địa chỉ 2", 2, 100000.00m, "kh2@mail.com", "Khách hàng 2", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", "0909000002", 5, 393847.00m, 2 },
                    { 26, "Địa chỉ 15", 15, 52131.60m, "kh15@mail.com", "Khách hàng 15", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000015", 1, 260658.00m, 3 },
                    { 27, null, 4, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 933199.00m, 2 },
                    { 28, null, 16, 0.00m, null, null, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "offline", "paid", null, null, 2609123.00m, 2 },
                    { 29, "Địa chỉ 4", 4, 481258.40m, "kh4@mail.com", "Khách hàng 4", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000004", 4, 2406292.00m, 3 },
                    { 30, "Địa chỉ 1", 1, 0.00m, "kh1@mail.com", "Khách hàng 1", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "completed", "online", "paid", "0909000001", null, 2912134.00m, 3 }
                });

            migrationBuilder.InsertData(
                table: "bills",
                columns: new[] { "bill_id", "address", "bill_status", "created_at", "customer_id", "discount_amount", "email", "final_amount", "name", "order_id", "paid_at", "pay_status", "payment_method", "phone", "total_amount" },
                values: new object[,]
                {
                    { 1, "Địa chỉ 5", "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 5, 100000.00m, "kh5@mail.com", 1192330.00m, "Khách hàng 5", 1, new DateTime(2025, 10, 8, 12, 25, 48, 0, DateTimeKind.Unspecified), "paid", "cash", "0909000005", 1292330.00m },
                    { 2, null, "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 17, 0.00m, null, 1731608.00m, null, 2, new DateTime(2025, 10, 8, 12, 26, 48, 0, DateTimeKind.Unspecified), "paid", "e-wallet", null, 1731608.00m },
                    { 3, null, "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 8, 0.00m, null, 720782.00m, null, 3, new DateTime(2025, 10, 8, 12, 27, 48, 0, DateTimeKind.Unspecified), "paid", "e-wallet", null, 720782.00m },
                    { 4, "Địa chỉ 5", "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 5, 100000.00m, "kh5@mail.com", 3788671.00m, "Khách hàng 5", 6, new DateTime(2025, 10, 8, 12, 28, 48, 0, DateTimeKind.Unspecified), "paid", "cash", "0909000005", 3888671.00m },
                    { 5, "Địa chỉ 9", "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 9, 102518.80m, "kh9@mail.com", 410075.20m, "Khách hàng 9", 7, new DateTime(2025, 10, 8, 12, 29, 48, 0, DateTimeKind.Unspecified), "paid", "e-wallet", "0909000009", 512594.00m },
                    { 6, "Địa chỉ 11", "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 11, 100000.00m, "kh11@mail.com", 970239.00m, "Khách hàng 11", 10, new DateTime(2025, 10, 8, 12, 30, 48, 0, DateTimeKind.Unspecified), "paid", "card", "0909000011", 1070239.00m },
                    { 7, "Địa chỉ 6", "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 6, 50000.00m, "kh6@mail.com", 2846096.00m, "Khách hàng 6", 14, new DateTime(2025, 10, 8, 12, 31, 48, 0, DateTimeKind.Unspecified), "paid", "cash", "0909000006", 2896096.00m },
                    { 8, "Địa chỉ 10", "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 10, 50000.00m, "kh10@mail.com", 974090.00m, "Khách hàng 10", 16, new DateTime(2025, 10, 8, 12, 32, 48, 0, DateTimeKind.Unspecified), "paid", "cash", "0909000010", 1024090.00m },
                    { 9, "Địa chỉ 6", "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 6, 323227.65m, "kh6@mail.com", 1831623.35m, "Khách hàng 6", 23, new DateTime(2025, 10, 8, 12, 33, 48, 0, DateTimeKind.Unspecified), "paid", "cash", "0909000006", 2154851.00m },
                    { 10, "Địa chỉ 2", "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 2, 100000.00m, "kh2@mail.com", 293847.00m, "Khách hàng 2", 25, new DateTime(2025, 10, 8, 12, 34, 48, 0, DateTimeKind.Unspecified), "paid", "cash", "0909000002", 393847.00m },
                    { 11, "Địa chỉ 1", "pending", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 1, 0.00m, "kh1@mail.com", 94180.00m, "Khách hàng 1", 5, null, "unpaid", "cash", "0909000001", 94180.00m },
                    { 12, null, "pending", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 20, 0.00m, null, 1532741.00m, null, 11, null, "unpaid", "e-wallet", null, 1532741.00m },
                    { 13, "Địa chỉ 10", "exported", new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), 10, 27900.00m, "kh10@mail.com", 158100.00m, "Khách hàng 10", 15, new DateTime(2025, 10, 8, 12, 35, 48, 0, DateTimeKind.Unspecified), "paid", "card", "0909000010", 186000.00m }
                });

            migrationBuilder.InsertData(
                table: "order_items",
                columns: new[] { "order_item_id", "order_id", "price", "product_id", "quantity", "subtotal" },
                values: new object[,]
                {
                    { 1, 1, 31265.00m, 23, 2, 62530.00m },
                    { 2, 1, 205683.00m, 5, 2, 411366.00m },
                    { 3, 1, 477948.00m, 47, 1, 477948.00m },
                    { 4, 1, 170243.00m, 25, 2, 340486.00m },
                    { 5, 2, 447059.00m, 39, 1, 447059.00m },
                    { 6, 2, 51108.00m, 14, 1, 51108.00m },
                    { 7, 2, 411147.00m, 46, 3, 1233441.00m },
                    { 8, 3, 202167.00m, 18, 3, 606501.00m },
                    { 9, 3, 44219.00m, 34, 1, 44219.00m },
                    { 10, 3, 23354.00m, 26, 3, 70062.00m },
                    { 11, 4, 10843.00m, 24, 2, 21686.00m },
                    { 12, 5, 94180.00m, 9, 1, 94180.00m },
                    { 13, 6, 186886.00m, 18, 3, 560658.00m },
                    { 14, 6, 199267.00m, 22, 2, 398534.00m },
                    { 15, 6, 215726.00m, 42, 3, 647178.00m },
                    { 16, 6, 474268.00m, 17, 3, 1422804.00m },
                    { 17, 6, 286499.00m, 20, 3, 859497.00m },
                    { 18, 7, 256297.00m, 8, 2, 512594.00m },
                    { 19, 8, 355116.00m, 42, 1, 355116.00m },
                    { 20, 8, 129224.00m, 43, 2, 258448.00m },
                    { 21, 8, 367155.00m, 31, 3, 1101465.00m },
                    { 22, 9, 48755.00m, 17, 2, 97510.00m },
                    { 23, 9, 381904.00m, 12, 2, 763808.00m },
                    { 24, 9, 167445.00m, 43, 2, 334890.00m },
                    { 25, 9, 429281.00m, 19, 3, 1287843.00m },
                    { 26, 10, 232635.00m, 25, 1, 232635.00m },
                    { 27, 10, 245362.00m, 1, 2, 490724.00m },
                    { 28, 10, 127233.00m, 23, 2, 254466.00m },
                    { 29, 10, 46207.00m, 49, 2, 92414.00m },
                    { 30, 11, 347879.00m, 3, 2, 695758.00m },
                    { 31, 11, 130215.00m, 23, 3, 390645.00m },
                    { 32, 11, 64761.00m, 4, 1, 64761.00m },
                    { 33, 11, 240159.00m, 33, 1, 240159.00m },
                    { 34, 11, 141418.00m, 7, 1, 141418.00m },
                    { 35, 12, 455428.00m, 40, 2, 910856.00m },
                    { 36, 12, 75412.00m, 46, 2, 150824.00m },
                    { 37, 12, 189856.00m, 34, 2, 379712.00m },
                    { 38, 12, 114654.00m, 25, 3, 343962.00m },
                    { 39, 13, 143251.00m, 24, 2, 286502.00m },
                    { 40, 13, 381347.00m, 23, 2, 762694.00m },
                    { 41, 13, 179146.00m, 18, 2, 358292.00m },
                    { 42, 13, 90394.00m, 9, 2, 180788.00m },
                    { 43, 14, 327016.00m, 24, 2, 654032.00m },
                    { 44, 14, 403478.00m, 2, 1, 403478.00m },
                    { 45, 14, 404474.00m, 27, 3, 1213422.00m },
                    { 46, 14, 312582.00m, 4, 2, 625164.00m },
                    { 47, 15, 105328.00m, 18, 1, 105328.00m },
                    { 48, 15, 17303.00m, 27, 2, 34606.00m },
                    { 49, 15, 23033.00m, 50, 2, 46066.00m },
                    { 50, 16, 43160.00m, 15, 1, 43160.00m },
                    { 51, 16, 18541.00m, 16, 2, 37082.00m },
                    { 52, 16, 492698.00m, 44, 1, 492698.00m },
                    { 53, 16, 451150.00m, 41, 1, 451150.00m },
                    { 54, 17, 467148.00m, 42, 1, 467148.00m },
                    { 55, 18, 64334.00m, 30, 1, 64334.00m },
                    { 56, 18, 178454.00m, 11, 1, 178454.00m },
                    { 57, 18, 50518.00m, 20, 3, 151554.00m },
                    { 58, 19, 89280.00m, 16, 1, 89280.00m },
                    { 59, 19, 404655.00m, 23, 3, 1213965.00m },
                    { 60, 19, 331196.00m, 11, 2, 662392.00m },
                    { 61, 20, 367325.00m, 49, 1, 367325.00m },
                    { 62, 20, 264392.00m, 32, 2, 528784.00m },
                    { 63, 20, 345903.00m, 19, 3, 1037709.00m },
                    { 64, 20, 392028.00m, 17, 2, 784056.00m },
                    { 65, 20, 171939.00m, 19, 1, 171939.00m },
                    { 66, 21, 227666.00m, 11, 3, 682998.00m },
                    { 67, 21, 436122.00m, 25, 2, 872244.00m },
                    { 68, 21, 340400.00m, 48, 1, 340400.00m },
                    { 69, 21, 58482.00m, 10, 2, 116964.00m },
                    { 70, 21, 137900.00m, 4, 2, 275800.00m },
                    { 71, 22, 165504.00m, 40, 2, 331008.00m },
                    { 72, 23, 296698.00m, 1, 2, 593396.00m },
                    { 73, 23, 384657.00m, 16, 3, 1153971.00m },
                    { 74, 23, 135828.00m, 40, 3, 407484.00m },
                    { 75, 24, 379562.00m, 3, 3, 1138686.00m },
                    { 76, 25, 22063.00m, 9, 1, 22063.00m },
                    { 77, 25, 185892.00m, 16, 2, 371784.00m },
                    { 78, 26, 130329.00m, 47, 2, 260658.00m },
                    { 79, 27, 448581.00m, 37, 1, 448581.00m },
                    { 80, 27, 484618.00m, 23, 1, 484618.00m },
                    { 81, 28, 357837.00m, 20, 3, 1073511.00m },
                    { 82, 28, 161219.00m, 34, 1, 161219.00m },
                    { 83, 28, 458131.00m, 1, 3, 1374393.00m },
                    { 84, 29, 485514.00m, 28, 1, 485514.00m },
                    { 85, 29, 487044.00m, 7, 3, 1461132.00m },
                    { 86, 29, 235885.00m, 42, 1, 235885.00m },
                    { 87, 29, 223761.00m, 38, 1, 223761.00m },
                    { 88, 30, 426943.00m, 25, 1, 426943.00m },
                    { 89, 30, 130209.00m, 11, 3, 390627.00m },
                    { 90, 30, 73116.00m, 5, 2, 146232.00m },
                    { 91, 30, 272220.00m, 46, 2, 544440.00m },
                    { 92, 30, 467964.00m, 23, 3, 1403892.00m }
                });

            migrationBuilder.InsertData(
                table: "payments",
                columns: new[] { "payment_id", "amount", "order_id", "payment_date", "payment_method", "transaction_status" },
                values: new object[,]
                {
                    { 1, 1192330.00m, 1, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 2, 1731608.00m, 2, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "e-wallet", "success" },
                    { 3, 720782.00m, 3, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "e-wallet", "success" },
                    { 4, 0.00m, 4, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "card", "pending" },
                    { 5, 94180.00m, 5, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 6, 3788671.00m, 6, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 7, 410075.20m, 7, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "e-wallet", "success" },
                    { 8, 1543526.10m, 8, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 9, 2484051.00m, 9, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 10, 970239.00m, 10, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "card", "success" },
                    { 11, 1532741.00m, 11, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "e-wallet", "success" },
                    { 12, 1785354.00m, 12, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "card", "success" },
                    { 13, 1488276.00m, 13, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "card", "success" },
                    { 14, 2846096.00m, 14, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 15, 158100.00m, 15, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "card", "success" },
                    { 16, 974090.00m, 16, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 17, 467148.00m, 17, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 18, 394342.00m, 18, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "e-wallet", "success" },
                    { 19, 1670791.45m, 19, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "card", "success" },
                    { 20, 2889813.00m, 20, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "card", "success" },
                    { 21, 2288406.00m, 21, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 22, 331008.00m, 22, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "e-wallet", "success" },
                    { 23, 1831623.35m, 23, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 24, 967883.10m, 24, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "e-wallet", "success" },
                    { 25, 293847.00m, 25, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 26, 208526.40m, 26, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 27, 933199.00m, 27, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 28, 2609123.00m, 28, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "card", "success" },
                    { 29, 1925033.60m, 29, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "cash", "success" },
                    { 30, 2912134.00m, 30, new DateTime(2025, 10, 8, 12, 20, 48, 0, DateTimeKind.Unspecified), "card", "success" }
                });

            migrationBuilder.InsertData(
                table: "refund_requests",
                columns: new[] { "refund_id", "admin_note", "created_at", "customer_account_holder", "customer_bank_account", "customer_bank_name", "gateway_refund_id", "order_id", "processed_by", "reason", "refund_amount", "status", "updated_at" },
                values: new object[,]
                {
                    { 1, "Đã hoàn tiền qua chuyển khoản", new DateTime(2025, 10, 8, 13, 0, 0, 0, DateTimeKind.Unspecified), "Khách hàng 5", "1234567890123", "Vietcombank", null, 1, 1, "Sản phẩm bị lỗi, không đúng mô tả", 1192330.00m, "completed", new DateTime(2025, 10, 8, 14, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 2, "Đã duyệt, chờ hoàn tiền", new DateTime(2025, 10, 9, 10, 0, 0, 0, DateTimeKind.Unspecified), "Khách hàng 10", "9876543210123", "Techcombank", null, 8, 1, "Muốn đổi sản phẩm khác", 500000.00m, "approved", new DateTime(2025, 10, 9, 11, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 3, null, new DateTime(2025, 10, 10, 9, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, null, 5, null, "Hủy đơn hàng", 94180.00m, "pending", new DateTime(2025, 10, 10, 9, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 4, "Không đủ bằng chứng", new DateTime(2025, 10, 11, 15, 0, 0, 0, DateTimeKind.Unspecified), "Khách hàng 11", "1122334455667", "MB Bank", null, 10, 1, "Sản phẩm hư hỏng khi vận chuyển", 200000.00m, "rejected", new DateTime(2025, 10, 11, 16, 0, 0, 0, DateTimeKind.Unspecified) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "bills",
                keyColumn: "bill_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "inventory",
                keyColumn: "inventory_id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 52);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 55);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 56);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 57);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 58);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 59);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 60);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 61);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 62);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 63);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 64);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 65);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 66);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 67);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 68);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 69);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 70);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 71);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 72);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 73);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 74);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 75);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 76);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 77);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 78);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 79);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 80);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 81);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 82);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 83);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 84);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 85);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 86);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 87);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 88);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 89);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 90);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 91);

            migrationBuilder.DeleteData(
                table: "order_items",
                keyColumn: "order_item_id",
                keyValue: 92);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "payments",
                keyColumn: "payment_id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "refund_requests",
                keyColumn: "refund_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "refund_requests",
                keyColumn: "refund_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "refund_requests",
                keyColumn: "refund_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "refund_requests",
                keyColumn: "refund_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 2, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 3, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 4, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 5, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 6, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 7, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 8, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 9, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 10, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 11, 1 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 9, 2 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 10, 2 });

            migrationBuilder.DeleteData(
                table: "role_permissions",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 11, 2 });

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "order_id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "product_id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "users",
                keyColumn: "user_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "categories",
                keyColumn: "category_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "categories",
                keyColumn: "category_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "categories",
                keyColumn: "category_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "categories",
                keyColumn: "category_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "categories",
                keyColumn: "category_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "customers",
                keyColumn: "customer_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "promotions",
                keyColumn: "promo_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "promotions",
                keyColumn: "promo_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "promotions",
                keyColumn: "promo_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "promotions",
                keyColumn: "promo_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "promotions",
                keyColumn: "promo_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "suppliers",
                keyColumn: "supplier_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "suppliers",
                keyColumn: "supplier_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "suppliers",
                keyColumn: "supplier_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "users",
                keyColumn: "user_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "users",
                keyColumn: "user_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "roles",
                keyColumn: "role_id",
                keyValue: 2);

            migrationBuilder.UpdateData(
                table: "permissions",
                keyColumn: "permission_id",
                keyValue: 1,
                columns: new[] { "description", "permission_name" },
                values: new object[] { "View the admin dashboard", "Dashboard view" });

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "role_id",
                keyValue: 1,
                column: "description",
                value: "Local development administrator");
        }
    }
}
