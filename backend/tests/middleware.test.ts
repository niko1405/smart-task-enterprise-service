import { Request, Response, NextFunction } from 'express';
import { authorize } from '../src/middleware/auth';
import { validate, validateBody, validateQuery, validateParams } from '../src/middleware/validate';
import { errorHandler } from '../src/middleware/errorHandler';
import { z } from 'zod';

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authorize middleware', () => {
  it('should call next() when user has required role', () => {
    const req = { user: { userId: '1', email: 'a@b.com', role: 'ADMIN' } } as unknown as Request;
    const next = jest.fn() as NextFunction;

    authorize('ADMIN')(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 403 when user role does not match', () => {
    const req = { user: { userId: '1', email: 'a@b.com', role: 'USER' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authorize('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not authenticated', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    authorize('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow access when any of multiple roles match', () => {
    const req = { user: { userId: '1', email: 'a@b.com', role: 'USER' } } as unknown as Request;
    const next = jest.fn() as NextFunction;

    authorize('ADMIN', 'USER')(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('validateBody middleware', () => {
  const schema = z.object({ name: z.string().min(1) });

  it('should call next() when body is valid', () => {
    const req = { body: { name: 'test' } } as Request;
    const next = jest.fn() as NextFunction;

    validateBody(schema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(/* no args */);
  });

  it('should call next(error) when body is invalid', () => {
    const req = { body: {} } as Request;
    const next = jest.fn() as NextFunction;

    validateBody(schema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should replace body with parsed (stripped) data', () => {
    const req = { body: { name: 'hello', extra: 'ignored' } } as Request;
    const next = jest.fn() as NextFunction;

    validateBody(schema)(req, mockRes(), next);

    expect(req.body).toEqual({ name: 'hello' });
  });
});

describe('validateQuery middleware', () => {
  const schema = z.object({ page: z.string().default('1') });

  it('should apply defaults for missing query params', () => {
    const req = { query: {} } as Request;
    const next = jest.fn() as NextFunction;

    validateQuery(schema)(req, mockRes(), next);

    expect(req.query).toEqual({ page: '1' });
    expect(next).toHaveBeenCalledWith(/* no args */);
  });

  it('should call next(error) when query is invalid', () => {
    const strictSchema = z.object({ page: z.number() });
    const req = { query: { page: 'not-a-number' } } as unknown as Request;
    const next = jest.fn() as NextFunction;

    validateQuery(strictSchema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('validateParams middleware', () => {
  const schema = z.object({ id: z.string().uuid() });

  it('should call next() when params are valid', () => {
    const req = { params: { id: '123e4567-e89b-12d3-a456-426614174000' } } as unknown as Request;
    const next = jest.fn() as NextFunction;

    validateParams(schema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(/* no args */);
  });

  it('should call next(error) when params are invalid', () => {
    const req = { params: { id: 'not-a-uuid' } } as unknown as Request;
    const next = jest.fn() as NextFunction;

    validateParams(schema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('validate (combined) middleware', () => {
  const schema = z.object({
    body: z.object({ title: z.string() }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
  });

  it('should call next() with valid combined schema', () => {
    const req = { body: { title: 'test' }, query: {}, params: {} } as unknown as Request;
    const next = jest.fn() as NextFunction;

    validate(schema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(/* no args */);
    expect(req.body).toEqual({ title: 'test' });
  });

  it('should call next(error) with invalid combined schema', () => {
    const req = { body: {}, query: {}, params: {} } as unknown as Request;
    const next = jest.fn() as NextFunction;

    validate(schema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should preserve original body/query/params when schema omits them', () => {
    const queryOnlySchema = z.object({
      query: z.object({ page: z.string() }).optional(),
    });
    const req = {
      body: { original: true },
      query: { page: '2' },
      params: { id: 'abc' },
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    validate(queryOnlySchema)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(/* no args */);
    expect(req.body).toEqual({ original: true });
    expect(req.params).toEqual({ id: 'abc' });
  });
});

describe('errorHandler middleware', () => {
  it('should return 500 for generic errors', () => {
    const err = new Error('something went wrong') as Parameters<typeof errorHandler>[0];
    const res = mockRes();

    errorHandler(err, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should return statusCode from ApiError', () => {
    const err = Object.assign(new Error('not found'), { statusCode: 404 }) as Parameters<typeof errorHandler>[0];
    const res = mockRes();

    errorHandler(err, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 400 and details for ZodError', () => {
    const { z } = require('zod');
    const { ZodError } = require('zod');
    let zodErr: InstanceType<typeof ZodError> | undefined;
    try {
      z.object({ name: z.string() }).parse({});
    } catch (e) {
      zodErr = e as InstanceType<typeof ZodError>;
    }
    const res = mockRes();

    errorHandler(zodErr as Parameters<typeof errorHandler>[0], {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ details: expect.any(Array) }));
  });

  it('should return 404 for PrismaClientKnownRequestError P2025', () => {
    const prismaErr = Object.assign(new Error('not found'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2025',
    }) as Parameters<typeof errorHandler>[0];
    const res = mockRes();

    errorHandler(prismaErr, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 400 for other PrismaClientKnownRequestError codes', () => {
    const prismaErr = Object.assign(new Error('db error'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
    }) as Parameters<typeof errorHandler>[0];
    const res = mockRes();

    errorHandler(prismaErr, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('createError helper', () => {
  it('should create an error with statusCode and isOperational', () => {
    const { createError } = require('../src/middleware/errorHandler');
    const err = createError('forbidden', 403);

    expect(err.message).toBe('forbidden');
    expect(err.statusCode).toBe(403);
    expect(err.isOperational).toBe(true);
  });
});
