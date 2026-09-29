import { apiClient } from "../lib/api-client";
import { normalizeAuthUser, toTokenPair, type AuthUser } from "../auth/session";
import type { ApiTokenPair } from "../types/api";

export interface LoginRequest { Username: string; Password: string; }
export interface LoginResponse extends AuthUser { AccessToken: string; RefreshToken: string; }

export const authApi = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("api/auth/login", request);
    apiClient.tokenStore.setTokens(toTokenPair(response));
    return { ...response, ...normalizeAuthUser(response) };
  },
  refresh(refreshToken?: string): Promise<{ AccessToken: string; RefreshToken: string }> {
    const token = refreshToken ?? apiClient.tokenStore.getRefreshToken();
    if (!token) return Promise.reject(new Error("No refresh token available"));
    return apiClient.post<{ AccessToken: string; RefreshToken: string }>("api/auth/refresh", { RefreshToken: token }, { skipRefresh: true }).then(response => {
      apiClient.tokenStore.setTokens(toTokenPair(response));
      return response;
    });
  },
  me(): Promise<AuthUser> {
    return apiClient.get("api/auth/me").then(normalizeAuthUser);
  },
  tokenPair(): ApiTokenPair | null {
    const accessToken = apiClient.tokenStore.getAccessToken();
    const refreshToken = apiClient.tokenStore.getRefreshToken();
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },
  logout(): void {
    apiClient.tokenStore.clear();
  },
};
