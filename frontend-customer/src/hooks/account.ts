import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

export function useOrders(status?: string) { return useQuery({ queryKey: ['orders', status], queryFn: () => apiClient.orders.paged({ page: 1, pageSize: 20, status }), staleTime: 20_000 }); }
export function useOrder(orderId: number | undefined) { return useQuery({ queryKey: ['order', orderId], queryFn: async () => { const [order, items] = await Promise.all([apiClient.orders.get(orderId!), apiClient.orders.items(orderId!)]); return { ...order, OrderItems: items }; }, enabled: Number.isInteger(orderId) && orderId! > 0 }); }
export function useBills() { return useQuery({ queryKey: ['bills'], queryFn: () => apiClient.bills.list(), staleTime: 30_000 }); }
export function useRefunds() { return useQuery({ queryKey: ['refunds'], queryFn: () => apiClient.refunds.list(), staleTime: 30_000 }); }
