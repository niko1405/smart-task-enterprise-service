import { Request, Response, NextFunction } from 'express';
import { authorize } from '../src/middleware/auth';
import { validateBody, validateQuery } from '../src/middleware/validate';
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
  });

  it('should return 400 when body is invalid', () => {
    const req = { body: {} } as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should replace body with parsed data', () => {
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
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('errorHandler middleware', () => {
  it('should return 500 for generic errors', () => {
    const err = new Error('something went wrong') as Parameters<typeof errorHandler>[0];
    const req = {} as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('should return status from ApiError', () => {
    const err = Object.assign(new Error('not found'), { statusCode: 404 }) as Parameters<typeof errorHandler>[0];
    const req = {} as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
