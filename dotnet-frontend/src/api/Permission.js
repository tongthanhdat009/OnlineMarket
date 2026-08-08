import apiClient from "./apiClient";

const API_URL = "/api/permissions";

export async function getAllPermissions() {
  const response = await apiClient.get(API_URL);
  return response.data;
}

export async function getPermissionsByRole(roleId) {
  const response = await apiClient.get(`/api/permissions/role/${roleId}`);
  return response.data;
}

export async function createPermission(permission) {
  const response = await apiClient.post(API_URL, permission);
  return response.data;
}

export async function updatePermission(id, permission) {
  const response = await apiClient.put(`${API_URL}/${id}`, permission);
  return response.data;
}

export async function deletePermission(id) {
  const response = await apiClient.delete(`${API_URL}/${id}`);
  return response.data;
}
