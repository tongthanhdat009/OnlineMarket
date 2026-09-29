import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Inventory } from "../types/domain";

export const inventoryApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Inventory>> => apiClient.list<Inventory>("api/inventory", { page: 1, pageSize: 20, ...query }),
  byId: (id: number): Promise<Inventory> => apiClient.get<Inventory>(`api/inventory/${id}`),
  byProduct: (productId: number): Promise<Inventory> => apiClient.get<Inventory>(`api/inventory/product/${productId}`),
  update: (id: number, input: Partial<Inventory>): Promise<Inventory> => apiClient.put<Inventory>(`api/inventory/${id}`, input),
  /** Backend expects raw JSON integer, deliberately not `{ Quantity: number }`. */
  setProductQuantity: (productId: number, quantity: number): Promise<Inventory> => apiClient.patch<Inventory>(`api/inventory/product/${productId}/quantity`, quantity),
  validateCartStock: (input: unknown): Promise<unknown> => apiClient.post("api/inventory/customer/validate-cart-stock", input),
};

export function inventoryLevel(quantity: number | null | undefined): "out-of-stock" | "low" | "normal" {
  if (!quantity || quantity <= 0) return "out-of-stock";
  if (quantity <= 5) return "low";
  return "normal";
}
