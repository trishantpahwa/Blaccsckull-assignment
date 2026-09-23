import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/auth';
import { unauthorized } from '../lib/errors';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

function readToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  const userId = token && verifyToken(token);
  if (!userId) return next(unauthorized());
  req.userId = userId;
  next();
}

// Lets anonymous users through, but still rejects a bad token so the client can drop it.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next();
  const userId = verifyToken(token);
  if (!userId) return next(unauthorized('Your session has expired, please log in again'));
  req.userId = userId;
  next();
}
