import path from 'node:path';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/errors';
import { authRouter } from './routes/auth';
import { competitionsRouter } from './routes/competitions';
import { entriesRouter } from './routes/entries';
import { meRouter } from './routes/me';
import { miscRouter } from './routes/misc';
import { pagesRouter } from './routes/pages';
import { registrationsRouter } from './routes/registrations';
import { webhooksRouter } from './routes/webhooks';

export function createApp() {
  const app = express();

  // Render terminates TLS at its proxy; this makes req.ip and rate limiting use the client address.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
          frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
          connectSrc: ["'self'", 'https://*.razorpay.com'],
          imgSrc: ["'self'", 'data:', 'https://*.razorpay.com'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors({ origin: env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(',').map((o) => o.trim()) }));
  app.use(compression());

  app.use('/api/v1/webhooks', webhooksRouter);
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' });
  });

  app.use('/static', express.static(path.resolve(__dirname, '../public'), { maxAge: '7d' }));
  app.use(pagesRouter);

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/competitions', competitionsRouter);
  app.use('/api/v1/registrations', registrationsRouter);
  app.use('/api/v1/entries', entriesRouter);
  app.use('/api/v1/me', meRouter);
  app.use('/api/v1', miscRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
