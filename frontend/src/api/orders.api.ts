import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Order, Promotion, RefundRequest } from "../types/domain";

export interface OrderListQuery extends ListQuery {
  status?: string;
  payment?: string;
  orderType?: string;
}

export interface CreateOrderInput extends Partial<Order> {
  OrderItems?: Array<Record<string, unknown>>;
}

export const ordersApi = {
  online: (query?: OrderListQuery): Promise<ApiListResult<Order>> => apiClient.list<Order>("api/order/online", { page: 1, pageSize: 20, ...query }),
  offline: (query?: OrderListQuery): Promise<ApiListResult<Order>> => apiClient.list<Order>("api/order/offline", { page: 1, pageSize: 20, ...query }),
  byId: (id: number): Promise<Order> => apiClient.get<Order>(`api/order/${id}`),
  byCustomer: (customerId: number): Promise<Order[]> => apiClient.get<Order[]>(`api/order/customer/${customerId}`),
  promotions: (): Promise<Promotion[]> => apiClient.get<Promotion[]>("api/order/promotions"),
  create: (input: CreateOrderInput): Promise<{ message?: string; Order?: Order } | Order> => apiClient.post("api/order", input),
  updateStatus: (orderId: number, status: string): Promise<unknown> => apiClient.put(`api/order/${orderId}/status`, { Status: status }),
  cancel: (id: number): Promise<unknown> => apiClient.put(`api/order/${id}/cancel`),
  cancelAdmin: (orderId: number): Promise<unknown> => apiClient.put(`api/order/${orderId}/cancel-admin`),
  refundRequests: (query?: ListQuery): Promise<ApiListResult<RefundRequest>> => apiClient.list<RefundRequest>("api/order/refund-requests", { page: 1, pageSize: 20, ...query }),
  confirmRefund: (id: number): Promise<unknown> => apiClient.put(`api/order/refund-requests/${id}/confirm`),
  total: (): Promise<number> => apiClient.get<number>("api/order/total"),
};
