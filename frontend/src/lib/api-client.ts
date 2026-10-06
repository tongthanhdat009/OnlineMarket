import type {
  ApiErrorPayload,
  ApiListResult,
  ApiRequestOptions,
  ApiTokenPair,
  ListQuery,
} from "../types/api";

const ACCESS_TOKEN_KEY = "store_admin_access_token";
const REFRESH_TOKEN_KEY = "store_admin_refresh_token";

export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: ApiTokenPair): void;
  clear(): void;
}

/** Browser-safe storage. Memory fallback keeps SSR/tests from throwing on localStorage. */
export class BrowserTokenStore implements TokenStore {
  private readonly memory = new Map<string, string>();

  private storage(): Storage | null {
    try {
      return typeof window !== "undefined" ? window.sessionStorage : null;
    } catch {
      return null;
    }
  }

  private get(key: string): string | null {
    return this.storage()?.getItem(key) ?? this.memory.get(key) ?? null;
  }

  private set(key: string, value: string): void {
    this.memory.set(key, value);
    try {
      this.storage()?.setItem(key, value);
    } catch {
      // Private browsing/storage-disabled: memory token still works for this tab.
    }
  }

  getAccessToken(): string | null {
    return this.get(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.get(REFRESH_TOKEN_KEY);
  }

  setTokens(tokens: ApiTokenPair): void {
    this.set(ACCESS_TOKEN_KEY, tokens.accessToken);
    this.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  clear(): void {
    this.memory.delete(ACCESS_TOKEN_KEY);
    this.memory.delete(REFRESH_TOKEN_KEY);
    try {
      this.storage()?.removeItem(ACCESS_TOKEN_KEY);
      this.storage()?.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  }
}

export class ApiError<
  TPayload extends unknown = ApiErrorPayload,
> extends Error {
  readonly status: number;
  readonly payload: TPayload | null;
  readonly requestUrl: string;

  constructor(
    message: string,
    status: number,
    payload: TPayload | null,
    requestUrl: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.requestUrl = requestUrl;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  tokenStore?: TokenStore;
  onTokensRefreshed?: (tokens: ApiTokenPair) => void;
  onSessionExpired?: () => void;
}

function getField(value: unknown, ...names: string[]): unknown {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const name of names) {
    if (record[name] !== undefined) return record[name];
  }
  return undefined;
}

function errorMessage(payload: unknown, status: number): string {
  const direct = getField(
    payload,
    "message",
    "Message",
    "title",
    "Title",
    "detail",
    "Detail",
  );
  if (typeof direct === "string" && direct.trim()) return direct;
  const errors = getField(payload, "errors", "Errors");
  if (errors && typeof errors === "object") {
    const first = Object.values(errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string") return first;
  }
  return `Request failed (${status})`;
}

/** Convert either a raw array or .NET PagedResultDto into one stable shape. */
export function normalizeListResponse<T>(
  payload: unknown,
  defaults?: Partial<Pick<ApiListResult<T>, "page" | "pageSize">>,
): ApiListResult<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      totalCount: payload.length,
      page: defaults?.page ?? 1,
      pageSize: defaults?.pageSize ?? payload.length,
      raw: payload,
    };
  }

  const items = getField(
    payload,
    "Items",
    "items",
    "Data",
    "data",
    "Results",
    "results",
  );
  const list = Array.isArray(items) ? (items as T[]) : [];
  const totalValue = getField(
    payload,
    "TotalCount",
    "totalCount",
    "Total",
    "total",
  );
  const pageValue = getField(payload, "Page", "page");
  const pageSizeValue = getField(payload, "PageSize", "pageSize");
  return {
    items: list,
    totalCount: typeof totalValue === "number" ? totalValue : list.length,
    page: typeof pageValue === "number" ? pageValue : (defaults?.page ?? 1),
    pageSize:
      typeof pageSizeValue === "number"
        ? pageSizeValue
        : (defaults?.pageSize ?? list.length),
    raw: payload,
  };
}

function queryString(query?: ListQuery | Record<string, unknown>): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    const serialized =
      value instanceof Date ? value.toISOString() : String(value);
    params.set(key, serialized);
  }
  const result = params.toString();
  return result ? `?${result}` : "";
}

function tokenPairFromPayload(payload: unknown): ApiTokenPair | null {
  const accessToken = getField(payload, "AccessToken", "accessToken");
  const refreshToken = getField(payload, "RefreshToken", "refreshToken");
  return typeof accessToken === "string" && typeof refreshToken === "string"
    ? { accessToken, refreshToken }
    : null;
}

export class ApiClient {
  readonly baseUrl: string;
  readonly tokenStore: TokenStore;
  private readonly fetchImpl: typeof fetch;
  private readonly onTokensRefreshed?: (tokens: ApiTokenPair) => void;
  private readonly onSessionExpired?: () => void;
  private refreshInFlight: Promise<ApiTokenPair | null> | null = null;

  constructor(options: ApiClientOptions = {}) {
    const viteEnv = (
      import.meta as ImportMeta & { env?: Record<string, string | undefined> }
    ).env;
    this.baseUrl = (options.baseUrl ?? viteEnv?.VITE_API_URL ?? "").replace(
      /\/$/,
      "",
    );
    const nativeFetch =
      typeof window !== "undefined" ? window.fetch.bind(window) : typeof globalThis !== "undefined" && typeof globalThis.fetch !== "undefined" ? globalThis.fetch.bind(globalThis) : fetch;
    this.fetchImpl = options.fetchImpl ?? nativeFetch;
    this.tokenStore = options.tokenStore ?? new BrowserTokenStore();
    this.onTokensRefreshed = options.onTokensRefreshed;
    this.onSessionExpired = options.onSessionExpired;
  }

