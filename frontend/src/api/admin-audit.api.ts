import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";

export interface AuditLogQuery extends ListQuery {
  /** Khóa sự kiện, ví dụ: OrderCreated. */
  event?: string;
  /** Tên người thực hiện. */
  actor?: string;
}

export const adminAuditApi = {
  /** Trang nhật ký hoạt động — lọc theo từ khóa / sự kiện / người thực hiện. */
  list: (query?: AuditLogQuery): Promise<ApiListResult<Record<string, unknown>>> =>
    apiClient.list<Record<string, unknown>>("api/admin/audit-log", { page: 1, pageSize: 25, ...query }),

  /** Các loại sự kiện đã ghi (bộ lọc). */
  events: (): Promise<string[]> => apiClient.get<string[]>("api/admin/audit-log/events"),

  /** Người thực hiện đã ghi (bộ lọc). */
  actors: (): Promise<string[]> => apiClient.get<string[]>("api/admin/audit-log/actors"),
};
