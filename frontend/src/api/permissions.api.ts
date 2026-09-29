import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Permission, RolePermission } from "../types/domain";

export interface PermissionInput { PermissionName: string; ActionKey: string; Description?: string; }
export interface RolePermissionInput { RoleId: number; PermissionId: number; }

export const permissionsApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Permission>> => apiClient.list<Permission>("api/permissions", { page: 1, pageSize: 20, ...query }),
  byId: (id: number): Promise<Permission> => apiClient.get<Permission>(`api/permissions/${id}`),
  create: (input: PermissionInput): Promise<Permission> => apiClient.post<Permission>("api/permissions", input),
  update: (id: number, input: Partial<PermissionInput>): Promise<Permission> => apiClient.put<Permission>(`api/permissions/${id}`, { PermissionId: id, ...input }),
  remove: (id: number): Promise<void> => apiClient.delete<void>(`api/permissions/${id}`),
  mappings: (query?: ListQuery): Promise<ApiListResult<RolePermission>> => apiClient.list<RolePermission>("api/rolepermission", { page: 1, pageSize: 20, ...query }),
  byRole: (roleId: number): Promise<RolePermission[]> => apiClient.get<RolePermission[]>(`api/rolepermission/role/${roleId}`),
  assign: (input: RolePermissionInput): Promise<unknown> => apiClient.post("api/rolepermission/assign", input),
  removeMapping: (input: RolePermissionInput): Promise<void> => apiClient.delete<void>("api/rolepermission/remove", { body: input }),
};
