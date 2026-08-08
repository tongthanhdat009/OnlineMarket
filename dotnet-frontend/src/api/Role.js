import apiClient from "./apiClient";

const API_URL = "/api/role";

export const getAllRoles = async () => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const createRole = async (role) => {
  const response = await apiClient.post(API_URL, role);
  return response.data;
};

export const updateRole = async (roleId, role) => {
  const response = await apiClient.put(`${API_URL}/${roleId}`, role);
  return response.data;
};

export const deleteRole = async (roleId) => {
  const response = await apiClient.delete(`${API_URL}/${roleId}`);
  return response.data;
};
