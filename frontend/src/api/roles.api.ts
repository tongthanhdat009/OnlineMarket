import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Role } from "../types/domain";

export interface RoleInput { RoleName: string; Description?: string; }

export const rolesApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Role>> => apiClient.list<Role>("api/role", { page: 1, pageSize: 20, ...query }),
  byId: (id: number): Promise<Role> => apiClient.get<Role>(`api/role/${id}`),
  create: (input: RoleInput): Promise<Role> => apiClient.post<Role>("api/role", input),
  update: (id: number, input: Partial<RoleInput>): Promise<Role> => apiClient.put<Role>(`api/role/${id}`, input),
  remove: (id: number): Promise<void> => apiClient.delete<void>(`api/role/${id}`),
};
