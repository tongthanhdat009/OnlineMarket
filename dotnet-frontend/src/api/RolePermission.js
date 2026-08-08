import apiClient from "./apiClient";

const API_URL = "/api/rolepermission";

export const getAllRolePermissions = async () => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const assignPermissionToRole = async (roleId, permissionId) => {
  const response = await apiClient.post(`${API_URL}/assign`, {
    RoleId: roleId,
    PermissionId: permissionId,
  });
  return response.data;
};

export const removePermissionFromRole = async (roleId, permissionId) => {
  const response = await apiClient.delete(`${API_URL}/remove`, {
    data: {
      RoleId: roleId,
      PermissionId: permissionId,
    },
  });
  return response.data;
};
