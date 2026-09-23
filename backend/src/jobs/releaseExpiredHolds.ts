import { logger } from '../lib/logger';
import { releaseExpiredHolds } from '../services/registrations';

export function startHoldSweeper(intervalMs = 60_000) {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const released = await releaseExpiredHolds();
      if (released) logger.info({ released }, 'Released expired registration holds');
    } catch (err) {
      logger.error({ err }, 'Hold sweeper failed');
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
