import { parseSseStream } from "../lib";
import type { CustomerApiClient } from "./core/client-core";
import type {
  AddSuggestedProductsRequest,
  AddToCartResponse,
  AiChatRequest,
  AiChatResponse,
  AiChatStreamEvent,
} from "../types";

export function createAiNamespace(client: CustomerApiClient) {
  return {
    chat: (request: AiChatRequest) =>
      client.request<AiChatResponse>("/customer/ai/chat", {
        method: "POST",
        body: request,
      }),
    stream: async function* (
      request: AiChatRequest,
      signal?: AbortSignal,
    ): AsyncGenerator<AiChatStreamEvent> {
      const response = await client.rawRequest("/customer/ai/chat/stream", {
        method: "POST",
        body: request,
        accept: "text/event-stream",
        signal,
      });
      yield* parseSseStream<AiChatStreamEvent>(response, { signal });
    },
    addToCart: async (
      request: AddSuggestedProductsRequest,
    ): Promise<AddToCartResponse> => {
      const payload = await client.request<Record<string, unknown>>(
        "/customer/ai/add-to-cart",
        { method: "POST", body: request },
      );
      const addedItems = payload.AddedItems ?? payload.addedItems;
      const errors = payload.Errors ?? payload.errors;
      return {
        Message: (payload.Message ?? payload.message) as
          | string
          | null
          | undefined,
        AddedItems: Array.isArray(addedItems)
          ? addedItems.map((item) => {
              const row = item as Record<string, unknown>;
              return {
                ProductId: Number(row.ProductId ?? row.productId),
                Quantity: Number(row.Quantity ?? row.quantity),
                Success: Boolean(row.Success ?? row.success),
              };
            })
          : null,
        Errors: Array.isArray(errors)
          ? errors.filter((error): error is string => typeof error === "string")
          : null,
      };
    },
  };
}

export type AiNamespace = ReturnType<typeof createAiNamespace>;
