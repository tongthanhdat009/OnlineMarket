import type { CustomerApiClient } from "./core/client-core";
import type { OrderPageQuery } from "./core/client-core";
import type {
  ApiMessageResponse,
  CancelOrderRequest,
  CheckoutRequest,
  CreateOrderFromCartRequest,
  CreatePaymentRequest,
  OrderDto,
  OrderItemWithProductDto,
  PagedResultDto,
  PaymentDto,
} from "../types";
import { asId, queryString } from "./core/http-utils";

export function createOrdersNamespace(client: CustomerApiClient) {
  return {
    list: () => client.request<OrderDto[]>("/customer/orders"),
    paged: (query: OrderPageQuery = {}) =>
      client.request<PagedResultDto<OrderDto>>(
        `/customer/orders/paged?${queryString(query)}`,
      ),
    get: (orderId: number) =>
      client.request<OrderDto>(`/customer/orders/${asId(orderId)}`),
    items: (orderId: number) =>
      client.request<OrderItemWithProductDto[]>(
        `/customer/orders/${asId(orderId)}/orderitem-with-product`,
      ),
    byStatus: (status: string) =>
      client.request<OrderDto[]>(
        `/customer/orders/by-status/${encodeURIComponent(status)}`,
      ),
    createFromCart: (request: CreateOrderFromCartRequest) =>
      client.request<OrderDto>("/customer/orders/create-from-cart", {
        method: "POST",
        body: request,
      }),
    preview: (request: CreateOrderFromCartRequest) =>
      client.request<OrderDto>("/customer/orders/preview", {
        method: "POST",
        body: request,
      }),
    checkout: (request: CheckoutRequest) =>
      client.request<OrderDto>("/customer/orders/checkout", {
        method: "POST",
        body: request,
      }),
    cancel: (orderId: number, request: CancelOrderRequest = {}) =>
      client.request<ApiMessageResponse>(
        `/customer/orders/${asId(orderId)}/cancel`,
        { method: "POST", body: request },
      ),
    pay: (orderId: number, request: CreatePaymentRequest) =>
      client.request<PaymentDto>(`/customer/orders/${asId(orderId)}/pay`, {
        method: "POST",
        body: request,
      }),
    invoice: (orderId: number) =>
      client.request<Blob>(`/customer/orders/${asId(orderId)}/invoice-pdf`, {
        responseType: "blob",
      }),
  };
}

export type OrdersNamespace = ReturnType<typeof createOrdersNamespace>;
