import type { CompetitionDetail, Registration } from '@/api/types';
import { format, type Dictionary } from '@/i18n';
import { formatDate, formatRupees, formatShortDuration } from './format';

export type CtaAction = 'login' | 'register' | 'pay' | 'upload' | null;

export interface CtaState {
  title: string;
  subtitle: string | null;
  action: CtaAction;
}

interface Input {
  competition: CompetitionDetail;
  registration: Registration | null;
  loggedIn: boolean;
  now: number;
  t: Dictionary;
}

export function getCtaState({ competition: c, registration: reg, loggedIn, now, t }: Input): CtaState {
  const { lifecycle, schedule } = c;
  const date = (iso: string) => formatDate(iso, t);
  const fee = c.entryFee ? formatRupees(c.entryFee) : t.free;

  if (lifecycle.phase === 'cancelled') return { title: t.cta.cancelled, subtitle: null, action: null };

  if (reg?.status === 'refund_due') {
    return { title: t.cta.refundDue, subtitle: t.cta.refundDueSub, action: null };
  }

  if (reg?.status === 'confirmed') {
    if (lifecycle.submissionOpen) {
      return reg.submission
        ? { title: t.cta.replaceSubmission, subtitle: format(t.cta.submittedSub, { file: reg.submission.fileName }), action: 'upload' }
        : { title: t.cta.uploadSubmission, subtitle: t.registered, action: 'upload' };
    }
    if (now < new Date(schedule.submissionStartsAt).getTime()) {
      return { title: t.cta.uploadSubmission, subtitle: format(t.cta.submissionOpensSub, { date: date(schedule.submissionStartsAt) }), action: null };
    }
    if (lifecycle.phase === 'results_announced') return { title: t.cta.resultsAnnounced, subtitle: null, action: null };
    return { title: t.cta.submissionsClosed, subtitle: format(t.cta.resultsOnSub, { date: date(schedule.resultAt) }), action: null };
  }

  const holdEndsAt = reg?.status === 'pending_payment' && reg.holdExpiresAt ? new Date(reg.holdExpiresAt).getTime() : 0;
  if (holdEndsAt > now && lifecycle.registrationOpen) {
    return {
      title: t.cta.completePayment,
      subtitle: format(t.cta.holdSub, { time: formatShortDuration(holdEndsAt - now) }),
      action: 'pay',
    };
  }

  if (lifecycle.phase === 'upcoming') {
    return {
      title: t.cta.registrationOpens,
      subtitle: format(t.cta.registrationOpensSub, { date: date(schedule.registrationOpensAt) }),
      action: null,
    };
  }

  if (!lifecycle.registrationOpen) {
    const subtitle = lifecycle.phase === 'results_announced' ? t.cta.resultsAnnounced : format(t.cta.resultsOnSub, { date: date(schedule.resultAt) });
    return { title: t.cta.registrationClosed, subtitle, action: null };
  }

  if (lifecycle.isFull) return { title: t.cta.soldOut, subtitle: t.cta.soldOutSub, action: null };

  if (!loggedIn) return { title: t.cta.loginToRegister, subtitle: format(t.cta.entryFeeSub, { fee }), action: 'login' };

  return c.entryFee
    ? { title: t.cta.register, subtitle: format(t.cta.registerSub, { fee }), action: 'register' }
    : { title: t.cta.registerFree, subtitle: null, action: 'register' };
}
