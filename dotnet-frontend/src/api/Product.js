import apiClient from "./apiClient";

const API_URL = "/api/products";

// Named exports
export async function getProducts() {
  const res = await apiClient.get(API_URL);
  return res.data;
}

export async function getProductsPos() {
  const res = await apiClient.get(`${API_URL}/pos`);
  return res.data;
}

export async function getTotalProducts() {
  const res = await apiClient.get(`${API_URL}/total`);
  return res.data;
}

export async function getTopProducts() {
  const res = await apiClient.get(`${API_URL}/top-products`);
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

export async function uploadProductImage(id, imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await apiClient.post(`${API_URL}/${id}/upload-image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}
