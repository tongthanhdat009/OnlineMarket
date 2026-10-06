import { ApiError, parseSseStream, getStoredToken, unwrapData } from "../lib";
import type {
  AddCartItemRequest,
  AddSuggestedProductsRequest,
  AddToCartResponse,
  ApiMessageResponse,
  AiChatRequest,
  AiChatResponse,
  AiChatStreamEvent,
  ApplyPromoRequest,
  ApplyPromoResponse,
  BillDto,
  CancelOrderRequest,
  CategoryDto,
  ChangePasswordRequest,
  CheckoutRequest,
  CreateOrderFromCartRequest,
  CreatePaymentRequest,
  CreateRefundRequest,
  CustomerInfo,
  CartItemDto,
  CartTotalResponse,
  LoginRequest,
  LoginResponse,
  OrderDto,
  OrderItemWithProductDto,
  PagedResultDto,
  PaymentDto,
  ProductDto,
  RefundRequestDto,
  RegisterRequest,
  RegisterResponse,
  UpdateCartItemRequest,
  UpdateProfileRequest,
  ValidateCartStockRequest,
  ValidateCartStockResponse,
  ValidateCheckoutRequest,
  ValidateCheckoutResponse,
  VNPayRequest,
  VNPayResponse,
} from "../types";

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

export function resolveApiBaseUrl(configured?: string): string {
  const value = (configured ?? "").trim().replace(/\/+$/, "");
  if (!value) return "/api";
  if (value === "/api" || value.endsWith("/api")) return value;
  return `${value}/api`;
}

const runtimeEnv = (
  import.meta as ImportMeta & { env?: Record<string, string | undefined> }
).env;
export const API_BASE_URL = resolveApiBaseUrl(runtimeEnv?.VITE_API_URL);

function responseMessage(payload: unknown): string | undefined {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  for (const key of [
    "Message",
    "message",
    "error",
    "Error",
    "title",
    "Title",
  ]) {
    if (typeof record[key] === "string" && (record[key] as string).trim())
      return record[key] as string;
  }
  return undefined;
}

function customerFromPayload(payload: unknown): CustomerInfo | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const customerId = record.CustomerId ?? record.customerId;
  if (customerId === undefined || customerId === null) return null;
  return {
    CustomerId: Number(customerId),
    Name: String(record.Name ?? record.name ?? ""),
    Email: String(record.Email ?? record.email ?? ""),
    Phone: (record.Phone ?? record.phone) as string | null | undefined,
    Address: (record.Address ?? record.address) as string | null | undefined,
    CreatedAt: (record.CreatedAt ?? record.createdAt) as
      string | null | undefined,
  };
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  const type = response.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) return await response.json();
    const text = await response.text();
    return text || undefined;
  } catch {
    return undefined;
  }
}

function requestUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

function asId(value: number): string {
  if (!Number.isInteger(value) || value <= 0)
    throw new TypeError(`ID không hợp lệ: ${value}`);
  return encodeURIComponent(String(value));
}

export class CustomerApiClient {
  readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly tokenProvider: () => string | null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = resolveApiBaseUrl(
      options.baseUrl ?? runtimeEnv?.VITE_API_URL,
    );
    const nativeFetch =
      typeof window !== "undefined" ? window.fetch.bind(window) : typeof globalThis !== "undefined" && typeof globalThis.fetch !== "undefined" ? globalThis.fetch.bind(globalThis) : fetch;
    this.fetcher = options.fetcher ?? nativeFetch;
    this.tokenProvider = options.tokenProvider ?? getStoredToken;
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

