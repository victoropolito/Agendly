import { API_BASE_URL } from './api-config';
import { createHttpClient, type TokenPair } from './http-client';

const STORAGE_KEY = 'agendly.customer.tokens';

export function getCustomerTokens(): TokenPair | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenPair;
  } catch {
    return null;
  }
}

export function setCustomerTokens(tokens: TokenPair): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearCustomerTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const customerApi = createHttpClient({
  baseUrl: API_BASE_URL,
  getTokens: getCustomerTokens,
  setTokens: setCustomerTokens,
  clearTokens: clearCustomerTokens,
  refreshPath: '/public/auth/refresh',
});
