import { env } from '../config/env';
import { localize, type Lang } from '../lib/i18n';
import { absoluteUrl, competitionLink } from '../lib/urls';
import type { Competition } from '../models/Competition';
import type { Registration } from '../models/Registration';
import { getLifecycle } from './lifecycle';

type CompetitionLike = Competition & { _id: { toString(): string } };
type RegistrationLike = Registration & { _id: { toString(): string } };

export function availabilityView(c: CompetitionLike, now = new Date()) {
  return {
    capacity: c.capacity,
    bookedCount: c.bookedCount,
    spotsLeft: Math.max(c.capacity - c.bookedCount, 0),
    lifecycle: getLifecycle(c, now),
  };
}

export function registrationView(r: RegistrationLike) {
  return {
    id: r._id.toString(),
    status: r.status,
    amount: r.amount,
    holdExpiresAt: r.holdExpiresAt ?? null,
    confirmedAt: r.confirmedAt ?? null,
    razorpayOrderId: r.razorpayOrderId ?? null,
    submission: r.submission
      ? {
          fileName: r.submission.fileName,
          mimeType: r.submission.mimeType,
          size: r.submission.size,
          submittedAt: r.submission.submittedAt,
          hidden: r.submission.hidden ?? false,
        }
      : null,
    voteCount: r.voteCount ?? 0,
  };
}

export function competitionSummaryView(c: CompetitionLike, lang: Lang, now = new Date()) {
  return {
    id: c._id.toString(),
    slug: c.slug,
    title: localize(c.title, lang),
    category: localize(c.category, lang),
    prizePool: c.prizePool,
    entryFee: c.entryFee,
    currency: c.currency,
    judgeName: c.judge.name,
    ...availabilityView(c, now),
  };
}

export function competitionDetailView(c: CompetitionLike, lang: Lang, now = new Date()) {
  const list = (value: { en: string[]; hi: string[] } | undefined) =>
    (lang === 'hi' && value?.hi.length ? value.hi : value?.en) ?? [];

  return {
    ...competitionSummaryView(c, lang, now),
    isMultiWin: c.isMultiWin,
    givesCertificate: c.givesCertificate,
    judge: {
      name: c.judge.name,
      title: localize(c.judge.title, lang),
      experienceYears: c.judge.experienceYears ?? null,
      photoUrl: absoluteUrl(c.judge.photoUrl),
      introVideoUrl: absoluteUrl(c.judge.introVideoUrl),
    },
    schedule: c.schedule,
    about: localize(c.about, lang),
    judgingParameters: list(c.judgingParameters),
    rules: list(c.rules),
    rewards: [...c.rewards].sort((a, b) => a.position - b.position),
    previousWinners: c.previousWinners.map((w) => ({
      name: w.name,
      position: w.position,
      photoUrl: absoluteUrl(w.photoUrl),
      videoUrl: absoluteUrl(w.videoUrl),
    })),
    prizeInfoVideoUrl: absoluteUrl(c.prizeInfoVideoUrl),
    disclaimer: c.disclaimer ? localize(c.disclaimer, lang) : null,
    ad: c.ad?.imageUrl ? { imageUrl: absoluteUrl(c.ad.imageUrl), targetUrl: c.ad.targetUrl ?? null } : null,
    referral: { rewardPerSignup: env.REFERRAL_REWARD },
    shareUrl: competitionLink(c.slug),
  };
}
