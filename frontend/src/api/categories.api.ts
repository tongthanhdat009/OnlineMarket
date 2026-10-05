import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Category } from "../types/domain";

export interface CategoryInput { CategoryName: string; }

export const categoriesApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Category>> => apiClient.list<Category>("api/Categories", { page: 1, pageSize: 50, ...query }),
  byId: (id: number): Promise<Category> => apiClient.get<Category>(`api/Categories/${id}`),
  create: (input: CategoryInput): Promise<Category> => apiClient.post<Category>("api/Categories", input),
  update: (id: number, input: Partial<CategoryInput>): Promise<Category> => apiClient.put<Category>(`api/Categories/${id}`, { CategoryId: id, ...input }),
  remove: (id: number): Promise<void> => apiClient.delete<void>(`api/Categories/${id}`),
};