  auth = {
    register: async (request: RegisterRequest): Promise<RegisterResponse> => {
      const payload = await this.request<Record<string, unknown>>(
        "/customer/auth/register",
        { method: "POST", body: request, auth: false },
      );
      return {
        Message: String(payload.Message ?? payload.message ?? ""),
        Customer: customerFromPayload(payload.Customer ?? payload.customer),
      };
    },
    login: async (request: LoginRequest): Promise<LoginResponse> => {
      const payload = await this.request<Record<string, unknown>>(
        "/customer/auth/login",
        { method: "POST", body: request, auth: false },
      );
      return {
        Message: String(payload.Message ?? payload.message ?? ""),
        Token: String(payload.Token ?? payload.token ?? ""),
        Customer: customerFromPayload(payload.Customer ?? payload.customer),
      };
    },
    me: async (): Promise<CustomerInfo> => {
      const response =
        await this.request<Record<string, unknown>>("/customer/auth/me");
      return (
        customerFromPayload(response) ?? { CustomerId: 0, Name: "", Email: "" }
      );
    },
    updateProfile: (request: UpdateProfileRequest) =>
      this.request<ApiMessageResponse>("/customer/auth/profile", {
        method: "PUT",
        body: request,
      }),
    changePassword: (request: ChangePasswordRequest) =>
      this.request<ApiMessageResponse>("/customer/auth/change-password", {
        method: "POST",
        body: request,
      }),
  };

  products = {
    list: () =>
      this.request<ProductDto[]>("/customer/products", { auth: false }),
    get: (productId: number) =>
      this.request<ProductDto>(`/customer/products/${asId(productId)}`, {
        auth: false,
      }),
    byCategory: (categoryId: number) =>
      this.request<ProductDto[]>(
        `/customer/products/category/${asId(categoryId)}`,
        { auth: false },
      ),
    search: (keyword: string) => {
      const value = keyword.trim();
      if (!value)
        throw new ApiError("Từ khóa tìm kiếm không được để trống.", 400);
      return this.request<ProductDto[]>(
        `/customer/products/search?keyword=${encodeURIComponent(value)}`,
        { auth: false },
      );
    },
    categories: () =>
      this.request<CategoryDto[]>("/customer/products/categories", {
        auth: false,
      }),
  };

  cart = {
    items: () => this.request<CartItemDto[]>("/customer/cart/items"),
    add: (request: AddCartItemRequest) =>
      this.request<CartItemDto>("/customer/cart/items", {
        method: "POST",
        body: request,
      }),
    update: (productId: number, request: UpdateCartItemRequest) =>
      this.request<CartItemDto>(`/customer/cart/items/${asId(productId)}`, {
        method: "PUT",
        body: request,
      }),
    remove: (productId: number) =>
      this.request<ApiMessageResponse>(
        `/customer/cart/items/${asId(productId)}`,
        { method: "DELETE" },
      ),
    clear: () =>
      this.request<ApiMessageResponse>("/customer/cart", { method: "DELETE" }),
    total: () => this.request<CartTotalResponse>("/customer/cart/total"),
    validateCheckout: (request: ValidateCheckoutRequest = {}) =>
      this.request<ValidateCheckoutResponse>(
        "/customer/cart/validate-checkout",
        { method: "POST", body: request },
      ),
  };

  inventory = {
    validateCartStock: (request: ValidateCartStockRequest) =>
      this.request<ValidateCartStockResponse>(
        "/inventory/customer/validate-cart-stock",
        { method: "POST", body: request, auth: false },
      ),
  };

  promotions = {
    apply: (request: ApplyPromoRequest) =>
      this.request<ApplyPromoResponse>("/promotion/apply", {
        method: "POST",
        body: request,
      }),
  };

