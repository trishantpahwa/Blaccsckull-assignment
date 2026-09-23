import { Router } from 'express';
import { env } from '../config/env';
import { notFound } from '../lib/errors';
import { parseLang } from '../lib/i18n';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimit';
import { CompetitionModel } from '../models/Competition';
import { ACTIVE_STATUSES, RegistrationModel } from '../models/Registration';
import { availabilityView, competitionDetailView, competitionSummaryView, registrationView } from '../services/competitionView';
import { startRegistration } from '../services/registrations';

export const competitionsRouter = Router();

const visible = { status: { $in: ['published' as const, 'cancelled' as const] } };

competitionsRouter.get('/', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const competitions = await CompetitionModel.find(visible).sort({ 'schedule.registrationClosesAt': 1 }).limit(50).lean();
  const now = new Date();
  res.json({ serverTime: now, competitions: competitions.map((c) => competitionSummaryView(c, lang, now)) });
});

competitionsRouter.get('/:slug', optionalAuth, async (req, res) => {
  const lang = parseLang(req.query.lang);
  const competition = await CompetitionModel.findOne({ slug: String(req.params.slug), ...visible }).lean();
  if (!competition) throw notFound('Competition not found');

  let registration = null;
  if (req.userId) {
    // Prefer the active entry; otherwise show the latest one so states like refund_due are visible.
    registration =
      (await RegistrationModel.findOne({ competition: competition._id, user: req.userId, status: { $in: ACTIVE_STATUSES } }).lean()) ??
      (await RegistrationModel.findOne({ competition: competition._id, user: req.userId }).sort({ createdAt: -1 }).lean());
  }

  const now = new Date();
  res.set('Cache-Control', 'private, no-cache');
  res.json({
    serverTime: now,
    competition: competitionDetailView(competition, lang, now),
    viewer: req.userId ? { registration: registration ? registrationView(registration) : null } : null,
  });
});

// Small payload the app polls to keep the spots counter and phase fresh.
competitionsRouter.get('/:slug/availability', async (req, res) => {
  const competition = await CompetitionModel.findOne(
    { slug: String(req.params.slug), ...visible },
    { capacity: 1, bookedCount: 1, schedule: 1, status: 1 },
  ).lean();
  if (!competition) throw notFound('Competition not found');

  const now = new Date();
  res.set('Cache-Control', 'public, max-age=5');
  res.json({ serverTime: now, ...availabilityView(competition, now) });
});

competitionsRouter.post('/:slug/registrations', requireAuth, writeLimiter, async (req, res) => {
  const { registration, order } = await startRegistration(String(req.params.slug), req.userId!);
  res.status(order ? 201 : 200).json({
    registration: registrationView(registration),
    payment: order
      ? {
          keyId: env.RAZORPAY_KEY_ID,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          checkoutUrl: `${env.PUBLIC_BASE_URL}/checkout`,
        }
      : null,
  });
});
