<template>
  <div class="profile-page">
    <h2>👤 Thông tin tài khoản</h2>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Đang tải thông tin...</p>
    </div>

    <div v-else-if="errorMessage" class="error-message">
      <span class="icon">❌</span>
      <span>{{ errorMessage }}</span>
    </div>

    <div v-else-if="userInfo" class="profile-container">
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar">
            {{ userInfo.Username?.charAt(0).toUpperCase() || '?' }}
          </div>
          <h3>{{ userInfo.FullName || userInfo.Username }}</h3>
          <span class="badge" :class="getRoleBadgeClass(userInfo.Role)">
            {{ getRoleText(userInfo.Role) }}
          </span>
        </div>

        <div class="profile-info">
          <div class="info-section">
            <h4>📋 Thông tin cá nhân</h4>
            <div class="info-row">
              <span class="label">
                <span class="icon">🆔</span>
                User ID
              </span>
              <span class="value">{{ userInfo.UserId }}</span>
            </div>
            <div class="info-row">
              <span class="label">
                <span class="icon">👤</span>
                Tên đăng nhập
              </span>
              <span class="value">{{ userInfo.Username }}</span>
            </div>
            <div class="info-row">
              <span class="label">
                <span class="icon">📝</span>
                Họ và tên
              </span>
              <span class="value">{{ userInfo.FullName || '(Chưa cập nhật)' }}</span>
            </div>
            <div class="info-row">
              <span class="label">
                <span class="icon">🔑</span>
                Vai trò
              </span>
              <span class="value role-value" :class="getRoleBadgeClass(userInfo.Role)">
                {{ getRoleText(userInfo.Role) }}
              </span>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button @click="refreshData" class="btn btn-refresh">
            <span class="icon">🔄</span>
            Làm mới
          </button>
          <button @click="handleLogout" class="btn btn-logout">
            <span class="icon">🚪</span>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, logout } from '../api/Auth.js';

const router = useRouter();

const userInfo = ref(null);
const loading = ref(false);
const errorMessage = ref('');

// Lấy thông tin user
async function fetchUserInfo() {
  try {
    loading.value = true;
    errorMessage.value = '';
    
    const data = await getCurrentUser();
    userInfo.value = data;
    
  } catch (error) {
    console.error('Fetch user info error:', error);
    
    if (error.response?.status === 401) {
      errorMessage.value = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 2000);
    } else {
      errorMessage.value = error.response?.data?.message || 'Không thể tải thông tin tài khoản';
    }
  } finally {
    loading.value = false;
  }
}

// Làm mới dữ liệu
function refreshData() {
  fetchUserInfo();
}

// Đăng xuất
function handleLogout() {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    logout();
    router.push('/login');
  }
}

// Thêm helper functions
function getRoleText(role) {
  const roles = {
    'admin': 'Quản trị viên',
    'Admin': 'Quản trị viên',
    'staff': 'Nhân viên',
    'Staff': 'Nhân viên',
    'manager': 'Quản lý',
    'Manager': 'Quản lý'
  };
  return roles[role] || role;
}

function getRoleBadgeClass(role) {
  if (!role) return '';
  const roleLower = role.toLowerCase();
  if (roleLower === 'admin') return 'badge-admin';
  if (roleLower === 'staff') return 'badge-staff';
  if (roleLower === 'manager') return 'badge-manager';
  return '';
}

onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped>
.profile-page {
  padding: 20px;
  background: white;
  border-radius: 10px;
  min-height: calc(100vh - 100px);
}

.profile-page h2 {
  margin-bottom: 25px;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #27ae60;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  font-size: 16px;
  color: #666;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 16px 20px;
  border-radius: 10px;
  border-left: 4px solid #e74c3c;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
}

.error-message .icon {
  font-size: 20px;
  flex-shrink: 0;
}

.profile-container {
  gap: 20px;
  width: 100%;
}

.profile-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.profile-header {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  padding: 40px 30px;
  text-align: center;
  position: relative;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: white;
  color: #27ae60;
  font-size: 42px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.profile-header h3 {
  margin: 0 0 12px;
  font-size: 26px;
  font-weight: 700;
}

.badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.5px;
}

.badge-admin {
  background: rgba(231, 76, 60, 0.9);
}

.badge-staff {
  background: rgba(52, 152, 219, 0.9);
}

.badge-manager {
  background: rgba(243, 156, 18, 0.9);
}

.profile-info {
  padding: 30px;
}

.info-section h4 {
  color: #2c3e50;
  font-size: 16px;
  margin: 0 0 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label .icon {
  font-size: 16px;
}

.value {
  color: #2c3e50;
  font-weight: 600;
  font-size: 15px;
}

.role-value {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  color: rgb(0, 0, 0);
}

.role-value.badge-admin {
  background: #e74c3c;
}

.role-value.badge-staff {
  background: #3498db;
}

.role-value.badge-manager {
  background: #f39c12;
}

.profile-actions {
  padding: 25px 30px;
  display: flex;
  gap: 15px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.btn {
  flex: 1;
  padding: 13px 20px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn .icon {
  font-size: 18px;
}

.btn-refresh {
  background: #27ae60;
  color: white;
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
}

.btn-refresh:hover {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4);
}

.btn-logout {
  background: #e74c3c;
  color: white;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.btn-logout:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.profile-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
}

.stat-value.online {
  color: #27ae60;
}

/* Responsive */
@media (max-width: 968px) {
  .profile-container {
    grid-template-columns: 1fr;
  }

  .profile-stats {
    flex-direction: row;
  }
}

@media (max-width: 640px) {
  .profile-page {
    padding: 15px;
  }

  .profile-header {
    padding: 30px 20px;
  }

  .avatar {
    width: 80px;
    height: 80px;
    font-size: 36px;
  }

  .profile-info {
    padding: 20px;
  }

  .profile-actions {
    flex-direction: column;
    padding: 20px;
  }

  .profile-stats {
    flex-direction: column;
  }
}
</style>
