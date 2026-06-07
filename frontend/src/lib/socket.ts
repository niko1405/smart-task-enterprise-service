import { io, Socket } from 'socket.io-client';
import { WS_URL } from './config';

// Creates a Socket.IO client authenticated with the user's JWT. The connection
// is established lazily by the SocketProvider once a token is available.
export function createSocket(token: string): Socket {
  return io(WS_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket'],
  });
}
