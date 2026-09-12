import axios from 'axios';

import { config } from '@/services/config';

function camelCaseKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function toCamelCase(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [camelCaseKey(k), toCamelCase(v)]),
    );
  }
  return obj;
}

/** Typed HTTP client for the FastAPI backend. */
export const apiClient = axios.create({
  baseURL: config.apiBase,
  // Multi-leg ORS routes can take 5-30s server-side; a shorter timeout
  // false-flagged healthy routing as "offline".
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object') {
      res.data = toCamelCase(res.data);
    }
    return res;
  },
  (error) => {
    const message =
      error?.response?.data?.detail ??
      error?.message ??
      'Unexpected network error';
    return Promise.reject(new Error(message));
  },
);

/** GET helper with typed response. */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.get<T>(url, { params });
  return data;
}

/** POST helper with typed request/response. */
export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post<T>(url, body);
  return data;
}