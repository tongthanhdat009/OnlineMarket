import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren, type ReactNode } from "react";
import { getCurrentUser, getTokenStore, login as loginRequest, logout as clearSession, type AuthSession, type AuthUser } from "./session";
import { can, canAll, canAny } from "./permissions";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login(username: string, password: string): Promise<AuthSession>;
  refreshUser(): Promise<AuthUser>;
  logout(): void;
  can(permission: string): boolean;
  canAny(permissions: string[]): boolean;
  canAll(permissions: string[]): boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, initialUser = null }: PropsWithChildren<{ initialUser?: AuthUser | null }>): ReactNode {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  // Start loading when a token exists so the route guard never sees "unauthenticated"
  // during the /auth/me rehydration round-trip (child effects fire before parent's).
  const [loading, setLoading] = useState(() => !initialUser && Boolean(getTokenStore().getAccessToken()));

  useEffect(() => {
    if (initialUser || !getTokenStore().getAccessToken()) return;
    let active = true;
    setLoading(true);
    getCurrentUser()
      .then((nextUser) => { if (active) setUser(nextUser); })
      .catch(() => { clearSession(); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialUser]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const session = await loginRequest(username, password);
      setUser(session.user);
      return session;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const nextUser = await getCurrentUser();
      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    refreshUser,
    logout,
    can: permission => can(user, permission),
    canAny: required => canAny(user, required),
    canAll: required => canAll(user, required),
  }), [user, loading, login, refreshUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
