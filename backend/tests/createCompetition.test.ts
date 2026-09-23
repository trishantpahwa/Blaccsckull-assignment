import { describe, expect, it } from 'vitest';
import { CompetitionModel } from '../src/models/Competition';
import { api, createUser } from './helpers';

const DAY = 24 * 60 * 60 * 1000;

function validBody(overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return {
    title: 'Monsoon Photo Walk',
    category: 'Photography',
    about: 'Capture the monsoon in your city.',
    entryFee: 4900,
    capacity: 30,
    rewards: [100000, 50000, 25000],
    givesCertificate: true,
    judge: { name: 'Arjun Rao', title: 'Photojournalist', experienceYears: 9 },
    schedule: {
      registrationOpensAt: new Date(now - 60_000).toISOString(),
      registrationClosesAt: new Date(now + 5 * DAY).toISOString(),
      submissionStartsAt: new Date(now).toISOString(),
      submissionEndsAt: new Date(now + 10 * DAY).toISOString(),
      resultAt: new Date(now + 12 * DAY).toISOString(),
    },
    judgingParameters: ['Composition', 'Storytelling'],
    rules: ['One photo per participant'],
    ...overrides,
  };
}

async function post(body: Record<string, unknown>, token?: string) {
  const req = api().post('/api/v1/competitions');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body);
}

describe('creating a competition', () => {
  it('publishes it with a derived prize pool and slug', async () => {
    const { user, token } = await createUser();
    const res = await post(validBody(), token);

    expect(res.status).toBe(201);
    expect(res.body.competition).toMatchObject({
      title: 'Monsoon Photo Walk',
      prizePool: 175000,
      isMultiWin: true,
      spotsLeft: 30,
      rewards: [
        { position: 1, amount: 100000 },
        { position: 2, amount: 50000 },
        { position: 3, amount: 25000 },
      ],
    });
    expect(res.body.competition.slug).toMatch(/^monsoon-photo-walk-[a-f0-9]{6}$/);
    expect(res.body.competition.lifecycle.phase).toBe('registration_open');

    const saved = await CompetitionModel.findOne({ slug: res.body.competition.slug });
    expect(saved?.createdBy?.toString()).toBe(user._id.toString());
  });

  it('shows up in the list and can be registered for', async () => {
    const { token } = await createUser('Organiser');
    const created = await post(validBody({ entryFee: 0, rewards: [50000] }), token);
    const { slug } = created.body.competition;

    const list = await api().get('/api/v1/competitions');
    expect(list.body.competitions.map((c: { slug: string }) => c.slug)).toContain(slug);

    const { token: participant } = await createUser('Participant');
    const reg = await api().post(`/api/v1/competitions/${slug}/registrations`).set('Authorization', `Bearer ${participant}`);
    expect(reg.status).toBe(200);
    expect(reg.body.registration.status).toBe('confirmed');
  });

  it('gives two competitions with the same title different slugs', async () => {
    const { token } = await createUser();
    const a = await post(validBody(), token);
    const b = await post(validBody(), token);
    expect(a.body.competition.slug).not.toBe(b.body.competition.slug);
  });

  it('requires a logged in user', async () => {
    const res = await post(validBody());
    expect(res.status).toBe(401);
  });

  it.each([
    [
      'registration closing before it opens',
      { schedule: { ...validBody().schedule, registrationClosesAt: new Date(Date.now() - 2 * DAY).toISOString() } },
      'Registration must close after it opens',
    ],
    [
      'results before submissions end',
      { schedule: { ...validBody().schedule, resultAt: new Date(Date.now() + DAY).toISOString() } },
      "Results can't be announced before submissions end",
    ],
    ['more rewards than spots', { capacity: 2 }, 'There are more rewards than spots'],
    ['a lower position getting more', { rewards: [10000, 20000] }, 'A lower position can’t get a bigger reward than a higher one'],
    ['no rewards', { rewards: [] }, 'rewards: add at least one reward'],
    ['a negative entry fee', { entryFee: -100 }, "entryFee: can't be negative"],
    ['a missing judge name', { judge: { name: '', title: 'Judge' } }, 'judge.name: is required'],
  ])('rejects %s', async (_label, overrides, message) => {
    const { token } = await createUser();
    const res = await post(validBody(overrides), token);
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ code: 'VALIDATION_ERROR', message });
    expect(await CompetitionModel.countDocuments()).toBe(0);
  });
});
