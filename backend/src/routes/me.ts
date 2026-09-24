import { Router } from 'express';
import { notFound } from '../lib/errors';
import { parseLang } from '../lib/i18n';
import { requireAuth } from '../middleware/auth';
import { CompetitionModel } from '../models/Competition';
import { RegistrationModel } from '../models/Registration';
import { UserModel } from '../models/User';
import { competitionSummaryView, registrationView } from '../services/competitionView';

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get('/saved', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const user = await UserModel.findById(req.userId, { savedCompetitions: 1 }).lean();
  if (!user) throw notFound('User not found');

  const competitions = await CompetitionModel.find({
    _id: { $in: user.savedCompetitions },
    status: { $in: ['published', 'cancelled'] },
  }).lean();
  // Keep the order the user saved them in, newest first.
  const order = new Map(user.savedCompetitions.map((id, i) => [id.toString(), i]));
  competitions.sort((a, b) => order.get(b._id.toString())! - order.get(a._id.toString())!);

  const now = new Date();
  res.json({ serverTime: now, competitions: competitions.map((c) => competitionSummaryView(c, lang, now)) });
});

meRouter.get('/registrations', async (req, res) => {
  const lang = parseLang(req.query.lang);
  // Expired and cancelled holds are noise here; they never took a spot.
  const registrations = await RegistrationModel.find({ user: req.userId, status: { $in: ['pending_payment', 'confirmed', 'refund_due'] } })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const competitions = await CompetitionModel.find({
    _id: { $in: registrations.map((r) => r.competition) },
    status: { $in: ['published', 'cancelled'] },
  }).lean();
  const byId = new Map(competitions.map((c) => [c._id.toString(), c]));

  const now = new Date();
  res.json({
    serverTime: now,
    items: registrations
      .filter((r) => byId.has(r.competition.toString()))
      .map((r) => ({
        registration: registrationView(r),
        competition: competitionSummaryView(byId.get(r.competition.toString())!, lang, now),
      })),
  });
});
