<template>
  <div class="app" :class="{ 'no-sidebar': isLoginPage }">
    <!-- Sidebar - chỉ hiển thị khi KHÔNG phải trang login -->
    <aside v-if="!isLoginPage" class="sidebar">
      <h2>🏪 Store</h2>
      <nav>
        <router-link 
          v-for="route in allowedRoutes" 
          :key="route.path"
          :to="route.path"
        >
          {{ route.meta.icon }} {{ route.meta.label }}
        </router-link>
        <router-link to="/profile">👤 Profile</router-link>
      </nav>
    </aside>

    <!-- Nội dung chính -->
    <main class="content" :class="{ 'full-width': isLoginPage }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// State
const userPermissions = ref([]);

// Kiểm tra xem có phải trang login không
const isLoginPage = computed(() => route.path === '/login');

// Lấy danh sách routes được phép truy cập dựa trên permissions
const allowedRoutes = computed(() => {
  // Nếu chưa có permissions, trả về mảng rỗng
  if (!userPermissions.value || userPermissions.value.length === 0) {
    return [];
  }

  // Lọc các routes có actionKey trong danh sách permissions
  return router.getRoutes().filter(r => {
    return r.meta?.actionKey && userPermissions.value.includes(r.meta.actionKey);
  });
});

// Lấy permissions từ localStorage
function loadPermissionsFromStorage() {
  try {
    const storedPermissions = localStorage.getItem('permissions');
    
    if (storedPermissions) {
      userPermissions.value = JSON.parse(storedPermissions);
      console.log('✅ Permissions loaded from localStorage:', userPermissions.value);
    } else {
      console.warn('⚠️ Không tìm thấy permissions trong localStorage');
      userPermissions.value = [];
    }
  } catch (error) {
    console.error('❌ Error loading permissions:', error);
    userPermissions.value = [];
  }
}

// Load permissions khi component mount và không phải trang login
onMounted(() => {
  if (!isLoginPage.value) {
    loadPermissionsFromStorage();
  }
});

// Watch route để reload permissions khi chuyển route
watch(() => route.path, (newPath, oldPath) => {
  // Khi chuyển từ login sang trang khác, reload permissions
  if (oldPath === '/login' && newPath !== '/login') {
    console.log('🔄 Reloading permissions after login...');
    loadPermissionsFromStorage();
  }
  // Khi đang ở trang khác mà chưa có permissions
  else if (newPath !== '/login' && userPermissions.value.length === 0) {
    loadPermissionsFromStorage();
  }
});
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  font-family: "Segoe UI", Arial, sans-serif;
}

/* Khi không có sidebar (trang login) */
.app.no-sidebar {
  display: block;
}

/* Sidebar */
.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: #fff;
  padding: 20px 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
}

.sidebar h2 {
  text-align: center;
  margin-bottom: 32px;
  font-size: 28px;
  color: #27ae60;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 10px;
}

.sidebar a {
  display: block;
  color: #ecf0f1;
  font-size: 15px;
  text-decoration: none;
  padding: 14px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.sidebar a:hover {
  background: rgba(39, 174, 96, 0.2);
  transform: translateX(4px);
  color: #27ae60;
}

.sidebar a.router-link-exact-active {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3);
}

/* Nội dung */
.content {
  flex: 1;
  background: #f4f6f8;
  overflow-y: auto;
}

/* Nội dung full width khi không có sidebar */
.content.full-width {
  width: 100%;
  padding: 0;
  background: transparent;
}

/* Scrollbar cho sidebar */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(39, 174, 96, 0.5);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(39, 174, 96, 0.7);
}
</style>
