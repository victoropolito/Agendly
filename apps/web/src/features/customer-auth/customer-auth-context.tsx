'use client';

import * as React from 'react';

import { ApiError } from '@/lib/api-error';
import { clearCustomerTokens, createCustomerApi, getCustomerTokens, setCustomerTokens } from '@/lib/customer-api';
import type { AuthTokens, CustomerProfile } from '@/lib/types';
import type { HttpClient } from '@/lib/http-client';

interface RegisterInput {
  name: string;
  phone?: string;
  email?: string;
  password: string;
}

interface LoginInput {
  identifier: string;
  password: string;
}

interface CustomerAuthContextValue {
  slug: string;
  api: HttpClient;
  customer: CustomerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<CustomerProfile>;
  register: (input: RegisterInput) => Promise<CustomerProfile>;
  logout: () => Promise<void>;
}

const CustomerAuthContext = React.createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const api = React.useMemo(() => createCustomerApi(slug), [slug]);
  const [customer, setCustomer] = React.useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadCustomer = React.useCallback(async (): Promise<CustomerProfile | null> => {
    const tokens = getCustomerTokens(slug);
    if (!tokens) {
      setCustomer(null);
      setIsLoading(false);
      return null;
    }
    try {
      const profile = await api.get<CustomerProfile>(`/public/barbershops/${slug}/me`);
      setCustomer(profile);
      return profile;
    } catch {
      clearCustomerTokens(slug);
      setCustomer(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [api, slug]);

  React.useEffect(() => {
    // Restores the session from stored tokens on mount — a genuine fetch-on-mount sync
    // with the auth API, not state derived from props/other state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCustomer();
  }, [loadCustomer]);

  const login = React.useCallback(
    async (input: LoginInput) => {
      const tokens = await api.post<AuthTokens>(`/public/barbershops/${slug}/auth/login`, input, { skipAuth: true });
      setCustomerTokens(slug, tokens);
      const profile = await loadCustomer();
      if (!profile) throw new Error('Não foi possível carregar seus dados.');
      return profile;
    },
    [api, slug, loadCustomer],
  );

  const register = React.useCallback(
    async (input: RegisterInput) => {
      const tokens = await api.post<AuthTokens>(`/public/barbershops/${slug}/auth/register`, input, { skipAuth: true });
      setCustomerTokens(slug, tokens);
      const profile = await loadCustomer();
      if (!profile) throw new Error('Não foi possível carregar seus dados.');
      return profile;
    },
    [api, slug, loadCustomer],
  );

  const logout = React.useCallback(async () => {
    const tokens = getCustomerTokens(slug);
    clearCustomerTokens(slug);
    setCustomer(null);
    if (tokens?.refreshToken) {
      try {
        await api.post(`/public/barbershops/${slug}/auth/logout`, { refreshToken: tokens.refreshToken }, { skipAuth: true });
      } catch {
        // best-effort
      }
    }
  }, [api, slug]);

  const value = React.useMemo<CustomerAuthContextValue>(
    () => ({ slug, api, customer, isLoading, isAuthenticated: !!customer, login, register, logout }),
    [slug, api, customer, isLoading, login, register, logout],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = React.useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth deve ser usado dentro de <CustomerAuthProvider>');
  }
  return context;
}

export function getCustomerAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
