<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">🔐</div>
        <h2>Đăng nhập hệ thống</h2>
        <p>Vui lòng đăng nhập để tiếp tục</p>
      </div>

      <!-- Thông báo lỗi -->
      <div v-if="errorMessage" class="error-message">
        <span class="icon">⚠️</span>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Form đăng nhập -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">
            <span class="icon">👤</span>
            Tên đăng nhập
          </label>
          <input
            id="username"
            v-model="loginData.username"
            type="text"
            placeholder="Nhập tên đăng nhập"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">
            <span class="icon">🔒</span>
            Mật khẩu
          </label>
          <input
            id="password"
            v-model="loginData.password"
            type="password"
            placeholder="Nhập mật khẩu"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="rememberMe" />
            <span>Ghi nhớ đăng nhập</span>
          </label>
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading">
          <span v-if="!isLoading">Đăng nhập</span>
          <span v-else>Đang đăng nhập...</span>
        </button>
      </form>

      <div class="login-footer">
        <a href="#" class="forgot-password">Quên mật khẩu?</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { login } from "../api/Auth.js";

const router = useRouter();

// State
const loginData = ref({
  username: "",
  password: "",
});

const rememberMe = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");

// Xử lý đăng nhập
async function handleLogin() {
  try {
    isLoading.value = true;
    errorMessage.value = "";

    // Validate
    if (!loginData.value.username.trim()) {
      errorMessage.value = "Vui lòng nhập tên đăng nhập";
      return;
    }
    if (!loginData.value.password.trim()) {
      errorMessage.value = "Vui lòng nhập mật khẩu";
      return;
    }

    // Gọi API đăng nhập
    const response = await login(
      loginData.value.username.trim(),
      loginData.value.password.trim()
    );

    // Lưu thông tin user
    if (response) {
      // Lưu thông tin user vào localStorage
      const userInfo = {
        userId: response.userId,
        username: response.username,
        fullName: response.fullName,
        role: response.role,
      };
      localStorage.setItem("user", JSON.stringify(userInfo));
      
      // Lưu danh sách permissions vào localStorage
      if (response.permissions && response.permissions.length > 0) {
        localStorage.setItem("permissions", JSON.stringify(response.permissions));
      }
      
      if (rememberMe.value) {
        localStorage.setItem("rememberMe", "true");
      }

      console.log("✅ Đăng nhập thành công:", userInfo);
      console.log("✅ Permissions:", response.permissions);

      // Chuyển hướng đến trang profile
      router.push("/profile");
    }

  } catch (error) {
    console.error("Login error:", error);
    
    if (error.response) {
      // Server trả về lỗi
      switch (error.response.status) {
        case 401:
          errorMessage.value = "Tên đăng nhập hoặc mật khẩu không đúng";
          break;
        case 400:
          errorMessage.value = error.response.data?.message || "Dữ liệu không hợp lệ";
          break;
        case 404:
          errorMessage.value = "Không tìm thấy tài khoản";
          break;
        case 500:
          errorMessage.value = "Lỗi server, vui lòng thử lại sau";
          break;
        default:
          errorMessage.value = error.response.data?.message || "Đăng nhập thất bại";
      }
    } else if (error.request) {
      // Không nhận được response từ server - CORS hoặc Network error
      errorMessage.value = "⚠️ Không thể kết nối đến server!\n\n" +
        "Vui lòng kiểm tra:\n" +
        "1. Backend đang chạy tại http://localhost:7000\n" +
        "2. CORS đã được cấu hình trong backend\n" +
        "3. Firewall không chặn kết nối";
      console.error("🔴 BACKEND KHÔNG CHẠY hoặc CORS CHƯA CẤU HÌNH!");
    } else {
      errorMessage.value = "Có lỗi xảy ra: " + error.message;
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 450px;
  padding: 40px;
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 35px;
}

.login-header .logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

.login-header h2 {
  color: #2c3e50;
  font-size: 26px;
  margin: 0 0 10px;
  font-weight: 700;
}

.login-header p {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 25px;
  border-left: 4px solid #e74c3c;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-message .icon {
  font-size: 18px;
  flex-shrink: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group .icon {
  font-size: 16px;
}

.form-group input[type="text"],
.form-group input[type="password"] {
  padding: 13px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  outline: none;
  background: #fafafa;
}

.form-group input[type="text"]:focus,
.form-group input[type="password"]:focus {
  border-color: #27ae60;
  box-shadow: 0 0 0 4px rgba(39, 174, 96, 0.1);
  background: white;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.checkbox-group {
  flex-direction: row !important;
  align-items: center;
  margin-top: -5px;
}

.checkbox-group label {
  margin: 0;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #555;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #27ae60;
}

.btn-login {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  border: none;
  padding: 15px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  text-align: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.forgot-password {
  color: #27ae60;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.3s;
}

.forgot-password:hover {
  color: #229954;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 480px) {
  .login-box {
    padding: 30px 24px;
  }

  .login-header h2 {
    font-size: 22px;
  }

  .login-header .logo {
    width: 70px;
    height: 70px;
    font-size: 35px;
  }
}
</style>
