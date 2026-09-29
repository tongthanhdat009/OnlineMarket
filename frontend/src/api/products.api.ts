import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Product } from "../types/domain";

export type ProductInput = Partial<Omit<Product, "ProductId" | "Deleted">> & { ProductName: string; Price: number };

export const productsApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Product>> => apiClient.list<Product>("api/products", { page: 1, pageSize: 20, ...query }),
  pos: (query?: ListQuery): Promise<ApiListResult<Product>> => apiClient.list<Product>("api/products/pos", { page: 1, pageSize: 20, ...query }),
  total: (): Promise<number> => apiClient.get<number>("api/products/total"),
  topProducts: (query?: ListQuery): Promise<ApiListResult<Product>> => apiClient.list<Product>("api/products/top-products", { page: 1, pageSize: 20, ...query }),
  byId: (id: number): Promise<Product> => apiClient.get<Product>(`api/products/${id}`),
  create: (input: ProductInput): Promise<Product> => apiClient.post<Product>("api/products", input),
  update: (id: number, input: Partial<ProductInput>): Promise<Product> => apiClient.put<Product>(`api/products/${id}`, { ProductId: id, ...input }),
  archive: (id: number): Promise<void> => apiClient.delete<void>(`api/products/${id}`),
  uploadImage: (id: number, file: File): Promise<Product> => {
    const form = new FormData();
    form.append("image", file);
    return apiClient.post<Product>(`api/products/${id}/upload-image`, form);
  },
};
