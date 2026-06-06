import { logger } from './logger';
import { env } from '../config/env';

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//*****:*****@${parsed.host}${parsed.pathname}`;
  } catch {
    return '(unparseable)';
  }
}

export function logBanner(): void {
  const nodeVersion = process.version;
  const maskedDb = maskDatabaseUrl(env.DATABASE_URL);
  const baseUrl = `http://localhost:${env.PORT}`;

  logger.info('╔══════════════════════════════════════════════════════╗');
  logger.info('║       Smart Task Enterprise Service  v1.0.0          ║');
  logger.info('╚══════════════════════════════════════════════════════╝');
  logger.info({ environment: env.NODE_ENV, port: env.PORT, node: nodeVersion }, 'Runtime info');
  logger.info(`🚀  API Base:  ${baseUrl}/api/v1`);
  logger.info(`📚  Swagger:   ${baseUrl}/api-docs`);
  logger.info(`❤️   Health:    ${baseUrl}/health`);
  logger.info(`🔌  WebSocket: ws://localhost:${env.PORT}`);
  logger.info(`📧  Mailpit:   http://localhost:8025`);
  logger.info(`🗄️   Database:  ${maskedDb}`);
}
