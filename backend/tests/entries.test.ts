import { describe, expect, it } from 'vitest';
import { RegistrationModel } from '../src/models/Registration';
import { VoteModel } from '../src/models/Vote';
import { publicName, rankByVotes } from '../src/services/entries';
import { parseRange } from '../src/services/submissions';
import { api, createCompetition, createUser } from './helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// Registers a user for the free test competition and uploads a video, returning the entry id.
async function enter(name: string, video = Buffer.from(`video by ${name}`)) {
  const { user, token } = await createUser(name);
  const reg = await api().post('/api/v1/competitions/test-dance/registrations').set(auth(token));
  await api()
    .post(`/api/v1/registrations/${reg.body.registration.id}/submission`)
    .set(auth(token))
    .attach('file', video, { filename: 'dance.mp4', contentType: 'video/mp4' });
  return { user, token, entryId: reg.body.registration.id as string };
}

const listEntries = (token?: string, sort = 'top') => {
  const req = api().get(`/api/v1/competitions/test-dance/entries?sort=${sort}`);
  return token ? req.set(auth(token)) : req;
};

const vote = (token: string, entryId: string) => api().put(`/api/v1/entries/${entryId}/vote`).set(auth(token));
const unvote = (token: string, entryId: string) => api().delete(`/api/v1/entries/${entryId}/vote`).set(auth(token));

describe('entry showcase', () => {
  it('lists entries with public names, ranks and the viewer’s votes', async () => {
    await createCompetition({ entryFee: 0 });
    const riya = await enter('Riya Shah');
    const arjun = await enter('Arjun Mehta');
    await enter('Kavya');
    const { token: fan } = await createUser('Fan');
    const { token: fan2 } = await createUser('Fan 2');

    await vote(fan, arjun.entryId);
    await vote(fan2, arjun.entryId);
    await vote(fan, riya.entryId);

    const res = await listEntries(fan);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.votingOpen).toBe(true);
    expect(res.body.entries.map((e: { entrant: { name: string } }) => e.entrant.name)).toEqual(['Arjun M.', 'Riya S.', 'Kavya']);
    expect(res.body.entries.map((e: { rank: number | null }) => e.rank)).toEqual([1, 2, null]);
    expect(res.body.entries.map((e: { viewerHasVoted: boolean }) => e.viewerHasVoted)).toEqual([true, true, false]);
    expect(res.body.entries[0].videoUrl).toMatch(new RegExp(`/api/v1/entries/${arjun.entryId}/video\\?v=`));

    const newest = await listEntries(undefined, 'new');
    expect(newest.body.entries[0].entrant.name).toBe('Kavya');
    expect(newest.body.entries[0].isMine).toBe(false);
  });

  it('leaves out unpaid registrations and entries without a video', async () => {
    await createCompetition({ entryFee: 0 });
    await enter('Has Video');
    const { token } = await createUser('No Video');
    await api().post('/api/v1/competitions/test-dance/registrations').set(auth(token));

    const res = await listEntries();
    expect(res.body.total).toBe(1);
  });

  it('hides an entry from everyone but its owner, and keeps that across re-uploads', async () => {
    await createCompetition({ entryFee: 0 });
    const shy = await enter('Shy Dancer');
    const { token: fan } = await createUser('Fan');

    const hide = await api().patch(`/api/v1/registrations/${shy.entryId}/submission`).set(auth(shy.token)).send({ hidden: true });
    expect(hide.status).toBe(200);
    expect(hide.body.registration.submission.hidden).toBe(true);

    expect((await listEntries(fan)).body.entries).toHaveLength(0);
    const own = await listEntries(shy.token);
    expect(own.body.total).toBe(0);
    expect(own.body.entries).toMatchObject([{ isMine: true, hidden: true, rank: null }]);

    expect((await vote(fan, shy.entryId)).status).toBe(404);
    expect((await api().get(`/api/v1/entries/${shy.entryId}/video`)).status).toBe(404);

    await api()
      .post(`/api/v1/registrations/${shy.entryId}/submission`)
      .set(auth(shy.token))
      .attach('file', Buffer.from('take 2'), { filename: 'take2.mp4', contentType: 'video/mp4' });
    const reg = await RegistrationModel.findById(shy.entryId).lean();
    expect(reg!.submission).toMatchObject({ fileName: 'take2.mp4', hidden: true });
  });

  it('only lets the owner change visibility', async () => {
    await createCompetition({ entryFee: 0 });
    const { entryId } = await enter('Owner');
    const { token: stranger } = await createUser('Stranger');
    const res = await api().patch(`/api/v1/registrations/${entryId}/submission`).set(auth(stranger)).send({ hidden: true });
    expect(res.status).toBe(404);
  });
});

