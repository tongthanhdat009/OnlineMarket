import { apiClient, BrowserTokenStore, type TokenStore } from "../lib/api-client";
import type { ApiTokenPair } from "../types/api";

export interface AuthUser {
  UserId: number | string;
  Username: string;
  FullName?: string | null;
  Role?: number | string | null;
  Permissions: string[];
  [key: string]: unknown;
}

export interface LoginResponse extends AuthUser {
  AccessToken: string;
  RefreshToken: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export function toTokenPair(payload: { AccessToken?: string; accessToken?: string; RefreshToken?: string; refreshToken?: string }): ApiTokenPair {
  const accessToken = payload.AccessToken ?? payload.accessToken ?? "";
  const refreshToken = payload.RefreshToken ?? payload.refreshToken ?? "";
  if (!accessToken || !refreshToken) throw new Error("Login response missing access or refresh token");
  return { accessToken, refreshToken };
}

export function stripPassword<T extends Record<string, unknown>>(user: T): Omit<T, "Password" | "password"> {
  const { Password: _password, password: _lowerPassword, ...safe } = user;
  return safe as Omit<T, "Password" | "password">;
}

/** Normalize auth/me values without changing backend's PascalCase contract. */
export function normalizeAuthUser(value: unknown): AuthUser {
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const permissions = source.Permissions ?? source.permissions;
  const normalized = {
    ...source,
    UserId: source.UserId ?? source.userId ?? "",
    Username: String(source.Username ?? source.username ?? ""),
    FullName: source.FullName ?? source.fullName ?? null,
    Role: source.Role ?? source.role ?? null,
    Permissions: Array.isArray(permissions) ? permissions.filter((x): x is string => typeof x === "string") : [],
  };
  return stripPassword(normalized) as AuthUser;
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const response = await apiClient.post<LoginResponse>("api/auth/login", { Username: username, Password: password });
  const tokens = toTokenPair(response);
  apiClient.tokenStore.setTokens(tokens);
  const user = normalizeAuthUser(response);
  return { user, ...tokens };
}

export async function getCurrentUser(): Promise<AuthUser> {
  return normalizeAuthUser(await apiClient.get("api/auth/me"));
}

export function logout(store: TokenStore = apiClient.tokenStore): void {
  store.clear();
}

export function getTokenStore(): TokenStore {
  return apiClient.tokenStore;
}

export { BrowserTokenStore };
