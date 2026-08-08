import apiClient from "./apiClient";

const API_URL = "/api";

/**
 * Central Order API helpers used by the POS view.
 * Keep only order-related endpoints here (promotions, create order, fetch order).
 */

export const fetchPromotions = async () => {
  try {
    const res = await apiClient.get(`${API_URL}/order/promotions`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch promotions:", error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const res = await apiClient.post(`${API_URL}/order`, orderData);
    return res.data;
  } catch (error) {
    console.error("Failed to create order:", error);
    throw error;
  }
};

export const fetchOrderById = async (orderId) => {
  try {
    console.log("Fetching order with id:", `${API_URL}/order/${orderId}`);
    const response = await apiClient.get(`${API_URL}/order/${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch order with id ${orderId}:`, error);
    throw error;
  }
};

// Get all offline orders
export const fetchOrders = async () => {
  try {
    const res = await apiClient.get(`${API_URL}/order/offline`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
};

// Get all online orders
export const fetchOrdersOnline = async () => {
  try {
    const res = await apiClient.get(`${API_URL}/order/online`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch online orders:", error);
    throw error;
  }
};

// Cancel an order (Admin)
export const cancelOrder = async (orderId) => {
  try {
    const res = await apiClient.put(`${API_URL}/Order/${orderId}/cancel-admin`);
    return res.data;
  } catch (error) {
    const msg =
      error?.response?.data?.message || error?.message || "Cancel order failed";
    console.error(`Failed to cancel order ${orderId}:`, msg);
    throw error;
  }
};

export async function getOrders() {
  const res = await apiClient.get(API_URL);
  return res.data;
}

export async function getTotalOrders() {
  const res = await apiClient.get(`${API_URL}/order/total`);
  return res.data;
}

export async function getOrdersByYear(year) {
  const res = await apiClient.get(`${API_URL}/order/orders-by-year/${year}`);
  return res.data;
}

export async function getSalesByYear(year) {
  const res = await apiClient.get(`${API_URL}/order/sales-by-year/${year}`);
  return res.data;
}

export async function getCompletedOrdersByYear(year) {
  const res = await apiClient.get(
    `${API_URL}/order/completed-orders-by-year/${year}`
  );
  return res.data;
}

export async function getCompletedSalesByYear(year) {
  const res = await apiClient.get(
    `${API_URL}/order/completed-sales-by-year/${year}`
  );
  return res.data;
}

export async function getDashboardStats() {
  const res = await apiClient.get(`${API_URL}/order/dashboard-stats`);
  return res.data;
}

export async function getPeakTimeStats() {
  const res = await apiClient.get(`${API_URL}/order/peak-time`);
  return res.data;
}

export async function getDailyOrderStats(year, month) {
  const res = await apiClient.get(
    `${API_URL}/order/daily-stats/${year}/${month}`
  );
  return res.data;
}

export const updateOrderStatus = async (orderId, status) => {
  try {
    const res = await apiClient.put(`${API_URL}/order/${orderId}/status`, {
      status,
    });
    return res.data;
  } catch (error) {
    console.error(`Failed to update status for order ${orderId}:`, error);
    throw error;
  }
};

export const fetchRefundRequests = async () => {
  try {
    const res = await apiClient.get(`${API_URL}/order/refund-requests`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch refund requests:", error);
    throw error;
  }
};

export const confirmRefund = async (refundId) => {
  try {
    const res = await apiClient.put(
      `${API_URL}/order/refund-requests/${refundId}/confirm`
    );
    return res.data;
  } catch (error) {
    console.error(`Failed to confirm refund ${refundId}:`, error);
    throw error;
  }
};
