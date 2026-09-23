import { describe, expect, it } from 'vitest';
import { getLifecycle } from '../src/services/lifecycle';

const at = (iso: string) => new Date(iso);

const base = {
  status: 'published',
  capacity: 20,
  bookedCount: 0,
  schedule: {
    registrationOpensAt: at('2026-08-01T00:00:00Z'),
    registrationClosesAt: at('2026-08-10T18:20:00Z'),
    submissionStartsAt: at('2026-08-06T00:00:00Z'),
    submissionEndsAt: at('2026-08-30T18:25:00Z'),
    resultAt: at('2026-09-01T18:20:00Z'),
  },
};

describe('getLifecycle', () => {
  it.each([
    ['2026-07-30T00:00:00Z', 'upcoming', 'registration_opens'],
    ['2026-08-03T00:00:00Z', 'registration_open', 'registration_closes'],
    ['2026-08-08T00:00:00Z', 'registration_open', 'registration_closes'],
    ['2026-08-15T00:00:00Z', 'submission_open', 'submission_ends'],
    ['2026-08-31T00:00:00Z', 'judging', 'results'],
    ['2026-09-02T00:00:00Z', 'results_announced', null],
  ])('at %s the phase is %s', (now, phase, deadline) => {
    const lifecycle = getLifecycle(base, at(now));
    expect(lifecycle.phase).toBe(phase);
    expect(lifecycle.nextDeadline?.kind ?? null).toBe(deadline);
  });

  it('keeps submissions open while registration is still open when the windows overlap', () => {
    const lifecycle = getLifecycle(base, at('2026-08-08T00:00:00Z'));
    expect(lifecycle.registrationOpen).toBe(true);
    expect(lifecycle.submissionOpen).toBe(true);
  });

  it('reports awaiting_submissions when registration closes before submissions start', () => {
    const schedule = { ...base.schedule, submissionStartsAt: at('2026-08-12T00:00:00Z') };
    const lifecycle = getLifecycle({ ...base, schedule }, at('2026-08-11T00:00:00Z'));
    expect(lifecycle.phase).toBe('awaiting_submissions');
    expect(lifecycle.nextDeadline?.kind).toBe('submission_starts');
  });

  it('treats the close time as exclusive', () => {
    expect(getLifecycle(base, base.schedule.registrationClosesAt).registrationOpen).toBe(false);
  });

  it('flags a full competition and a cancelled one', () => {
    expect(getLifecycle({ ...base, bookedCount: 20 }, at('2026-08-03T00:00:00Z')).isFull).toBe(true);
    const cancelled = getLifecycle({ ...base, status: 'cancelled' }, at('2026-08-03T00:00:00Z'));
    expect(cancelled.phase).toBe('cancelled');
    expect(cancelled.registrationOpen).toBe(false);
  });
});
