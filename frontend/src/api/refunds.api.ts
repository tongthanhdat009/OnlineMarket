import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { RefundRequest } from "../types/domain";

export type ProcessRefundStatus = "approved" | "rejected" | "completed";
export interface CreateRefundInput { OrderId: number; RefundAmount: number; Reason?: string; CustomerBankName?: string; CustomerBankAccount?: string; CustomerAccountHolder?: string; }
export interface ProcessRefundInput { Status: ProcessRefundStatus; AdminNote?: string; GatewayRefundId?: string; }

export const refundsApi = {
  list: (query?: ListQuery): Promise<ApiListResult<RefundRequest>> => apiClient.list<RefundRequest>("api/refundrequest", { page: 1, pageSize: 20, ...query }),
  byId: (id: number): Promise<RefundRequest> => apiClient.get<RefundRequest>(`api/refundrequest/${id}`),
  byOrder: (orderId: number): Promise<RefundRequest[]> => apiClient.get<RefundRequest[]>(`api/refundrequest/order/${orderId}`),
  byStatus: (status: string, query?: ListQuery): Promise<ApiListResult<RefundRequest>> => apiClient.list<RefundRequest>(`api/refundrequest/status/${encodeURIComponent(status)}`, { page: 1, pageSize: 20, ...query }),
  pendingCount: (): Promise<number | { Count?: number; count?: number }> => apiClient.get("api/refundrequest/pending-count"),
  create: (input: CreateRefundInput): Promise<RefundRequest> => apiClient.post<RefundRequest>("api/refundrequest", input),
  process: (id: number, input: ProcessRefundInput): Promise<RefundRequest> => apiClient.put<RefundRequest>(`api/refundrequest/${id}/process`, input),
  remove: (id: number): Promise<void> => apiClient.delete<void>(`api/refundrequest/${id}`),
};
