import { Server } from 'socket.io';

let _io: Server | null = null;

export function setIO(instance: Server): void {
  _io = instance;
}

export function getIO(): Server {
  if (!_io) {
    throw new Error('Socket.IO server has not been initialized yet.');
  }
  return _io;
}
