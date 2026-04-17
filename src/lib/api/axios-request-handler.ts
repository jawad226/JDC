import { isAxiosError, type AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api/axios.config';

function logApiError(method: string, url: string, error: unknown): void {
  if (!isAxiosError(error)) {
    console.error(`[api] ${method} ${url}`, error);
    return;
  }
  const status = error.response?.status;
  const data = error.response?.data;
  const message =
    data && typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message: unknown }).message)
      : error.message;
  console.error(`[api] ${method} ${url} failed`, { status, message, data });
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.get<T>(url, config);
    return res.data;
  } catch (e) {
    logApiError('GET', url, e);
    throw e;
  }
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res = await apiClient.post<T>(url, body, config);
    return res.data;
  } catch (e) {
    logApiError('POST', url, e);
    throw e;
  }
}

export async function apiPut<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res = await apiClient.put<T>(url, body, config);
    return res.data;
  } catch (e) {
    logApiError('PUT', url, e);
    throw e;
  }
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.delete<T>(url, config);
    return res.data;
  } catch (e) {
    logApiError('DELETE', url, e);
    throw e;
  }
}