  orders = {
    list: () => this.request<OrderDto[]>("/customer/orders"),
    paged: (query: OrderPageQuery = {}) =>
      this.request<PagedResultDto<OrderDto>>(
        `/customer/orders/paged?${queryString(query)}`,
      ),
    get: (orderId: number) =>
      this.request<OrderDto>(`/customer/orders/${asId(orderId)}`),
    items: (orderId: number) =>
      this.request<OrderItemWithProductDto[]>(
        `/customer/orders/${asId(orderId)}/orderitem-with-product`,
      ),
    byStatus: (status: string) =>
      this.request<OrderDto[]>(
        `/customer/orders/by-status/${encodeURIComponent(status)}`,
      ),
    createFromCart: (request: CreateOrderFromCartRequest) =>
      this.request<OrderDto>("/customer/orders/create-from-cart", {
        method: "POST",
        body: request,
      }),
    preview: (request: CreateOrderFromCartRequest) =>
      this.request<OrderDto>("/customer/orders/preview", {
        method: "POST",
        body: request,
      }),
    checkout: (request: CheckoutRequest) =>
      this.request<OrderDto>("/customer/orders/checkout", {
        method: "POST",
        body: request,
      }),
    cancel: (orderId: number, request: CancelOrderRequest = {}) =>
      this.request<ApiMessageResponse>(
        `/customer/orders/${asId(orderId)}/cancel`,
        { method: "POST", body: request },
      ),
    pay: (orderId: number, request: CreatePaymentRequest) =>
      this.request<PaymentDto>(`/customer/orders/${asId(orderId)}/pay`, {
        method: "POST",
        body: request,
      }),
    invoice: (orderId: number) =>
      this.request<Blob>(`/customer/orders/${asId(orderId)}/invoice-pdf`, {
        responseType: "blob",
      }),
  };

  bills = {
    list: () => this.request<BillDto[]>("/customer/bills"),
    get: (billId: number) =>
      this.request<BillDto>(`/customer/bills/${asId(billId)}`),
    byOrder: (orderId: number) =>
      this.request<BillDto>(`/customer/bills/order/${asId(orderId)}`),
    byStatus: (status: string) =>
      this.request<BillDto[]>(
        `/customer/bills/status/${encodeURIComponent(status)}`,
      ),
    unpaid: () => this.request<BillDto[]>("/customer/bills/unpaid"),
    paid: () => this.request<BillDto[]>("/customer/bills/paid"),
    totalSpent: () =>
      this.request<{ totalSpent: number }>("/customer/bills/total-spent"),
  };

  payment = {
    create: (orderId: number, request: CreatePaymentRequest) =>
      this.orders.pay(orderId, request),
    createVNPay: (request: VNPayRequest) =>
      this.request<VNPayResponse>("/customer/vnpay/create-payment", {
        method: "POST",
        body: request,
      }),
    verifyVNPay: (query: Record<string, string>) =>
      this.request<{ isValid: boolean }>(
        `/customer/vnpay/verify-payment?${queryString(query)}`,
        { auth: false },
      ),
  };

  refunds = {
    list: () => this.request<RefundRequestDto[]>("/customerrefund"),
    byOrder: (orderId: number) =>
      this.request<RefundRequestDto[]>(
        `/customerrefund/order/${asId(orderId)}`,
      ),
    create: (request: CreateRefundRequest) =>
      this.request<RefundRequestDto>("/customerrefund", {
        method: "POST",
        body: request,
      }),
    cancel: (refundId: number) =>
      this.request<ApiMessageResponse>(`/customerrefund/${asId(refundId)}`, {
        method: "DELETE",
      }),
  };

  ai = {
    chat: (request: AiChatRequest) =>
      this.request<AiChatResponse>("/customer/ai/chat", {
        method: "POST",
        body: request,
      }),
    stream: async function* (
      this: CustomerApiClient,
      request: AiChatRequest,
      signal?: AbortSignal,
    ): AsyncGenerator<AiChatStreamEvent> {
      const response = await this.rawRequest("/customer/ai/chat/stream", {
        method: "POST",
        body: request,
        accept: "text/event-stream",
        signal,
      });
      yield* parseSseStream<AiChatStreamEvent>(response, { signal });
    }.bind(this),
    addToCart: async (
      request: AddSuggestedProductsRequest,
    ): Promise<AddToCartResponse> => {
      const payload = await this.request<Record<string, unknown>>(
        "/customer/ai/add-to-cart",
        { method: "POST", body: request },
      );
      const addedItems = payload.AddedItems ?? payload.addedItems;
      const errors = payload.Errors ?? payload.errors;
      return {
        Message: (payload.Message ?? payload.message) as
          string | null | undefined,
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

function queryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export const apiClient = new CustomerApiClient();
export const customerApi = apiClient;

export { queryString };
