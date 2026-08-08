import axios from "axios";

const BASE_URL = "http://localhost:7000";

// Tạo axios instance chung cho toàn bộ ứng dụng
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Tự động thêm Authorization header với token từ localStorage
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    console.log("🚀 API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Interceptor: Xử lý response và lỗi 401
apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        "❌ API Error:",
        error.response.status,
        error.response.config.url
      );

      // Xử lý 401 Unauthorized
      if (error.response.status === 401) {
        console.error("🔒 Token hết hạn hoặc không hợp lệ!");

        // Chỉ redirect nếu không phải trang login
        if (window.location.pathname !== "/login") {
          console.log("🔄 Chuyển về trang login...");
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    else if (error.request) {
      console.error("❌ No response from server!");
      console.error("🔧 Kiểm tra backend đang chạy tại:", BASE_URL);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
