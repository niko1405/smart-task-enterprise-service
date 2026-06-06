import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { seedDatabase } from './utils/seeder';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './config/swagger';
import { setupWebSocketHandlers } from './websocket/handlers';
import { logger } from './utils/logger';
import { logBanner } from './utils/banner';

// Routes
import { authRouter } from './routes/auth.routes';
import { taskRouter } from './routes/task.routes';

const app: Application = express();
const httpServer = createServer(app);

// Setup Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// Security middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Swagger API Docs
setupSwagger(app);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tasks', taskRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

// WebSocket setup
setupWebSocketHandlers(io);

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Seed database if TEST_MODE is enabled
    if (env.TEST_MODE) {
      logger.info('🧪 TEST_MODE enabled - seeding database...');
      await seedDatabase();
    }

    // Start HTTP server
    httpServer.listen(env.PORT, () => {
      logBanner();
    });
  } catch (error) {
    logger.error({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  void disconnectDatabase().then(() => {
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  void disconnectDatabase().then(() => {
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
});

// Export for testing
export { app, httpServer };

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  void startServer();
}

