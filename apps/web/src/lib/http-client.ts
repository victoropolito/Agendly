import { ApiError } from './api-error';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RequestOptions {
  skipAuth?: boolean;
  /** internal: marks this call as a retry after a token refresh, to avoid infinite loops */
  isRetry?: boolean;
}

interface HttpClientConfig {
  baseUrl: string;
  getTokens: () => TokenPair | null;
  setTokens: (tokens: TokenPair) => void;
  clearTokens: () => void;
  refreshPath: string;
}

interface ErrorBody {
  message?: string | string[];
  code?: string;
}

export function createHttpClient(config: HttpClientConfig) {
  let refreshPromise: Promise<TokenPair | null> | null = null;

  async function refreshTokens(): Promise<TokenPair | null> {
    const tokens = config.getTokens();
    if (!tokens?.refreshToken) return null;

    try {
      const response = await fetch(`${config.baseUrl}${config.refreshPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!response.ok) return null;
      const newTokens = (await response.json()) as TokenPair;
      config.setTokens(newTokens);
      return newTokens;
    } catch {
      return null;
    }
  }

  async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
    const tokens = config.getTokens();
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (!options.skipAuth && tokens?.accessToken) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }

    const response = await fetch(`${config.baseUrl}${path}`, { ...init, headers });

    if (response.status === 401 && !options.skipAuth && !options.isRetry) {
      if (!refreshPromise) {
        refreshPromise = refreshTokens().finally(() => {
          refreshPromise = null;
        });
      }
      const refreshed = await refreshPromise;
      if (refreshed) {
        return request<T>(path, init, { ...options, isRetry: true });
      }
      config.clearTokens();
      throw new ApiError(401, 'UNAUTHENTICATED', 'Sessão expirada. Faça login novamente.');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const errorBody = body as ErrorBody | null;
      const message = Array.isArray(errorBody?.message)
        ? errorBody.message.join(' ')
        : (errorBody?.message ?? 'Ocorreu um erro inesperado.');
      throw new ApiError(response.status, errorBody?.code, message);
    }

    return body as T;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>(path, { method: 'GET' }, options),
    post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }, options),
    patch: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }, options),
    put: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      request<T>(path, { method: 'PUT', body: JSON.stringify(data) }, options),
    delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { method: 'DELETE' }, options),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
