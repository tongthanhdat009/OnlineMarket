import apiClient from "./apiClient";

const API_URL = "/api/categories";

export async function getCategories() {
  const res = await apiClient.get(API_URL);
  return res.data;
}

export async function getTotalCategories() {
  const res = await apiClient.get(`${API_URL}/total`);
  return res.data;
}

export async function addCategory(category) {
  const payload = { categoryName: category.name };
  const res = await apiClient.post(API_URL, payload);
  return res.data;
}

export async function updateCategory(id, category) {
  const res = await apiClient.put(`${API_URL}/${id}`, {
    categoryName: category.name,
  });
  return res.data;
}

export async function deleteCategory(id) {
  await apiClient.delete(`${API_URL}/${id}`);
}
