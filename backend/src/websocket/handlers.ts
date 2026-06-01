import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export function setupWebSocketHandlers(io: Server): void {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        role: string;
      };
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    // eslint-disable-next-line no-console
    console.log(`🔌 Client connected: ${socket.id} (User: ${socket.userId})`);

    // Join user-specific room for targeted updates
    if (socket.userId) {
      void socket.join(`user:${socket.userId}`);
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

// Helper functions to emit events
export function emitTaskCreated(io: Server, task: unknown): void {
  io.emit('task:created', { task });
}

export function emitTaskUpdated(io: Server, task: unknown): void {
  io.emit('task:updated', { task });
}

export function emitTaskStatusChanged(
  io: Server,
  taskId: string,
  oldStatus: string,
  newStatus: string
): void {
  io.emit('task:statusChanged', { taskId, oldStatus, newStatus });
}

export function emitTaskDeleted(io: Server, taskId: string): void {
  io.emit('task:deleted', { taskId });
}

export function emitToUser(
  io: Server,
  userId: string,
  event: string,
  data: unknown
): void {
  io.to(`user:${userId}`).emit(event, data);
}
