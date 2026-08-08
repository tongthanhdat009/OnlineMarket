import apiClient from "./apiClient";

const API_URL = "/api/products";

// Named exports
export async function getProducts() {
  const res = await apiClient.get(API_URL);
  return res.data;
}

export async function addProduct(product) {
  const res = await apiClient.post(API_URL, product);
  return res.data;
}

export async function updateProduct(id, product) {
  const res = await apiClient.put(`${API_URL}/${id}`, product);
  return res.data;
}

export async function deleteProduct(id) {
  const res = await apiClient.delete(`${API_URL}/${id}`);
  return res.data;
}
