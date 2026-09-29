export interface RegisterRequest {
  Name: string;
  Email: string;
  Password: string;
  Phone?: string | null;
  Address?: string | null;
}

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface UpdateProfileRequest {
  Name?: string | null;
  Phone?: string | null;
  Address?: string | null;
}

export interface ChangePasswordRequest {
  OldPassword: string;
  NewPassword: string;
}

export interface CustomerInfo {
  CustomerId: number;
  Name: string;
  Email: string;
  Phone?: string | null;
  Address?: string | null;
  CreatedAt?: string | null;
}

export interface RegisterResponse {
  Message: string;
  Customer?: CustomerInfo | null;
}

export interface LoginResponse {
  Message: string;
  Token: string;
  Customer?: CustomerInfo | null;
}

export interface ApiMessageResponse {
  Message?: string;
  message?: string;
}
