import type { CustomerApiClient } from "./core/client-core";
import type {
  ApiMessageResponse,
  CreateRefundRequest,
  RefundRequestDto,
} from "../types";
import { asId } from "./core/http-utils";

export function createRefundsNamespace(client: CustomerApiClient) {
  return {
    list: () => client.request<RefundRequestDto[]>("/customerrefund"),
    byOrder: (orderId: number) =>
      client.request<RefundRequestDto[]>(
        `/customerrefund/order/${asId(orderId)}`,
      ),
    create: (request: CreateRefundRequest) =>
      client.request<RefundRequestDto>("/customerrefund", {
        method: "POST",
        body: request,
      }),
    cancel: (refundId: number) =>
      client.request<ApiMessageResponse>(`/customerrefund/${asId(refundId)}`, {
        method: "DELETE",
      }),
  };
}

export type RefundsNamespace = ReturnType<typeof createRefundsNamespace>;
