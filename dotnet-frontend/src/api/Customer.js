import apiClient from "./apiClient";

const CUSTOMER_API_URL = "/api/customer";

// Fetch list of customers from backend
export async function fetchCustomers() {
  const res = await apiClient.get(CUSTOMER_API_URL);
  return res.data;
}

// Create a new customer
export async function addCustomer(payload) {
  const res = await apiClient.post(CUSTOMER_API_URL, payload);
  return res.data;
}

// Update an existing customer by id
export async function updateCustomer(id, payload) {
  const url = `${CUSTOMER_API_URL}/${id}`;
  const res = await apiClient.put(url, payload);
  return res.data;
}

// Delete customer by id
export async function deleteCustomer(id) {
  const url = `${CUSTOMER_API_URL}/${id}`;
  const res = await apiClient.delete(url);
  return res.data;
}

// Get orders for a specific customer
export async function getCustomerOrders(id) {
  // Use order API to get orders by customer
  const url = `/api/order/customer/${id}`;
  const res = await apiClient.get(url);
  return res.data;
}

export async function getTopCustomers() {
  const res = await apiClient.get(`${CUSTOMER_API_URL}/top-buyers`);
  return res.data;
}

export async function getCustomersBySpending() {
  const res = await apiClient.get(`${CUSTOMER_API_URL}/spending`);
  return res.data;
}
