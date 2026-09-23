import { Router } from 'express';
import { env } from '../config/env';
import { notFound } from '../lib/errors';
import { localize, parseLang } from '../lib/i18n';
import { absoluteUrl, referralLink } from '../lib/urls';
import { requireAuth } from '../middleware/auth';
import { TestimonialModel } from '../models/Testimonial';
import { UserModel } from '../models/User';

export const miscRouter = Router();

miscRouter.get('/testimonials', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const items = await TestimonialModel.find({ published: true }).sort({ createdAt: -1 }).limit(20).lean();
  res.set('Cache-Control', 'public, max-age=300');
  res.json({
    testimonials: items.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      role: t.role ? localize(t.role, lang) : null,
      text: localize(t.text, lang),
      rating: t.rating,
      avatarUrl: absoluteUrl(t.avatarUrl),
    })),
  });
});

miscRouter.get('/referrals/me', requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.userId).lean();
  if (!user) throw notFound('User not found');
  res.json({
    code: user.referralCode,
    link: referralLink(user.referralCode),
    rewardPerSignup: env.REFERRAL_REWARD,
    signups: user.referralCount,
    earnings: user.referralEarnings,
  });
});
