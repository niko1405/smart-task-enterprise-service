import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import {
  getStoredToken,
  setUnauthorizedHandler,
} from '../lib/apiClient';
import { TOKEN_STORAGE_KEY } from '../lib/config';
import type { User } from '../types';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

function persistToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback((): void => {
    persistToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const applyAuth = useCallback((newToken: string, newUser: User): void => {
    persistToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const payload = await authApi.login({ email, password });
      applyAuth(payload.token, payload.user);
    },
    [applyAuth]
  );

  const register = useCallback(
    async (input: authApi.RegisterInput): Promise<void> => {
      const payload = await authApi.register(input);
      applyAuth(payload.token, payload.user);
    },
    [applyAuth]
  );

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return (): void => {
      active = false;
    };
  }, [token, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
