import { ApiError, getStoredToken, unwrapData } from "../../lib";
import {
  parseErrorPayload,
  requestUrl,
  resolveApiBaseUrl,
  responseMessage,
} from "./http-utils";
export {
  asId,
  customerFromPayload,
  queryString,
  resolveApiBaseUrl,
} from "./http-utils";
import { createAiNamespace, type AiNamespace } from "../ai.api";
import { createAuthNamespace, type AuthNamespace } from "../auth.api";
import { createBillsNamespace, type BillsNamespace } from "../bills.api";
import { createCartNamespace, type CartNamespace } from "../cart.api";
import {
  createInventoryNamespace,
  type InventoryNamespace,
} from "../inventory.api";
import { createOrdersNamespace, type OrdersNamespace } from "../orders.api";
import { createPaymentNamespace, type PaymentNamespace } from "../payment.api";
import {
  createPromotionsNamespace,
  type PromotionsNamespace,
} from "../promotions.api";
import { createProductsNamespace, type ProductsNamespace } from "../products.api";
import { createRefundsNamespace, type RefundsNamespace } from "../refunds.api";

export interface RequestOptions extends Omit<
  RequestInit,
  "body" | "headers" | "method"
> {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  auth?: boolean;
  accept?: string;
  responseType?: "json" | "blob" | "text";
}

export interface OrderPageQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  tokenProvider?: () => string | null;
}

const runtimeEnv = (
  import.meta as ImportMeta & { env?: Record<string, string | undefined> }
).env;
export const API_BASE_URL = resolveApiBaseUrl(runtimeEnv?.VITE_API_URL);

export class CustomerApiClient {
  readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly tokenProvider: () => string | null;

  readonly auth: AuthNamespace;
  readonly products: ProductsNamespace;
  readonly cart: CartNamespace;
  readonly inventory: InventoryNamespace;
  readonly promotions: PromotionsNamespace;
  readonly orders: OrdersNamespace;
  readonly bills: BillsNamespace;
  readonly payment: PaymentNamespace;
  readonly refunds: RefundsNamespace;
  readonly ai: AiNamespace;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = resolveApiBaseUrl(
      options.baseUrl ?? runtimeEnv?.VITE_API_URL,
    );
    const nativeFetch =
      typeof window !== "undefined" ? window.fetch.bind(window) : typeof globalThis !== "undefined" && typeof globalThis.fetch !== "undefined" ? globalThis.fetch.bind(globalThis) : fetch;
    this.fetcher = options.fetcher ?? nativeFetch;
    this.tokenProvider = options.tokenProvider ?? getStoredToken;

    this.auth = createAuthNamespace(this);
    this.products = createProductsNamespace(this);
    this.cart = createCartNamespace(this);
    this.inventory = createInventoryNamespace(this);
    this.promotions = createPromotionsNamespace(this);
    this.orders = createOrdersNamespace(this);
    this.bills = createBillsNamespace(this);
    // payment.create delegates to orders.pay — pass the wired instance.
    this.payment = createPaymentNamespace(this, this.orders);
    this.refunds = createRefundsNamespace(this);
    this.ai = createAiNamespace(this);
  }

  async rawRequest(
    path: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const {
      method = "GET",
      body,
      auth = true,
      accept,
      responseType = "json",
      ...init
    } = options;
    const headers = new Headers(init.headers);
    headers.set(
      "Accept",
      accept ??
        (responseType === "json"
          ? "application/json"
          : responseType === "blob"
            ? "application/pdf, application/octet-stream"
            : "text/plain"),
    );
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (auth) {
      const token = this.tokenProvider();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await this.fetcher(
      requestUrl(this.baseUrl, path),
      {
        ...init,
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const payload = await parseErrorPayload(response);
      throw new ApiError(
        responseMessage(payload) ?? `Yêu cầu thất bại (${response.status}).`,
        response.status,
        payload,
      );
    }
    return response;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const responseType = options.responseType ?? "json";
    const response = await this.rawRequest(path, options);
    if (response.status === 204) return undefined as T;
    if (responseType === "blob") return (await response.blob()) as T;
    if (responseType === "text") return (await response.text()) as T;
    const payload = (await response.json()) as unknown;
    return unwrapData(payload) as T;
  }
}
