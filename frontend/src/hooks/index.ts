import { useQuery } from '@tanstack/react-query';
import {
  agentsApi,
  billsApi,
  customersApi,
  dashboardApi,
  inventoryApi,
  ordersApi,
  permissionsApi,
  productsApi,
  promotionsApi,
  refundsApi,
  reportsApi,
  rolesApi,
  usersApi,
} from '../api';
import type { ListQuery } from '../types/api';
import type { AgentRunQuery, AgentActivityQuery, ReportQuery } from '../api';

export function useDashboardStats() {
  return useQuery({ queryKey: ['dashboard', 'stats'], queryFn: dashboardApi.stats });
}

export function useDashboardPeakTime() {
  return useQuery({ queryKey: ['dashboard', 'peak-time'], queryFn: dashboardApi.peakTime });
}

export function useOrders(query?: ListQuery) {
  return useQuery({ queryKey: ['orders', query], queryFn: () => ordersApi.online(query) });
}

export function useOrder(id: number | string | undefined) {
  return useQuery({ queryKey: ['orders', id], queryFn: () => ordersApi.byId(Number(id!)), enabled: id !== undefined });
}

export function useProducts(query?: ListQuery) {
  return useQuery({ queryKey: ['products', query], queryFn: () => productsApi.list(query) });
}

export function useInventory(query?: ListQuery) {
  return useQuery({ queryKey: ['inventory', query], queryFn: () => inventoryApi.list(query) });
}

export function useCustomers(query?: ListQuery) {
  return useQuery({ queryKey: ['customers', query], queryFn: () => customersApi.list(query) });
}

export function usePromotions(query?: ListQuery) {
  return useQuery({ queryKey: ['promotions', query], queryFn: () => promotionsApi.list(query) });
}

export function useBills(query?: ListQuery) {
  return useQuery({ queryKey: ['bills', query], queryFn: () => billsApi.list(query) });
}

export function useRefunds(query?: ListQuery) {
  return useQuery({ queryKey: ['refunds', query], queryFn: () => refundsApi.list(query) });
}

export function useAgents(query?: ListQuery) {
  return useQuery({ queryKey: ['agents', query], queryFn: () => agentsApi.list(query) });
}

export function useAgentRuns(query?: AgentRunQuery) {
  return useQuery({ queryKey: ['agent-runs', query], queryFn: () => agentsApi.runs(query) });
}

export function useAgentActivity(query?: AgentActivityQuery) {
  return useQuery({ queryKey: ['agent-activity', query], queryFn: () => agentsApi.activity(query) });
}

export function useAgentAnalytics(from?: string, to?: string) {
  return useQuery({ queryKey: ['agent-analytics', from, to], queryFn: () => agentsApi.analytics(from, to) });
}

export function useReports(query?: ReportQuery) {
  return useQuery({ queryKey: ['reports', query], queryFn: () => reportsApi.list(query) });
}

export function useUsers(query?: ListQuery) {
  return useQuery({ queryKey: ['users', query], queryFn: () => usersApi.list(query) });
}

export function useRoles(query?: ListQuery) {
  return useQuery({ queryKey: ['roles', query], queryFn: () => rolesApi.list(query) });
}

export function usePermissions(query?: ListQuery) {
  return useQuery({ queryKey: ['permissions', query], queryFn: () => permissionsApi.list(query) });
}
