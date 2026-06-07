import { runtimeEnv } from './runtimeEnv';

// Centralised runtime configuration. Values come from Vite env vars at build
// time (see runtimeEnv) and fall back to local-dev defaults.
export const API_BASE_URL: string =
  runtimeEnv.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const WS_URL: string = runtimeEnv.VITE_WS_URL ?? 'ws://localhost:3000';

export const TOKEN_STORAGE_KEY = 'smarttask.token';
