import { API_BASE_URL } from './api-config';
import { createHttpClient, type TokenPair } from './http-client';

const STORAGE_KEY = 'agendly.staff.tokens';

export function getStaffTokens(): TokenPair | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenPair;
  } catch {
    return null;
  }
}

export function setStaffTokens(tokens: TokenPair): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStaffTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const staffApi = createHttpClient({
  baseUrl: API_BASE_URL,
  getTokens: getStaffTokens,
  setTokens: setStaffTokens,
  clearTokens: clearStaffTokens,
  refreshPath: '/auth/refresh',
});
