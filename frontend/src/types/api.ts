/** Types shared by the API adapter layer. Backend JSON keeps CLR (PascalCase) names. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface ApiListResponse<T> {
  Items: T[];
  TotalCount: number;
  Page: number;
  PageSize: number;
}

export interface ApiListResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  /** Original payload, useful when an endpoint returns extra metadata. */
  raw: unknown;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  searchField?: string;
  [key: string]: string | number | boolean | Date | undefined | null;
}

export interface ApiErrorPayload {
  message?: string;
  Message?: string;
  title?: string;
  Title?: string;
  detail?: string;
  Detail?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

export interface ApiTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  /** JSON-serializable request body, or FormData/Blob for uploads. */
  body?: unknown;
  /** Prevent automatic refresh for auth/refresh requests. */
  skipRefresh?: boolean;
}
