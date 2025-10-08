import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production';
  
  // Map error to standard envelope
  const mapError = (code: string, message: string, details?: any, statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      data: null,
      error: {
        code,
        message,
        ...(details ? { details } : {})
      }
    });
  };

  // Prisma errors
  if (err.code === 'P2002') {
    return mapError('VALIDATION_ERROR', 'Unique constraint violation', { field: err.meta?.target }, 400);
  }

  if (err.code === 'P2025') {
    return mapError('NOT_FOUND', 'Record not found', undefined, 404);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return mapError('INVALID_TOKEN', 'Invalid token provided', undefined, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return mapError('TOKEN_EXPIRED', 'Token has expired', undefined, 401);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return mapError('VALIDATION_ERROR', 'Invalid input', { issues: err.issues }, 400);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = isProd ? 'Something went wrong' : (err.message || 'Internal server error');
  
  return mapError('INTERNAL_ERROR', message, undefined, statusCode);
};

