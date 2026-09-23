import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { badRequest } from '../lib/errors';

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const first = result.error.issues[0];
      const field = first.path.join('.');
      // Cross-field rules already read as full sentences, so they don't need the field prefix.
      const message = field && first.code !== 'custom' ? `${field}: ${first.message}` : first.message;
      return next(badRequest('VALIDATION_ERROR', message));
    }
    req.body = result.data;
    next();
  };
}
