import axios from "axios";

const BASE_URL = "http://localhost:7000/";

// Tạo axios instance với config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // timeout 10s để tránh treo request quá lâu
});

// Cờ và hàng đợi để xử lý tình huống refresh token đang diễn ra
let isRefreshing = false;
let pendingQueue = [];

/**
 * Xóa token trong localStorage khi không còn hợp lệ
 */
const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions"); // Thêm xóa permissions
};

/**
 * Khi refresh xong (hoặc thất bại), xử lý lại toàn bộ request đang chờ:
 * - Nếu có newToken: gắn vào header Authorization của từng request và gọi lại.
 * - Nếu lỗi: reject tất cả promise trong hàng đợi.
 */
const processQueue = (newToken, error) => {
  pendingQueue.forEach(({ resolve, reject, originalRequest }) => {
    if (newToken) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      resolve(apiClient(originalRequest)); // chạy lại request với token mới
    }
    else {
      reject(error);
    }
  });
  pendingQueue = []; // dọn hàng đợi
};

// Interceptor trước khi gửi request: tự chèn Authorization nếu có accessToken
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    console.log("🚀 Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Interceptor sau khi nhận response (hoặc error)
apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.status, response.data);
    return response;
  },
  async (error) => {
    const { config: originalRequest, response } = error;

    // Nếu không có response.status (VD: lỗi mạng), hoặc request không hợp lệ,
    // hoặc đã retry rồi (_retry = true) thì trả lỗi luôn.
    if (!response?.status || !originalRequest || originalRequest._retry) {
      if (!response) {
        console.error(
          "❌ NETWORK ERROR - Backend không chạy hoặc CORS chưa cấu hình!"
        );
        console.error("🔧 Kiểm tra:");
        console.error("   1. Backend đang chạy tại http://localhost:7000");
        console.error("   2. CORS đã được thêm vào Program.cs");
      }
      return Promise.reject(error);
    }

    // Chỉ xử lý luồng refresh khi gặp 401 (Unauthorized)
    if (response.status === 401) {
      originalRequest._retry = true; // tránh vòng lặp vô hạn

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        // Không có refresh token => đăng nhập lại
        console.warn("⚠️ Không có refresh token, chuyển về trang login");
        clearTokens();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Nếu đang refresh rồi: đưa request hiện tại vào hàng đợi chờ refresh xong
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, originalRequest });
        });
      }

      try {
        isRefreshing = true;
        console.log("🔄 Đang làm mới access token...");

        // DÙNG axios gốc (không phải apiClient) để gọi refresh,
        // nhằm tránh interceptor đụng phải 401 lặp lại.
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          RefreshToken: refreshToken,
        });

        // Backend trả về AccessToken (viết hoa chữ cái đầu)
        const newAccessToken = data?.AccessToken || data?.accessToken;

        if (!newAccessToken) throw new Error("No accessToken in response");

        // Lưu token mới
        localStorage.setItem("accessToken", newAccessToken);
        console.log("✅ Làm mới token thành công!");

        // Chạy lại các request đang chờ với token mới
        processQueue(newAccessToken, null);

        // Gắn token mới cho request ban đầu và chạy lại
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        // Refresh thất bại: xóa token và thông báo lỗi cho toàn bộ request đang chờ
        console.error("❌ Refresh token thất bại, đăng xuất...");
        clearTokens();
        processQueue(null, err);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Các lỗi khác ngoài 401: trả về như bình thường
    console.error("❌ Response Error:", response.status, response.data);
    return Promise.reject(error);
  }
);

/**
 * 🔐 Đăng nhập
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu
 * @returns {Promise<LoginResponseDto>} Access Token + Refresh Token + User info
 */
export async function login(username, password) {
  try {
    const response = await apiClient.post("/api/auth/login", {
      Username: username,
      Password: password,
    });

    console.log("✅ Login Response:", response.data);

    // Backend trả về AccessToken và RefreshToken (viết hoa chữ cái đầu)
    const accessToken = response.data.AccessToken || response.data.accessToken;
    const refreshToken =
      response.data.RefreshToken || response.data.refreshToken;
    const role = response.data.Role || response.data.role;
    const permissions = response.data.Permissions || response.data.permissions;
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      console.log("✅ Đã lưu accessToken vào localStorage");
    }

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
      console.log("✅ Đã lưu refreshToken vào localStorage");
    }
    if (role !== undefined) {
      localStorage.setItem("role", role);
      console.log("✅ Đã lưu role vào localStorage");
    }
    if (permissions !== undefined) {
      localStorage.setItem("permissions", JSON.stringify(permissions));
      console.log("✅ Đã lưu permissions vào localStorage");
    }
    return response.data;
  } catch (error) {
    console.error("❌ login failed:", error);
    throw error;
  }
}

/**
 * 🔄 Làm mới Access Token (dùng cho internal)
 * @param {string} refreshToken - Refresh Token
 * @returns {Promise<RefreshResponseDto>} Access Token mới
 */
export async function refreshAccessToken(refreshToken) {
  try {
    // Dùng axios gốc để tránh interceptor
    const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      RefreshToken: refreshToken,
    });

    console.log("✅ Refresh Response:", response.data);

    // Backend trả về AccessToken (viết hoa chữ cái đầu)
    const accessToken = response.data.AccessToken || response.data.accessToken;

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      console.log("✅ Đã lưu accessToken mới vào localStorage");
    }

    return response.data;
  } catch (error) {
    console.error("❌ refreshAccessToken failed:", error);
    throw error;
  }
}

/**
 * 👤 Lấy thông tin user hiện tại (test endpoint)
 * Yêu cầu: Phải có Access Token hợp lệ
 * @returns {Promise<object>} Thông tin user
 */
export async function getCurrentUser() {
  try {
    const response = await apiClient.get("/api/auth/me");
    return response.data;
  } catch (error) {
    console.error("getCurrentUser failed:", error);
    throw error;
  }
}

/**
 * 🚪 Đăng xuất (xóa token khỏi localStorage)
 */
export function logout() {
  clearTokens();
  // Xóa permissions khi đăng xuất
  localStorage.removeItem("permissions");
  console.log("✅ Đã đăng xuất");
}

// Export default object chứa tất cả functions
export default {
  login,
  refreshAccessToken,
  getCurrentUser,
  logout,
};
