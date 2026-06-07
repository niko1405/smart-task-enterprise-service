import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL, TOKEN_STORAGE_KEY } from './config';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

// Normalised error surfaced to the UI layer.
export class ApiError extends Error {
  status: number;
  details?: ApiErrorDetail[];

  constructor(message: string, status: number, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let onUnauthorized: (() => void) | null = null;

// Allows the auth layer to react to 401s (e.g. force logout) without a circular
// import between the axios client and the auth context.
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function statusMessage(status: number, fallback: string): string {
  const map: Record<number, string> = {
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with the current state of the data.',
    412: 'This item was modified by someone else. Please review and retry.',
    429: 'Too many requests. Please slow down and try again shortly.',
  };
  return map[status] ?? fallback;
}

function extractMessage(error: AxiosError): {
  message: string;
  details?: ApiErrorDetail[];
} {
  const data = error.response?.data as
    | { error?: string; message?: string; details?: ApiErrorDetail[] }
    | string
    | undefined;
  if (typeof data === 'string' && data.length > 0) {
    return { message: data };
  }
  if (data && typeof data === 'object') {
    return {
      message: data.error ?? data.message ?? error.message,
      details: data.details,
    };
  }
  return { message: error.message };
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const { message, details } = extractMessage(error);

    if (status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    const friendly = status
      ? statusMessage(status, message)
      : 'Network error. Please check your connection and try again.';

    return Promise.reject(new ApiError(friendly, status, details));
  }
);
