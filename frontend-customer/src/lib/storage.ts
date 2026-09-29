import type { CustomerInfo } from '../types';

export const CUSTOMER_TOKEN_KEY = 'customer_access_token';
export const CURRENT_USER_KEY = 'currentUser';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  const token = getStorage()?.getItem(CUSTOMER_TOKEN_KEY)?.trim();
  return token || null;
}

export function setStoredToken(token: string | null | undefined): void {
  const storage = getStorage();
  if (!storage) return;
  if (token?.trim()) storage.setItem(CUSTOMER_TOKEN_KEY, token.trim());
  else storage.removeItem(CUSTOMER_TOKEN_KEY);
}

export function clearStoredSession(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(CUSTOMER_TOKEN_KEY);
  storage.removeItem(CURRENT_USER_KEY);
}

export function getStoredCustomer(): CustomerInfo | null {
  const raw = getStorage()?.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as CustomerInfo) : null;
  } catch {
    return null;
  }
}

export function setStoredCustomer(customer: CustomerInfo | null | undefined): void {
  const storage = getStorage();
  if (!storage) return;
  if (customer) storage.setItem(CURRENT_USER_KEY, JSON.stringify(customer));
  else storage.removeItem(CURRENT_USER_KEY);
}
