export interface Order {
  OrderId: number;
  CustomerId?: number | null;
  UserId?: number | null;
  PromoId?: number | null;
  OrderDate?: string | null;
  PayStatus?: string | null;
  OrderStatus?: string | null;
  TotalAmount?: number | null;
  DiscountAmount?: number | null;
  OrderType?: string | null;
  PaymentMethod?: string | null;
  Name?: string | null;
  Address?: string | null;
  Phone?: string | null;
  Email?: string | null;
  Customer?: Customer | null;
  OrderItems?: OrderItem[];
  Payments?: Payment[];
  Promo?: Promotion | null;
  [key: string]: unknown;
}

export interface OrderItem {
  OrderItemId?: number;
  OrderId?: number;
  ProductId?: number;
  Quantity?: number;
  UnitPrice?: number;
  Product?: Product;
  [key: string]: unknown;
}

export interface Payment { [key: string]: unknown; }

export interface Product {
  ProductId: number;
  ProductName: string;
  Price: number;
  Barcode?: string | null;
  Unit?: string | null;
  ImageUrl?: string | null;
  CreatedAt?: string | null;
  Category?: Category | null;
  Supplier?: Supplier | null;
  CategoryId?: number | null;
  SupplierId?: number | null;
  Quantity?: number | null;
  Deleted?: boolean;
  [key: string]: unknown;
}

export interface Category { CategoryId?: number; CategoryName?: string; [key: string]: unknown; }
export interface Supplier { SupplierId?: number; SupplierName?: string; [key: string]: unknown; }

export interface Inventory {
  InventoryId: number;
  ProductId: number;
  Quantity?: number | null;
  UpdatedAt?: string | null;
  Product?: Product | null;
  [key: string]: unknown;
}

export interface Customer {
  CustomerId: number;
  Name: string;
  Phone?: string | null;
  Email?: string | null;
  Address?: string | null;
  CreatedAt?: string | null;
  Orders?: Order[];
  [key: string]: unknown;
}

export interface Promotion {
  PromoId: number;
  PromoCode: string;
  Description?: string | null;
  DiscountType: string;
  DiscountValue: number;
  StartDate: string;
  EndDate: string;
  MinOrderAmount?: number | null;
  UsageLimit?: number | null;
  UsedCount?: number | null;
  Status?: string | null;
  [key: string]: unknown;
}

export interface Bill {
  BillId: number;
  OrderId: number;
  CustomerId?: number | null;
  TotalAmount: number;
  DiscountAmount?: number | null;
  FinalAmount: number;
  PaymentMethod?: string | null;
  /** Raw entity contract: payment and fulfilment are tracked as two separate statuses. */
  PayStatus: string;
  BillStatus: string;
  CreatedAt?: string | null;
  PaidAt?: string | null;
  Name?: string | null;
  Customer?: { Name?: string | null; [key: string]: unknown } | null;
  [key: string]: unknown;
}

export interface RefundRequest {
  RefundId: number;
  OrderId: number;
  RefundAmount: number;
  Reason?: string | null;
  CustomerBankName?: string | null;
  CustomerBankAccount?: string | null;
  CustomerAccountHolder?: string | null;
  Status?: string | null;
  AdminNote?: string | null;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
  Order?: { Customer?: { Name?: string | null; [key: string]: unknown } | null; [key: string]: unknown } | null;
  CustomerName?: string | null;
  [key: string]: unknown;
}

export interface User {
  UserId: number;
  Username: string;
  FullName?: string | null;
  Role?: number | null;
  CreatedAt?: string | null;
  RoleNavigation?: Role | null;
  /** Never populated by adapters; backend currently exposes a hash accidentally. */
  Password?: never;
  [key: string]: unknown;
}

export interface Role { RoleId: number; RoleName: string; Description?: string | null; Permissions?: Permission[]; [key: string]: unknown; }
export interface Permission { PermissionId: number; PermissionName: string; ActionKey: string; Description?: string | null; [key: string]: unknown; }
export interface RolePermission { RoleId: number; PermissionId: number; RoleName?: string; PermissionName?: string; ActionKey?: string; [key: string]: unknown; }

export interface DashboardStats { [key: string]: unknown; }
export interface PeakTime { [key: string]: unknown; }
export interface Agent { AgentId: number; Name: string; Description?: string | null; SystemInstructions: string; Enabled: boolean; Model: string; Temperature: number; MaxToolRounds: number; Tools: string[]; [key: string]: unknown; }
export interface AgentRun { AgentRunId: number; AgentId: number; AgentName: string; Status: string; Trigger: string; [key: string]: unknown; }
export interface AgentActivity { AgentEventId?: number; AgentRunId: number; Type: string; Level: string; Message: string; [key: string]: unknown; }
export interface AgentReport { AgentReportId: number; AgentRunId: number; ReportType: string; Title: string; [key: string]: unknown; }
export interface AgentAnalytics { [key: string]: unknown; }

export function withoutPassword<T extends Record<string, unknown>>(value: T): Omit<T, "Password" | "password"> {
  const { Password: _password, password: _lowerPassword, ...safe } = value;
  return safe as Omit<T, "Password" | "password">;
}
