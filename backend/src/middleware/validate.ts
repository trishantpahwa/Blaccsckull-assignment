import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { badRequest } from '../lib/errors';

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const first = result.error.issues[0];
      const field = first.path.join('.');
      return next(badRequest('VALIDATION_ERROR', field ? `${field}: ${first.message}` : first.message));
    }
    req.body = result.data;
    next();
  };
}
