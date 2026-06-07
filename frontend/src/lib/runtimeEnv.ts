// Isolates the Vite-only `import.meta.env` access. Vite replaces these values
// at build time. Under Jest this module is mocked (see jest.config.cjs), so the
// test runner never has to parse `import.meta`.
export interface RuntimeEnv {
  VITE_API_URL?: string;
  VITE_WS_URL?: string;
}

export const runtimeEnv: RuntimeEnv = {
  VITE_API_URL: import.meta.env?.VITE_API_URL,
  VITE_WS_URL: import.meta.env?.VITE_WS_URL,
};
