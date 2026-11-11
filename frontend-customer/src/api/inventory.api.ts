import type { CustomerApiClient } from "./core/client-core";
import type {
  ValidateCartStockRequest,
  ValidateCartStockResponse,
} from "../types";

export function createInventoryNamespace(client: CustomerApiClient) {
  return {
    validateCartStock: (request: ValidateCartStockRequest) =>
      client.request<ValidateCartStockResponse>(
        "/inventory/customer/validate-cart-stock",
        { method: "POST", body: request, auth: false },
      ),
  };
}

export type InventoryNamespace = ReturnType<typeof createInventoryNamespace>;
