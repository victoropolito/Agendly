import { API_BASE_URL } from './api-config';
import { createHttpClient, type TokenPair } from './http-client';

function storageKey(slug: string): string {
  return `agendly.customer.tokens.${slug}`;
}

export function getCustomerTokens(slug: string): TokenPair | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenPair;
  } catch {
    return null;
  }
}

export function setCustomerTokens(slug: string, tokens: TokenPair): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(slug), JSON.stringify(tokens));
}

export function clearCustomerTokens(slug: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey(slug));
}

export function createCustomerApi(slug: string) {
  return createHttpClient({
    baseUrl: API_BASE_URL,
    getTokens: () => getCustomerTokens(slug),
    setTokens: (tokens) => setCustomerTokens(slug, tokens),
    clearTokens: () => clearCustomerTokens(slug),
    refreshPath: `/public/barbershops/${slug}/auth/refresh`,
  });
}
