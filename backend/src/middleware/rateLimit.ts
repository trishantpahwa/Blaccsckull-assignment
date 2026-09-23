import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';

const skip = () => env.NODE_ENV === 'test';
const message = { error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } };

export const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, skip, message, standardHeaders: 'draft-8', legacyHeaders: false });

export const writeLimiter = rateLimit({ windowMs: 60_000, limit: 30, skip, message, standardHeaders: 'draft-8', legacyHeaders: false });
