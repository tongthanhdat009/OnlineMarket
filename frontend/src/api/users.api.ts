import { apiClient } from "../lib/api-client";
import { withoutPassword } from "../types/domain";
import type { ApiListResult, ListQuery } from "../types/api";
import type { User } from "../types/domain";

export interface UserInput { Username: string; Password?: string; FullName?: string; Role?: number | null; }

function safeUser(value: unknown): User {
  return withoutPassword((value && typeof value === "object" ? value : {}) as Record<string, unknown>) as User;
}

function safeList(result: ApiListResult<Record<string, unknown>>): ApiListResult<User> {
  return { ...result, items: result.items.map(safeUser) };
}

export const usersApi = {
  async list(query?: ListQuery): Promise<ApiListResult<User>> {
    return safeList(await apiClient.list<Record<string, unknown>>("api/users", { page: 1, pageSize: 20, ...query }));
  },
  total: (): Promise<number> => apiClient.get<number>("api/users/total"),
  byId: async (id: number): Promise<User> => safeUser(await apiClient.get(`api/users/${id}`)),
  create: async (input: UserInput): Promise<User> => safeUser(await apiClient.post("api/users", input)),
  update: async (id: number, input: Partial<UserInput>): Promise<User> => safeUser(await apiClient.put(`api/users/${id}`, { UserId: id, ...input })),
  remove: (id: number): Promise<void> => apiClient.delete<void>(`api/users/${id}`),
};
