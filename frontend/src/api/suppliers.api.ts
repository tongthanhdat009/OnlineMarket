import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Supplier } from "../types/domain";

export interface SupplierInput { Name: string; Phone?: string; Email?: string; Address?: string; }

export const suppliersApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Supplier>> => apiClient.list<Supplier>("api/Suppliers", { page: 1, pageSize: 50, ...query }),
  byId: (id: number): Promise<Supplier> => apiClient.get<Supplier>(`api/Suppliers/${id}`),
  create: (input: SupplierInput): Promise<Supplier> => apiClient.post<Supplier>("api/Suppliers", input),
  update: (id: number, input: Partial<SupplierInput>): Promise<Supplier> => apiClient.put<Supplier>(`api/Suppliers/${id}`, { SupplierId: id, ...input }),
  remove: (id: number): Promise<void> => apiClient.delete<void>(`api/Suppliers/${id}`),
};
