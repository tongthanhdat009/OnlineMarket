<template>
  <div class="app" :class="{ 'no-sidebar': isLoginPage, 'sidebar-collapsed': sidebarCollapsed }">
    <div v-if="!isLoginPage && mobileOpen" class="sidebar-overlay" @click="mobileOpen = false"></div>
    <button v-if="!isLoginPage" class="mobile-toggle" @click="mobileOpen = !mobileOpen">☰</button>
    <aside v-if="!isLoginPage" class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileOpen }">
      <div class="sidebar-header">
        <h2 v-show="!sidebarCollapsed">🏪 Store</h2>
        <span v-show="sidebarCollapsed" class="sidebar-logo-collapsed">🏪</span>
        <button class="collapse-btn desktop-only" @click="toggleSidebar">{{ sidebarCollapsed ? '»' : '«' }}</button>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="route in allowedRoutes"
          :key="route.path"
          :to="route.path"
          :title="route.meta.label"
          @click="mobileOpen = false"
        >
          <span class="nav-icon">{{ route.meta.icon }}</span>
          <span v-show="!sidebarCollapsed" class="nav-label">{{ route.meta.label }}</span>
        </router-link>
      </nav>
      <div v-if="hasToken" class="sidebar-footer" :class="{ collapsed: sidebarCollapsed }">
        <router-link to="/profile" class="footer-profile">
          <div class="footer-avatar">{{ avatarLetter }}</div>
          <div v-show="!sidebarCollapsed" class="footer-info">
            <span class="footer-name">{{ displayName }}</span>
            <span class="footer-role">{{ displayRole }}</span>
          </div>
        </router-link>
        <div v-show="!sidebarCollapsed" class="footer-actions">
          <router-link to="/profile" class="footer-link">Hồ sơ</router-link>
          <button class="footer-logout" @click="handleLogout">Đăng xuất</button>
        </div>
        <button v-show="sidebarCollapsed" class="footer-logout-collapsed" @click="handleLogout" title="Đăng xuất">⎋</button>
      </div>
    </aside>

    <main class="content" :class="{ 'full-width': isLoginPage }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { logout as doLogout } from './api/Auth.js';

const route = useRoute();
const router = useRouter();

const userPermissions = ref([]);
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true');
const mobileOpen = ref(false);
const storedUser = ref(null);

const isLoginPage = computed(() => route.path === '/login');
const hasToken = computed(() => !!localStorage.getItem('accessToken') || !!storedUser.value);

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
watch(sidebarCollapsed, (v) => {
  localStorage.setItem('sidebarCollapsed', String(v));
});

function loadUser() {
  try {
    const raw = localStorage.getItem('user');
    storedUser.value = raw ? JSON.parse(raw) : null;
  } catch {
    storedUser.value = null;
  }
  // fallback: if no user object but role exists, keep storedUser null — displayName will use role
  if (!storedUser.value) {
    const role = localStorage.getItem('role');
    if (role && localStorage.getItem('accessToken')) {
      // keep hasToken true; storedUser stays null so displayName falls back to role
    }
  }
}

const displayName = computed(() => {
  const u = storedUser.value;
  if (u) return u.username || u.Username || u.name || u.Name || u.displayName || u.email || 'User';
  return localStorage.getItem('role') || 'User';
});
const displayRole = computed(() => {
  const u = storedUser.value;
  if (u) return u.role || u.Role || localStorage.getItem('role') || 'User';
  return localStorage.getItem('role') || 'User';
});
const avatarLetter = computed(() => (displayName.value?.charAt(0) || 'U').toUpperCase());

function handleLogout() {
  if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
  doLogout();
  localStorage.removeItem('permissions');
  userPermissions.value = [];
  storedUser.value = null;
  router.push('/login');
}

const allowedRoutes = computed(() => {
  if (!userPermissions.value || userPermissions.value.length === 0) return [];
  return router.getRoutes().filter(r => r.meta?.actionKey && userPermissions.value.includes(r.meta.actionKey));
});

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

onMounted(() => {
  if (!isLoginPage.value) loadPermissionsFromStorage();
  loadUser();
  window.addEventListener('storage', loadUser);
});

watch(() => route.path, (newPath, oldPath) => {
  loadUser();
  mobileOpen.value = false;
  if (oldPath === '/login' && newPath !== '/login') {
    console.log('🔄 Reloading permissions after login...');
    loadPermissionsFromStorage();
  } else if (newPath !== '/login' && userPermissions.value.length === 0) {
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
.app.no-sidebar { display: block; }

/* Sidebar base */
.sidebar {
  width: 250px;
  min-width: 250px;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: #fff;
  padding: 20px 0 0 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease, min-width 0.25s ease;
}
.sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  margin-bottom: 24px;
  gap: 8px;
}
.sidebar-header h2 {
  margin: 0;
  font-size: 28px;
  color: #27ae60;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}
.sidebar-logo-collapsed { font-size: 28px; line-height: 1; }
.collapse-btn {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #ecf0f1;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
}
.collapse-btn:hover { background: rgba(255,255,255,0.15); }

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 10px;
  flex: 1;
}
.sidebar-nav a {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ecf0f1;
  font-size: 15px;
  text-decoration: none;
  padding: 12px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
}
.sidebar.collapsed .sidebar-nav a {
  justify-content: center;
  padding: 12px 6px;
}
.nav-icon { font-size: 18px; flex-shrink: 0; }
.nav-label { overflow: hidden; text-overflow: ellipsis; }
.sidebar-nav a:hover {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}
.sidebar-nav a.router-link-exact-active {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3);
}

/* Footer */
.sidebar-footer {
  margin-top: auto;
  padding: 14px 12px;
  border-top: 1px solid rgba(255,255,255,0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(0,0,0,0.08);
}
.sidebar-footer.collapsed {
  align-items: center;
  padding: 12px 6px;
}
.footer-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #ecf0f1;
}
.sidebar-footer.collapsed .footer-profile { justify-content: center; }
.footer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #27ae60;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
  font-size: 14px;
}
.footer-info { display: flex; flex-direction: column; line-height: 1.2; overflow: hidden; }
.footer-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.footer-role { font-size: 11px; color: #bdc3c7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.footer-actions { display: flex; gap: 8px; }
.footer-link {
  flex: 1;
  text-align: center;
  color: #ecf0f1;
  text-decoration: none;
  font-size: 12px;
  padding: 6px 8px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
}
.footer-link:hover { background: rgba(255,255,255,0.1); }
.footer-logout {
  flex: 1;
  background: #c0392b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
}
.footer-logout:hover { background: #a93226; }
.footer-logout-collapsed {
  background: #c0392b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
.footer-logout-collapsed:hover { background: #a93226; }

/* Overlay + mobile toggle */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 998;
}
.mobile-toggle {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 997;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.content { flex: 1; background: #f4f6f8; overflow-y: auto; }
.content.full-width { width: 100%; padding: 0; background: transparent; }

.sidebar::-webkit-scrollbar { width: 6px; }
.sidebar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); }
.sidebar::-webkit-scrollbar-thumb { background: rgba(39, 174, 96, 0.5); border-radius: 3px; }
.sidebar::-webkit-scrollbar-thumb:hover { background: rgba(39, 174, 96, 0.7); }

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.28s ease;
  }
  .sidebar.mobile-open { transform: translateX(0); }
  .sidebar.collapsed { width: 250px; min-width: 250px; }
  .desktop-only { display: none !important; }
}
@media (min-width: 769px) {
  .mobile-toggle { display: none !important; }
  .sidebar-overlay { display: none !important; }
}
</style>
