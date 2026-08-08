import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Profile from "../views/Profile.vue";
import Dashboard from "../views/Dashboard.vue";
import Customers from "../views/Customers.vue";
import Orders from "../views/Orders.vue";
import OrdersOnline from "../views/OrdersOnline.vue";
import Refunds from "../views/Refunds.vue";
import Products from "../views/Products.vue";
import Users from "../views/Users.vue";
import Categories from "../views/Categories.vue";
import Suppliers from "../views/Suppliers.vue";
import Inventory from "../views/Inventory.vue";
import Promotions from "../views/Promotions.vue";
import RolePermission from "../views/RolePermission.vue";
import POS from "../views/POS.vue";
import { hasPermission } from "../utils/permissionUtils.js";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login, meta: { requiresAuth: false } },
  { path: "/profile", component: Profile, meta: { requiresAuth: true } },
  {
    path: "/dashboard",
    component: Dashboard,
    meta: {
      requiresAuth: true,
      actionKey: "dashboard_view",
      icon: "📊",
      label: "Dashboard",
    },
  },
  {
    path: "/pos",
    component: POS,
    meta: {
      requiresAuth: true,
      actionKey: "order_manage",
      icon: "🛒",
      label: "POS",
    },
  },
  {
    path: "/users",
    component: Users,
    meta: {
      requiresAuth: true,
      actionKey: "user_manage",
      icon: "👥",
      label: "Users",
    },
  },
  {
    path: "/customers",
    component: Customers,
    meta: {
      requiresAuth: true,
      actionKey: "customer_manage",
      icon: "👨‍👩‍👧‍👦",
      label: "Customers",
    },
  },
  {
    path: "/suppliers",
    component: Suppliers,
    meta: {
      requiresAuth: true,
      actionKey: "supplier_manage",
      icon: "🚚",
      label: "Suppliers",
    },
  },
  {
    path: "/categories",
    component: Categories,
    meta: {
      requiresAuth: true,
      actionKey: "category_manage",
      icon: "🏷️",
      label: "Categories",
    },
  },
  {
    path: "/products",
    component: Products,
    meta: {
      requiresAuth: true,
      actionKey: "product_manage",
      icon: "📦",
      label: "Products",
    },
  },
  {
    path: "/inventory",
    component: Inventory,
    meta: {
      requiresAuth: true,
      actionKey: "inventory_manage",
      icon: "🏭",
      label: "Inventory",
    },
  },
  {
    path: "/promotions",
    component: Promotions,
    meta: {
      requiresAuth: true,
      actionKey: "promotion_manage",
      icon: "🎁",
      label: "Promotions",
    },
  },
  {
    path: "/orders",
    component: Orders,
    meta: {
      requiresAuth: true,
      actionKey: "order_manage",
      icon: "📝",
      label: "Orders",
    },
  },
  {
    path: "/orders-online",
    component: OrdersOnline,
    meta: {
      requiresAuth: true,
      actionKey: "order_manage",
      icon: "🌐",
      label: "Orders Online",
    },
  },
  {
    path: "/refunds",
    component: Refunds,
    meta: {
      requiresAuth: true,
      actionKey: "order_manage",
      icon: "💸",
      label: "Refunds",
    },
  },
  {
    path: "/role-permission",
    component: RolePermission,
    meta: {
      requiresAuth: true,
      actionKey: "role_manage",
      icon: "🔐",
      label: "Role & Permission",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔐 Navigation Guard - Kiểm tra authentication và permissions
router.beforeEach((to, from, next) => {
  const accessToken = localStorage.getItem("accessToken");

  // Nếu route yêu cầu authentication
  if (to.meta.requiresAuth) {
    if (!accessToken) {
      // Không có token -> chuyển về login
      console.log("🔒 No token found, redirecting to login");
      next("/login");
      return;
    }

    // Kiểm tra permissions nếu route có actionKey
    if (to.meta.actionKey) {
      const hasAccess = hasPermission(to.meta.actionKey);

      if (!hasAccess) {
        // Không có quyền truy cập
        console.warn(
          `⛔ Access denied to ${to.path} - Missing permission: ${to.meta.actionKey}`
        );
        alert(
          `Bạn không có quyền truy cập trang này!\nPermission cần thiết: ${to.meta.actionKey}`
        );

        // Redirect về dashboard hoặc trang có quyền đầu tiên
        if (from.path !== "/login" && from.path !== "/") {
          next(false); // Giữ nguyên trang hiện tại
        }
        else {
          next("/profile"); // Hoặc trang mặc định
        }
        return;
      }
    }

    // Có token và có quyền -> cho phép truy cập
    next();
  }
  else {
    // Route không yêu cầu auth (như /login) -> cho phép truy cập
    next();
  }
});

export default router;
