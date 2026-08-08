import apiClient from "./apiClient";

const API_URL = "/api/inventory";

// Lấy danh sách tất cả inventory
export const getInventories = async () => {
  try {
    const response = await apiClient.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching inventories:", error);
    throw error;
  }
};

// Lấy inventory theo ID
export const getInventoryById = async (id) => {
  try {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory by ID:", error);
    throw error;
  }
};

// Lấy inventory theo Product ID
export const getInventoryByProductId = async (productId) => {
  try {
    const response = await apiClient.get(`${API_URL}/product/${productId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory by product ID:", error);
    throw error;
  }
};

// Cập nhật inventory
export const updateInventory = async (id, inventoryData) => {
  try {
    const response = await apiClient.put(`${API_URL}/${id}`, inventoryData);
    return response.data;
  } catch (error) {
    console.error("Error updating inventory:", error);
    throw error;
  }
};

// Cập nhật số lượng inventory theo Product ID
export const updateQuantity = async (productId, quantity) => {
  try {
    const response = await apiClient.patch(
      `${API_URL}/product/${productId}/quantity`,
      quantity
    );
    return response.data;
  } catch (error) {
    console.error("Error updating quantity:", error);
    throw error;
  }
};
