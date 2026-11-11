import type { CustomerApiClient } from "./core/client-core";
import type {
  AddCartItemRequest,
  ApiMessageResponse,
  CartItemDto,
  CartTotalResponse,
  UpdateCartItemRequest,
  ValidateCheckoutRequest,
  ValidateCheckoutResponse,
} from "../types";
import { asId } from "./core/http-utils";

export function createCartNamespace(client: CustomerApiClient) {
  return {
    items: () => client.request<CartItemDto[]>("/customer/cart/items"),
    add: (request: AddCartItemRequest) =>
      client.request<CartItemDto>("/customer/cart/items", {
        method: "POST",
        body: request,
      }),
    update: (productId: number, request: UpdateCartItemRequest) =>
      client.request<CartItemDto>(`/customer/cart/items/${asId(productId)}`, {
        method: "PUT",
        body: request,
      }),
    remove: (productId: number) =>
      client.request<ApiMessageResponse>(
        `/customer/cart/items/${asId(productId)}`,
        { method: "DELETE" },
      ),
    clear: () =>
      client.request<ApiMessageResponse>("/customer/cart", { method: "DELETE" }),
    total: () => client.request<CartTotalResponse>("/customer/cart/total"),
    validateCheckout: (request: ValidateCheckoutRequest = {}) =>
      client.request<ValidateCheckoutResponse>(
        "/customer/cart/validate-checkout",
        { method: "POST", body: request },
      ),
  };
}

export type CartNamespace = ReturnType<typeof createCartNamespace>;