  private url(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.replace(/^\/+/, "");
    // Vite dev uses `/api` as a proxy prefix while domain modules use `api/...` paths.
    const pathWithoutDuplicatePrefix =
      this.baseUrl.endsWith("/api") && normalizedPath.startsWith("api/")
        ? normalizedPath.slice(4)
        : normalizedPath;
    return `${this.baseUrl}/${pathWithoutDuplicatePrefix}`;
  }

  private async parseResponse(response: Response): Promise<unknown> {
    if (response.status === 204) return undefined;
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async refreshTokens(): Promise<ApiTokenPair | null> {
    if (this.refreshInFlight) return this.refreshInFlight;
    const refreshToken = this.tokenStore.getRefreshToken();
    if (!refreshToken) return null;
    this.refreshInFlight = (async () => {
      try {
        const response = await this.fetchImpl(this.url("api/auth/refresh"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ RefreshToken: refreshToken }),
        });
        const payload = await this.parseResponse(response);
        if (!response.ok) return null;
        const tokens = tokenPairFromPayload(payload);
        if (!tokens) return null;
        this.tokenStore.setTokens(tokens);
        this.onTokensRefreshed?.(tokens);
        return tokens;
      } catch {
        return null;
      } finally {
        this.refreshInFlight = null;
      }
    })();
    return this.refreshInFlight;
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { skipRefresh = false, body, headers, ...init } = options;
    const requestUrl = this.url(path);
    const request = async (): Promise<Response> => {
      const accessToken = this.tokenStore.getAccessToken();
      const nextHeaders = new Headers(headers);
      nextHeaders.set(
        "Accept",
        nextHeaders.get("Accept") ?? "application/json",
      );
      if (
        body !== undefined &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        !nextHeaders.has("Content-Type")
      ) {
        nextHeaders.set("Content-Type", "application/json");
      }
      if (accessToken)
        nextHeaders.set("Authorization", `Bearer ${accessToken}`);
      return this.fetchImpl(requestUrl, {
        ...init,
        headers: nextHeaders,
        body:
          body === undefined
            ? undefined
            : body instanceof FormData || body instanceof Blob
              ? body
              : JSON.stringify(body),
      });
    };

    let response = await request();
    if (
      response.status === 401 &&
      !skipRefresh &&
      !/\/api\/auth\/(?:login|refresh)$/i.test(path)
    ) {
      const tokens = await this.refreshTokens();
      if (tokens)
        response = await request(); // exactly one retry
      else this.onSessionExpired?.();
    }
    const payload = await this.parseResponse(response);
    if (!response.ok)
      throw new ApiError(
        errorMessage(payload, response.status),
        response.status,
        (payload as ApiErrorPayload) ?? null,
        requestUrl,
      );
    return payload as T;
  }

  /** Raw response for SSE/file endpoints. Uses the same bearer/refresh policy. */
  async requestRaw(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<Response> {
    const { skipRefresh = false, body, headers, ...init } = options;
    const requestUrl = this.url(path);
    const request = async (): Promise<Response> => {
      const nextHeaders = new Headers(headers);
      nextHeaders.set(
        "Accept",
        nextHeaders.get("Accept") ?? "application/json",
      );
      if (
        body !== undefined &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        !nextHeaders.has("Content-Type")
      )
        nextHeaders.set("Content-Type", "application/json");
      const accessToken = this.tokenStore.getAccessToken();
      if (accessToken)
        nextHeaders.set("Authorization", `Bearer ${accessToken}`);
      return this.fetchImpl(requestUrl, {
        ...init,
        headers: nextHeaders,
        body:
          body === undefined
            ? undefined
            : body instanceof FormData || body instanceof Blob
              ? body
              : JSON.stringify(body),
      });
    };
    let response = await request();
    if (
      response.status === 401 &&
      !skipRefresh &&
      !/\/api\/auth\/(?:login|refresh)$/i.test(path)
    ) {
      const tokens = await this.refreshTokens();
      if (tokens) response = await request();
      else this.onSessionExpired?.();
    }
    if (!response.ok) {
      const payload = await this.parseResponse(response);
      throw new ApiError(
        errorMessage(payload, response.status),
        response.status,
        (payload as ApiErrorPayload) ?? null,
        requestUrl,
      );
    }
    return response;
  }

  get<T>(
    path: string,
    query?: ListQuery | Record<string, unknown>,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(`${path}${queryString(query)}`, {
      ...options,
      method: "GET",
    });
  }

  list<T>(
    path: string,
    query?: ListQuery | Record<string, unknown>,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiListResult<T>> {
    return this.get<unknown>(path, query, options).then((payload) =>
      normalizeListResponse<T>(payload, {
        page: typeof query?.page === "number" ? query.page : undefined,
        pageSize:
          typeof query?.pageSize === "number" ? query.pageSize : undefined,
      }),
    );
  }

  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T = void>(
    path: string,
    options?: Omit<ApiRequestOptions, "method">,
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
