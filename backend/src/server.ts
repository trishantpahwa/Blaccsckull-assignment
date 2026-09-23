import { createApp } from './app';
import { env } from './config/env';
import { connectDb, disconnectDb } from './db';
import { startHoldSweeper } from './jobs/releaseExpiredHolds';
import { logger } from './lib/logger';

async function main() {
  await connectDb(env.MONGODB_URI);
  const stopSweeper = startHoldSweeper();

  const server = createApp().listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    stopSweeper();
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
