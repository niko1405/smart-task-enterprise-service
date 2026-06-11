import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    res.status(statusCode).json({
      success: false,
      error: message,
      details,
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as ApiError & { code?: string };
    if (prismaErr.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (prismaErr.code === 'P2003') {
      statusCode = 409;
      message = 'Referenced resource does not exist';
    } else {
      statusCode = 400;
      message = 'Database operation failed';
    }
  }

  // Always log server errors; log client errors as warnings
  if (statusCode >= 500) {
    logger.error({ err }, 'Server error');
  } else {
    logger.warn({ err }, 'Client error');
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const createError = (message: string, statusCode: number): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
