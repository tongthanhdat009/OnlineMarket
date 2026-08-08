import { ref, computed } from "vue";
import {
  getPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "../utils/permissionUtils";

/**
 * Composable để quản lý permissions trong component
 */
export function usePermissions() {
  const permissions = ref(getPermissions());

  // Reload permissions từ localStorage
  const reload = () => {
    permissions.value = getPermissions();
  };

  // Kiểm tra có permission không
  const can = (actionKey) => {
    return hasPermission(actionKey);
  };

  // Kiểm tra có ít nhất một permission
  const canAny = (actionKeys) => {
    return hasAnyPermission(actionKeys);
  };

  // Kiểm tra có tất cả permissions
  const canAll = (actionKeys) => {
    return hasAllPermissions(actionKeys);
  };

  // Computed để kiểm tra có permissions nào không
  const hasPermissions = computed(() => permissions.value.length > 0);

  return {
    permissions,
    hasPermissions,
    reload,
    can,
    canAny,
    canAll,
  };
}
