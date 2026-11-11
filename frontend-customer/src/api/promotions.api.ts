import type { CustomerApiClient } from "./core/client-core";
import type { ApplyPromoRequest, ApplyPromoResponse } from "../types";

export function createPromotionsNamespace(client: CustomerApiClient) {
  return {
    apply: (request: ApplyPromoRequest) =>
      client.request<ApplyPromoResponse>("/promotion/apply", {
        method: "POST",
        body: request,
      }),
  };
}

export type PromotionsNamespace = ReturnType<typeof createPromotionsNamespace>;
