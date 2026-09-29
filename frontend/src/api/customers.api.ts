import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Customer, Order } from "../types/domain";

export interface CustomerInput extends Partial<Customer> { Name: string; }

export const customersApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Customer>> => apiClient.list<Customer>("api/customer", { page: 1, pageSize: 20, ...query }),
  topBuyers: (query?: ListQuery): Promise<ApiListResult<Customer>> => apiClient.list<Customer>("api/customer/top-buyers", { page: 1, pageSize: 20, ...query }),
  spending: (query?: ListQuery): Promise<ApiListResult<unknown>> => apiClient.list<unknown>("api/customer/spending", { page: 1, pageSize: 20, ...query }),
  byId: (id: number): Promise<Customer> => apiClient.get<Customer>(`api/customer/${id}`),
  create: (input: CustomerInput): Promise<Customer> => apiClient.post<Customer>("api/customer", input),
  update: (id: number, input: Partial<CustomerInput>): Promise<Customer> => apiClient.put<Customer>(`api/customer/${id}`, input),
  remove: (id: number): Promise<void> => apiClient.delete<void>(`api/customer/${id}`),
  orders: (customerId: number): Promise<Order[]> => apiClient.get<Order[]>(`api/order/customer/${customerId}`),
};
