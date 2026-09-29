import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Bill } from "../types/domain";

export const billsApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Bill>> => apiClient.list<Bill>("api/bill", { page: 1, pageSize: 20, ...query }),
  byId: (billId: number): Promise<Bill> => apiClient.get<Bill>(`api/bill/${billId}`),
  byCustomer: (customerId: number): Promise<Bill[]> => apiClient.get<Bill[]>(`api/bill/customer/${customerId}`),
  byOrder: (orderId: number): Promise<Bill> => apiClient.get<Bill>(`api/bill/order/${orderId}`),
  byStatus: (status: string, query?: ListQuery): Promise<ApiListResult<Bill>> => apiClient.list<Bill>(`api/bill/status/${encodeURIComponent(status)}`, { page: 1, pageSize: 20, ...query }),
  byDateRange: (from: string, to: string, query?: ListQuery): Promise<ApiListResult<Bill>> => apiClient.list<Bill>("api/bill/date-range", { startDate: from, endDate: to, page: 1, pageSize: 20, ...query }),
  createFromOrder: (orderId: number): Promise<Bill | { message?: string; data?: Bill }> => apiClient.post(`api/bill/create-from-order/${orderId}`),
  updateStatus: (billId: number, status: string): Promise<Bill | { message?: string; data?: Bill }> => apiClient.put(`api/bill/${billId}/status`, { Status: status }),
  pay: (billId: number, paymentMethod = "cash"): Promise<Bill | { message?: string; data?: Bill }> => apiClient.post(`api/bill/${billId}/pay`, { PaymentMethod: paymentMethod }),
  cancel: (billId: number): Promise<Bill> => apiClient.post<Bill>(`api/bill/${billId}/cancel`),
  remove: (billId: number): Promise<void> => apiClient.delete<void>(`api/bill/${billId}`),
  totalRevenue: (): Promise<number | { totalRevenue: number }> => apiClient.get("api/bill/revenue/total"),
  revenueByDateRange: (from: string, to: string): Promise<unknown> => apiClient.get("api/bill/revenue/date-range", { startDate: from, endDate: to }),
};
