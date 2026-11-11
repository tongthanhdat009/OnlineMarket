import type { CustomerApiClient } from "./core/client-core";
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
} from "../types";
import type { ApiMessageResponse, CustomerInfo } from "../types";
import { customerFromPayload } from "./core/http-utils";

export function createAuthNamespace(client: CustomerApiClient) {
  return {
    register: async (request: RegisterRequest): Promise<RegisterResponse> => {
      const payload = await client.request<Record<string, unknown>>(
        "/customer/auth/register",
        { method: "POST", body: request, auth: false },
      );
      return {
        Message: String(payload.Message ?? payload.message ?? ""),
        Customer: customerFromPayload(payload.Customer ?? payload.customer),
      };
    },
    login: async (request: LoginRequest): Promise<LoginResponse> => {
      const payload = await client.request<Record<string, unknown>>(
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
        await client.request<Record<string, unknown>>("/customer/auth/me");
      return (
        customerFromPayload(response) ?? { CustomerId: 0, Name: "", Email: "" }
      );
    },
    updateProfile: (request: UpdateProfileRequest) =>
      client.request<ApiMessageResponse>("/customer/auth/profile", {
        method: "PUT",
        body: request,
      }),
    changePassword: (request: ChangePasswordRequest) =>
      client.request<ApiMessageResponse>("/customer/auth/change-password", {
        method: "POST",
        body: request,
      }),
  };
}

export type AuthNamespace = ReturnType<typeof createAuthNamespace>;
