import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/hooks/useAuth';
import * as authApi from '../src/api/auth';
import { TOKEN_STORAGE_KEY } from '../src/lib/config';
import { normalUser } from './fixtures';

jest.mock('../src/api/auth');
const mockedLogin = authApi.login as jest.MockedFunction<typeof authApi.login>;
const mockedGetMe = authApi.getMe as jest.MockedFunction<typeof authApi.getMe>;

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('logs in, persists the token and exposes the user', async () => {
    mockedLogin.mockResolvedValue({ token: 'jwt-123', user: normalUser });
    mockedGetMe.mockResolvedValue(normalUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('john.doe@example.com', 'password123');
    });

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-123');
    await waitFor(() => expect(result.current.user?.email).toBe(normalUser.email));
  });

  it('logs out and clears the stored token', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'existing');
    mockedGetMe.mockResolvedValue(normalUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.id).toBe(normalUser.id));

    act(() => result.current.logout());
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('clears auth when the token is invalid', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'bad');
    mockedGetMe.mockRejectedValue(new Error('401'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.token).toBeNull());
  });
});
