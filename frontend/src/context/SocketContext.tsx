import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { createSocket } from '../lib/socket';
import { useAuth } from '../hooks/useAuth';

export const SocketContext = createContext<Socket | null>(null);

// Owns the lifecycle of the authenticated Socket.IO connection: it (re)connects
// whenever the auth token changes and tears the socket down on logout.
export function SocketProvider({ children }: { children: ReactNode }): JSX.Element {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }
    const instance = createSocket(token);
    setSocket(instance);
    return (): void => {
      instance.disconnect();
    };
  }, [token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