describe('voting', () => {
  it('counts a vote once no matter how many times it is sent, even concurrently', async () => {
    await createCompetition({ entryFee: 0 });
    const { entryId } = await enter('Dancer');
    const { token: fan } = await createUser('Fan');

    const results = await Promise.all(Array.from({ length: 10 }, () => vote(fan, entryId)));
    expect(results.every((r) => r.status === 200)).toBe(true);

    const reg = await RegistrationModel.findById(entryId).lean();
    expect(reg!.voteCount).toBe(1);
    expect(await VoteModel.countDocuments({ registration: entryId })).toBe(1);
  });

  it('keeps the count exact when many people vote at once', async () => {
    await createCompetition({ entryFee: 0 });
    const { entryId } = await enter('Dancer');
    const fans = await Promise.all(Array.from({ length: 15 }, (_, i) => createUser(`Fan ${i}`)));

    await Promise.all(fans.map(({ token }) => vote(token, entryId)));
    await Promise.all(fans.slice(0, 5).map(({ token }) => unvote(token, entryId)));

    const reg = await RegistrationModel.findById(entryId).lean();
    expect(reg!.voteCount).toBe(10);
    expect(await VoteModel.countDocuments({ registration: entryId })).toBe(10);
  });

  it('removes a vote once and ignores repeats', async () => {
    await createCompetition({ entryFee: 0 });
    const { entryId } = await enter('Dancer');
    const { token: fan } = await createUser('Fan');

    await vote(fan, entryId);
    const first = await unvote(fan, entryId);
    const second = await unvote(fan, entryId);
    expect(first.body).toEqual({ voteCount: 0, viewerHasVoted: false });
    expect(second.body).toEqual({ voteCount: 0, viewerHasVoted: false });
  });

  it('does not allow voting for your own entry', async () => {
    await createCompetition({ entryFee: 0 });
    const { token, entryId } = await enter('Self Promoter');
    const res = await vote(token, entryId);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('OWN_ENTRY');
  });

  it('requires a login', async () => {
    await createCompetition({ entryFee: 0 });
    const { entryId } = await enter('Dancer');
    expect((await api().put(`/api/v1/entries/${entryId}/vote`)).status).toBe(401);
  });

  it('closes voting once results are announced', async () => {
    const competition = await createCompetition({ entryFee: 0 });
    const { entryId } = await enter('Dancer');
    const { token: fan } = await createUser('Fan');

    await competition.updateOne({ 'schedule.resultAt': new Date(Date.now() - 1000) });
    const res = await vote(fan, entryId);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('VOTING_CLOSED');
    expect((await listEntries()).body.votingOpen).toBe(false);
  });
});

