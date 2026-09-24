import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import { castVote, loadPublicVideo, removeVote } from '../services/entries';
import { streamSubmission } from '../services/submissions';

export const entriesRouter = Router();

// PUT/DELETE rather than a toggle, so a retried request can't flip the vote back.
entriesRouter.put('/:id/vote', requireAuth, writeLimiter, async (req, res) => {
  res.json(await castVote(String(req.params.id), req.userId!));
});

entriesRouter.delete('/:id/vote', requireAuth, writeLimiter, async (req, res) => {
  res.json(await removeVote(String(req.params.id), req.userId!));
});

entriesRouter.get('/:id/video', async (req, res) => {
  const video = await loadPublicVideo(String(req.params.id));
  // The URL carries the file id, so a replaced video gets a new URL and caching is safe.
  streamSubmission(req, res, video, 'public, max-age=86400');
});
