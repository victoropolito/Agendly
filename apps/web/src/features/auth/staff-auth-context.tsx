'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { ApiError } from '@/lib/api-error';
import { clearStaffTokens, getStaffTokens, setStaffTokens, staffApi } from '@/lib/staff-api';
import type { AuthTokens, Me } from '@/lib/types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterTenantInput {
  adminName: string;
  phone: string;
  email: string;
  password: string;
  tenantName: string;
  tenantSlug: string;
}

interface StaffAuthContextValue {
  user: Me | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<Me>;
  registerTenant: (input: RegisterTenantInput) => Promise<Me>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<Me | null>;
}

const StaffAuthContext = React.createContext<StaffAuthContextValue | null>(null);

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<Me | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const loadUser = React.useCallback(async (): Promise<Me | null> => {
    const tokens = getStaffTokens();
    if (!tokens) {
      setUser(null);
      setIsLoading(false);
      return null;
    }
    try {
      const me = await staffApi.get<Me>('/auth/me');
      setUser(me);
      return me;
    } catch {
      clearStaffTokens();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Restores the session from stored tokens on mount — a genuine fetch-on-mount sync
    // with the auth API, not state derived from props/other state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUser();
  }, [loadUser]);

  const login = React.useCallback(
    async (input: LoginInput) => {
      const tokens = await staffApi.post<AuthTokens>('/auth/login', input, { skipAuth: true });
      setStaffTokens(tokens);
      const me = await loadUser();
      if (!me) throw new Error('Não foi possível carregar os dados da conta.');
      return me;
    },
    [loadUser],
  );

  const registerTenant = React.useCallback(
    async (input: RegisterTenantInput) => {
      const tokens = await staffApi.post<AuthTokens>('/auth/tenant-register', input, { skipAuth: true });
      setStaffTokens(tokens);
      const me = await loadUser();
      if (!me) throw new Error('Não foi possível carregar os dados da conta.');
      return me;
    },
    [loadUser],
  );

  const logout = React.useCallback(async () => {
    const tokens = getStaffTokens();
    clearStaffTokens();
    setUser(null);
    if (tokens?.refreshToken) {
      try {
        await staffApi.post('/auth/logout', { refreshToken: tokens.refreshToken }, { skipAuth: true });
      } catch {
        // best-effort: local session is already cleared regardless of server-side revoke outcome
      }
    }
    router.push('/login');
  }, [router]);

  const value = React.useMemo<StaffAuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: !!user, login, registerTenant, logout, refetchUser: loadUser }),
    [user, isLoading, login, registerTenant, logout, loadUser],
  );

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth(): StaffAuthContextValue {
  const context = React.useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth deve ser usado dentro de <StaffAuthProvider>');
  }
  return context;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
