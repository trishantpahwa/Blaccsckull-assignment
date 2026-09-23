export type Phase =
  | 'cancelled'
  | 'upcoming'
  | 'registration_open'
  | 'awaiting_submissions'
  | 'submission_open'
  | 'judging'
  | 'results_announced';

export type DeadlineKind =
  | 'registration_opens'
  | 'registration_closes'
  | 'submission_starts'
  | 'submission_ends'
  | 'results';

export interface Schedule {
  registrationOpensAt: Date;
  registrationClosesAt: Date;
  submissionStartsAt: Date;
  submissionEndsAt: Date;
  resultAt: Date;
}

export interface Lifecycle {
  phase: Phase;
  registrationOpen: boolean;
  submissionOpen: boolean;
  isFull: boolean;
  nextDeadline: { kind: DeadlineKind; at: Date } | null;
}

interface LifecycleInput {
  status: string;
  schedule: Schedule;
  capacity: number;
  bookedCount: number;
}

export function isRegistrationWindowOpen(schedule: Schedule, now: Date) {
  return schedule.registrationOpensAt <= now && now < schedule.registrationClosesAt;
}

export function isSubmissionWindowOpen(schedule: Schedule, now: Date) {
  return schedule.submissionStartsAt <= now && now < schedule.submissionEndsAt;
}

export function getLifecycle(c: LifecycleInput, now = new Date()): Lifecycle {
  const s = c.schedule;
  const isFull = c.bookedCount >= c.capacity;

  if (c.status === 'cancelled') {
    return { phase: 'cancelled', registrationOpen: false, submissionOpen: false, isFull, nextDeadline: null };
  }

  const registrationOpen = isRegistrationWindowOpen(s, now);
  const submissionOpen = isSubmissionWindowOpen(s, now);

  let phase: Phase;
  let nextDeadline: Lifecycle['nextDeadline'];

  // Registration and submission windows are allowed to overlap, so registration takes priority
  // while it is still open.
  if (now < s.registrationOpensAt) {
    phase = 'upcoming';
    nextDeadline = { kind: 'registration_opens', at: s.registrationOpensAt };
  } else if (registrationOpen) {
    phase = 'registration_open';
    nextDeadline = { kind: 'registration_closes', at: s.registrationClosesAt };
  } else if (now < s.submissionStartsAt) {
    phase = 'awaiting_submissions';
    nextDeadline = { kind: 'submission_starts', at: s.submissionStartsAt };
  } else if (submissionOpen) {
    phase = 'submission_open';
    nextDeadline = { kind: 'submission_ends', at: s.submissionEndsAt };
  } else if (now < s.resultAt) {
    phase = 'judging';
    nextDeadline = { kind: 'results', at: s.resultAt };
  } else {
    phase = 'results_announced';
    nextDeadline = null;
  }

  return { phase, registrationOpen, submissionOpen, isFull, nextDeadline };
}
