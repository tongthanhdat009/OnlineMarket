import type { AuthUser } from "./session";

export type Permission = string;

function normalize(permission: string): string {
  return permission.trim().toLowerCase();
}

export function permissionSet(user?: Pick<AuthUser, "Permissions"> | null): Set<string> {
  return new Set((user?.Permissions ?? []).map(normalize));
}

export function can(user: Pick<AuthUser, "Permissions"> | null | undefined, permission: Permission): boolean {
  const permissions = permissionSet(user);
  const required = normalize(permission);
  return permissions.has("*") || permissions.has(required);
}

export function canAny(user: Pick<AuthUser, "Permissions"> | null | undefined, permissions: Permission[]): boolean {
  return permissions.some(permission => can(user, permission));
}

export function canAll(user: Pick<AuthUser, "Permissions"> | null | undefined, permissions: Permission[]): boolean {
  return permissions.every(permission => can(user, permission));
}

/** Route/action hints. Backend authorization remains source of truth. */
export const permissions = {
  dashboardView: "dashboard_view",
  orderView: "order_view",
  orderManage: "order_manage",
  productView: "product_view",
  productManage: "product_manage",
  inventoryView: "inventory_view",
  inventoryManage: "inventory_manage",
  customerView: "customer_view",
  customerManage: "customer_manage",
  promotionView: "promotion_view",
  promotionManage: "promotion_manage",
  billView: "bill_view",
  refundView: "refund_view",
  refundManage: "refund_manage",
  agentView: "agent_view",
  agentManage: "agent_manage",
  agentToolManage: "agent_tool_manage",
  agentRunView: "agent_run_view",
  agentLogsView: "agent_logs_view",
  agentAnalyticsView: "agent_analytics_view",
  agentReportView: "agent_report_view",
  agentReportGenerate: "agent_report_generate",
  staffView: "staff_view",
  staffManage: "staff_manage",
  roleManage: "role_manage",
  permissionManage: "permission_manage",
} as const;
