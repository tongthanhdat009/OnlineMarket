import { apiClient } from "../lib/api-client";
import type { DashboardStats, PeakTime, Order, Product, Customer } from "../types/domain";
import type { ApiListResult } from "../types/api";

export const dashboardApi = {
  stats: () => apiClient.get<DashboardStats>("api/order/dashboard-stats"),
  peakTime: () => apiClient.get<PeakTime>("api/order/peak-time"),
  ordersByYear: (year: number) => apiClient.get<unknown>(`api/order/orders-by-year/${year}`),
  salesByYear: (year: number) => apiClient.get<unknown>(`api/order/sales-by-year/${year}`),
  dailyStats: (year: number, month: number) => apiClient.get<unknown>(`api/order/daily-stats/${year}/${month}`),
  completedOrdersByYear: (year: number) => apiClient.get<unknown>(`api/order/completed-orders-by-year/${year}`),
  completedSalesByYear: (year: number) => apiClient.get<unknown>(`api/order/completed-sales-by-year/${year}`),
  topProducts: (query?: { page?: number; pageSize?: number }) => apiClient.list<Product>("api/products/top-products", { page: 1, pageSize: 20, ...query }),
  topBuyers: (query?: { page?: number; pageSize?: number }) => apiClient.list<Customer>("api/customer/top-buyers", { page: 1, pageSize: 20, ...query }),
  customerSpending: (query?: { page?: number; pageSize?: number }) => apiClient.list<unknown>("api/customer/spending", { page: 1, pageSize: 20, ...query }),
  pendingRefundCount: () => apiClient.get<number | { Count?: number; count?: number }>("api/refundrequest/pending-count"),
  totalOrders: () => apiClient.get<number>("api/order/total"),
};

export type DashboardListResult = ApiListResult<Order>;
