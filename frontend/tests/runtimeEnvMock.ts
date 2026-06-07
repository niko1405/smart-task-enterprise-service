// Jest stand-in for the Vite-only runtimeEnv module; falls through to the
// localhost defaults in config.ts.
export const runtimeEnv: { VITE_API_URL?: string; VITE_WS_URL?: string } = {};
