import { Router } from 'express';
import { z } from 'zod';
import { signToken } from '../lib/auth';
import { notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { UserModel } from '../models/User';
import { authenticate, createUser, userView } from '../services/users';

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim(),
  password: z.string().min(8).max(128),
  referralCode: z.string().trim().max(16).optional().or(z.literal('').transform(() => undefined)),
});

const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1).max(128),
});

export const authRouter = Router();

authRouter.post('/signup', authLimiter, validateBody(signupSchema), async (req, res) => {
  const user = await createUser(req.body);
  res.status(201).json({ token: signToken(user._id.toString()), user: userView(user) });
});

authRouter.post('/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  res.json({ token: signToken(user._id.toString()), user: userView(user) });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.userId);
  if (!user) throw notFound('User not found');
  res.json({ user: userView(user) });
});
