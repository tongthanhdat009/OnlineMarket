import type { CustomerApiClient } from "./core/client-core";
import type { OrdersNamespace } from "./orders.api";
import type { CreatePaymentRequest, VNPayRequest, VNPayResponse } from "../types";
import { queryString } from "./core/http-utils";

export function createPaymentNamespace(
  client: CustomerApiClient,
  orders: OrdersNamespace,
) {
  return {
    create: (orderId: number, request: CreatePaymentRequest) =>
      orders.pay(orderId, request),
    createVNPay: (request: VNPayRequest) =>
      client.request<VNPayResponse>("/customer/vnpay/create-payment", {
        method: "POST",
        body: request,
      }),
    verifyVNPay: (query: Record<string, string>) =>
      client.request<{ isValid: boolean }>(
        `/customer/vnpay/verify-payment?${queryString(query)}`,
        { auth: false },
      ),
  };
}

export type PaymentNamespace = ReturnType<typeof createPaymentNamespace>;
