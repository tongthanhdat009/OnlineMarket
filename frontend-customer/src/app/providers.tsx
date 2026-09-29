import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import { errorMessage, normalizeError } from '../lib';
import { clearStoredSession, getStoredCustomer, getStoredToken, setStoredCustomer, setStoredToken } from '../lib/storage';
import type { AddCartItemRequest, CartItemDto, CustomerInfo, LoginRequest, RegisterRequest, UpdateCartItemRequest } from '../types';

type ToastKind = 'success' | 'error' | 'info';
type ToastEntry = { id: number; message: string; kind: ToastKind };

type ToastContextValue = { toasts: ToastEntry[]; showToast: (message: string, kind?: ToastKind) => void; dismissToast: (id: number) => void };
const ToastContext = createContext<ToastContextValue | null>(null);
let toastSequence = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++toastSequence;
    setToasts(current => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts(current => current.filter(toast => toast.id !== id)), []);
  return <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>{children}</ToastContext.Provider>;
}

export function useToast() { const value = useContext(ToastContext); if (!value) throw new Error('useToast must be used inside ToastProvider'); return value; }

type AuthContextValue = { customer: CustomerInfo | null; isLoading: boolean; isAuthenticated: boolean; login: (request: LoginRequest) => Promise<CustomerInfo>; register: (request: RegisterRequest) => Promise<void>; logout: () => void; refresh: () => Promise<CustomerInfo | null> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerInfo | null>(() => getStoredCustomer());
  const [isLoading, setLoading] = useState(Boolean(getStoredToken()));

  const refresh = useCallback(async () => {
    if (!getStoredToken()) { setCustomer(null); setLoading(false); return null; }
    try {
      const next = await apiClient.auth.me();
      setCustomer(next); setStoredCustomer(next); return next;
    } catch (error) {
      setStoredToken(null); setStoredCustomer(null); setCustomer(null); return null;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  const login = useCallback(async (request: LoginRequest) => {
    const response = await apiClient.auth.login(request);
    if (!response.Token) throw new Error('Đăng nhập không trả về token.');
    setStoredToken(response.Token);
    try {
      const next = await apiClient.auth.me();
      setStoredCustomer(next); setCustomer(next); return next;
    } catch (error) {
      clearStoredSession();
      throw error;
    }
  }, []);
  const register = useCallback(async (request: RegisterRequest) => { await apiClient.auth.register(request); }, []);
  const logout = useCallback(() => { clearStoredSession(); setCustomer(null); }, []);
  const value = useMemo(() => ({ customer, isLoading, isAuthenticated: Boolean(customer && getStoredToken()), login, register, logout, refresh }), [customer, isLoading, login, register, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }

type CartContextValue = { items: CartItemDto[]; isLoading: boolean; total: number; quantities: Map<number, number>; refresh: () => Promise<void>; add: (request: AddCartItemRequest) => Promise<void>; update: (productId: number, request: UpdateCartItemRequest) => Promise<void>; remove: (productId: number) => Promise<void>; clear: () => Promise<void> };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CartItemDto[]>([]);
  const [isLoading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setItems([]); return; }
    setLoading(true); try { setItems(await apiClient.cart.items()); } catch (error) { setItems([]); if (normalizeError(error).status === 401) logout(); } finally { setLoading(false); }
  }, [isAuthenticated, logout]);
  useEffect(() => { void refresh(); }, [refresh]);
  const invalidate = useCallback(async () => { await refresh(); await queryClient.invalidateQueries({ queryKey: ['cart'] }); }, [queryClient, refresh]);
  const add = useCallback(async (request: AddCartItemRequest) => { try { await apiClient.cart.add(request); await invalidate(); showToast('Đã thêm sản phẩm vào giỏ hàng'); } catch (error) { showToast(errorMessage(error, 'Không thể thêm sản phẩm vào giỏ hàng.'), 'error'); throw error; } }, [invalidate, showToast]);
  const update = useCallback(async (productId: number, request: UpdateCartItemRequest) => { try { if (request.Quantity <= 0) await apiClient.cart.remove(productId); else await apiClient.cart.update(productId, request); await invalidate(); showToast('Giỏ hàng đã cập nhật'); } catch (error) { showToast(errorMessage(error, 'Không thể cập nhật số lượng.'), 'error'); throw error; } }, [invalidate, showToast]);
  const remove = useCallback(async (productId: number) => { try { await apiClient.cart.remove(productId); await invalidate(); showToast('Đã xóa sản phẩm khỏi giỏ hàng'); } catch (error) { showToast(errorMessage(error, 'Không thể xóa sản phẩm.'), 'error'); throw error; } }, [invalidate, showToast]);
  const clear = useCallback(async () => { try { await apiClient.cart.clear(); await invalidate(); } catch (error) { showToast(errorMessage(error, 'Không thể xóa giỏ hàng.'), 'error'); throw error; } }, [invalidate, showToast]);
  const quantities = useMemo(() => new Map(items.map(item => [item.ProductId, item.Quantity])), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + (item.Subtotal || item.Price * item.Quantity), 0), [items]);
  return <CartContext.Provider value={{ items, isLoading, total, quantities, refresh, add, update, remove, clear }}>{children}</CartContext.Provider>;
}

export function useCart() { const value = useContext(CartContext); if (!value) throw new Error('useCart must be used inside CartProvider'); return value; }