describe('public entry video', () => {
  const body = Buffer.from('0123456789abcdefghij');
  const fetchVideo = (entryId: string, range?: string) => {
    const req = api()
      .get(`/api/v1/entries/${entryId}/video`)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    return range ? req.set('Range', range) : req;
  };

  it('serves the whole file and byte ranges', async () => {
    await createCompetition({ entryFee: 0 });
    const { entryId } = await enter('Dancer', body);

    const full = await fetchVideo(entryId);
    expect(full.status).toBe(200);
    expect(full.headers['accept-ranges']).toBe('bytes');
    expect(full.body.toString()).toBe(body.toString());

    const partial = await fetchVideo(entryId, 'bytes=5-9');
    expect(partial.status).toBe(206);
    expect(partial.headers['content-range']).toBe('bytes 5-9/20');
    expect(partial.body.toString()).toBe('56789');

    const tail = await fetchVideo(entryId, 'bytes=-3');
    expect(tail.body.toString()).toBe('hij');

    const beyond = await fetchVideo(entryId, 'bytes=50-');
    expect(beyond.status).toBe(416);
    expect(beyond.headers['content-range']).toBe('bytes */20');
  });

  it('parses range headers', () => {
    expect(parseRange(undefined, 100)).toBeNull();
    expect(parseRange('bytes=0-', 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange('bytes=10-500', 100)).toEqual({ start: 10, end: 99 });
    expect(parseRange('bytes=-500', 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange('bytes=0-1,5-6', 100)).toBeNull();
    expect(parseRange('bytes=9-2', 100)).toBe('unsatisfiable');
    expect(parseRange('bytes=-0', 100)).toBe('unsatisfiable');
  });
});

describe('entry helpers', () => {
  it('ranks ties together and leaves zero votes unranked', () => {
    expect(rankByVotes([5, 3, 3, 1, 0])).toEqual([1, 2, 2, 4, null]);
  });

  it('shortens names for the public gallery', () => {
    expect(publicName('Riya Shah')).toBe('Riya S.');
    expect(publicName('  Kavya  ')).toBe('Kavya');
    expect(publicName('Anil Kumar sharma')).toBe('Anil S.');
  });
});

describe('saved competitions', () => {
  it('saves and unsaves idempotently and shows up on the details and saved list', async () => {
    await createCompetition();
    const { token } = await createUser();

    for (let i = 0; i < 2; i++) {
      const res = await api().put('/api/v1/competitions/test-dance/save').set(auth(token));
      expect(res.body).toEqual({ saved: true });
    }
    const details = await api().get('/api/v1/competitions/test-dance').set(auth(token));
    expect(details.body.viewer.saved).toBe(true);

    const saved = await api().get('/api/v1/me/saved').set(auth(token));
    expect(saved.body.competitions.map((c: { slug: string }) => c.slug)).toEqual(['test-dance']);

    await api().delete('/api/v1/competitions/test-dance/save').set(auth(token));
    const after = await api().get('/api/v1/me/saved').set(auth(token));
    expect(after.body.competitions).toEqual([]);
  });

  it('404s for unknown competitions', async () => {
    const { token } = await createUser();
    expect((await api().put('/api/v1/competitions/nope/save').set(auth(token))).status).toBe(404);
  });
});

describe('my registrations', () => {
  it('lists the user’s own entries with their competition', async () => {
    await createCompetition({ entryFee: 0 });
    const { token } = await enter('Dancer');
    await enter('Someone Else');

    const res = await api().get('/api/v1/me/registrations').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      registration: { status: 'confirmed', submission: { fileName: 'dance.mp4' } },
      competition: { slug: 'test-dance' },
    });
  });
});

describe('share page', () => {
  it('renders the competition with escaped content and an app link', async () => {
    await createCompetition({ title: { en: '<script>alert(1)</script> Dance' } });
    const res = await api().get('/c/test-dance');
    expect(res.status).toBe(200);
    expect(res.text).toContain('&lt;script&gt;alert(1)&lt;/script&gt; Dance');
    expect(res.text).not.toContain('<script>alert');
    expect(res.text).toContain('feedants://competitions/test-dance');
    expect(res.text).toContain('og:title');
  });

  it('404s for unknown competitions', async () => {
    expect((await api().get('/c/nope')).status).toBe(404);
  });
});
