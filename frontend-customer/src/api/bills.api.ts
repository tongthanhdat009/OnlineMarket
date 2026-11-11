import type { CustomerApiClient } from "./core/client-core";
import type { BillDto } from "../types";
import { asId } from "./core/http-utils";

export function createBillsNamespace(client: CustomerApiClient) {
  return {
    list: () => client.request<BillDto[]>("/customer/bills"),
    get: (billId: number) =>
      client.request<BillDto>(`/customer/bills/${asId(billId)}`),
    byOrder: (orderId: number) =>
      client.request<BillDto>(`/customer/bills/order/${asId(orderId)}`),
    byStatus: (status: string) =>
      client.request<BillDto[]>(
        `/customer/bills/status/${encodeURIComponent(status)}`,
      ),
    unpaid: () => client.request<BillDto[]>("/customer/bills/unpaid"),
    paid: () => client.request<BillDto[]>("/customer/bills/paid"),
    totalSpent: () =>
      client.request<{ totalSpent: number }>("/customer/bills/total-spent"),
  };
}

export type BillsNamespace = ReturnType<typeof createBillsNamespace>;
