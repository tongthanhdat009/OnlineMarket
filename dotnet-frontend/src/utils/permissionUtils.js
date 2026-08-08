/**
 * Utility functions để kiểm tra permissions
 */

/**
 * Lấy danh sách permissions từ localStorage
 * @returns {string[]} Danh sách action keys
 */
export function getPermissions() {
  try {
    const permissions = localStorage.getItem("permissions");
    return permissions ? JSON.parse(permissions) : [];
  } catch (error) {
    console.error("Error getting permissions:", error);
    return [];
  }
}

/**
 * Kiểm tra user có permission cụ thể không
 * @param {string} actionKey - Action key cần kiểm tra
 * @returns {boolean} True nếu có quyền
 */
export function hasPermission(actionKey) {
  const permissions = getPermissions();
  return permissions.includes(actionKey);
}

/**
 * Kiểm tra user có ít nhất một trong các permissions không
 * @param {string[]} actionKeys - Danh sách action keys
 * @returns {boolean} True nếu có ít nhất một quyền
 */
export function hasAnyPermission(actionKeys) {
  const permissions = getPermissions();
  return actionKeys.some((key) => permissions.includes(key));
}

/**
 * Kiểm tra user có tất cả các permissions không
 * @param {string[]} actionKeys - Danh sách action keys
 * @returns {boolean} True nếu có tất cả quyền
 */
export function hasAllPermissions(actionKeys) {
  const permissions = getPermissions();
  return actionKeys.every((key) => permissions.includes(key));
}

/**
 * Clear permissions khỏi localStorage
 */
export function clearPermissions() {
  localStorage.removeItem("permissions");
}
