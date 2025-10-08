import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const id = req.header('X-Request-Id') || randomUUID();
  res.setHeader('X-Request-Id', id);
  (req as any).requestId = id;
  next();
};

