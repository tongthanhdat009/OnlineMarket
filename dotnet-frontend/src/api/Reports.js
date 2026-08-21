import apiClient from "./apiClient";

const API_URL = "/api/reports/sales";

export async function getSalesReport(params) {
  const response = await apiClient.get(API_URL, { params });
  return response.data;
}

export async function downloadSalesReport(params) {
  return apiClient.get(`${API_URL}/pdf`, {
    params,
    responseType: "blob",
  });
}
