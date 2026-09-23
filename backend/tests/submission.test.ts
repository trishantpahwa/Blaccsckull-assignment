import { describe, expect, it } from 'vitest';
import { RegistrationModel } from '../src/models/Registration';
import { submissionsBucket } from '../src/services/submissions';
import { api, createCompetition, createUser } from './helpers';

async function confirmedEntry(overrides: Record<string, unknown> = {}) {
  await createCompetition({ entryFee: 0, ...overrides });
  const { token } = await createUser();
  const res = await api().post('/api/v1/competitions/test-dance/registrations').set('Authorization', `Bearer ${token}`);
  return { token, registrationId: res.body.registration.id as string };
}

const upload = (token: string, id: string, content: Buffer, filename: string, contentType: string) =>
  api()
    .post(`/api/v1/registrations/${id}/submission`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', content, { filename, contentType });

describe('submissions', () => {
  it('stores the video and replaces it on re-upload', async () => {
    const { token, registrationId } = await confirmedEntry();

    const first = await upload(token, registrationId, Buffer.from('first video'), 'dance.mp4', 'video/mp4');
    expect(first.status).toBe(201);
    expect(first.body.registration.submission).toMatchObject({ fileName: 'dance.mp4', size: 11 });

    const second = await upload(token, registrationId, Buffer.from('second take'), 'take2.mp4', 'video/mp4');
    expect(second.body.registration.submission.fileName).toBe('take2.mp4');

    const files = await submissionsBucket().find({}).toArray();
    expect(files).toHaveLength(1);

    const download = await api()
      .get(`/api/v1/registrations/${registrationId}/submission/file`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(download.status).toBe(200);
    expect(download.body.toString()).toBe('second take');
  });

  it('rejects non-video files', async () => {
    const { token, registrationId } = await confirmedEntry();
    const res = await upload(token, registrationId, Buffer.from('hi'), 'notes.txt', 'text/plain');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE');
  });

  it('rejects uploads before the submission window opens', async () => {
    const { token, registrationId } = await confirmedEntry({
      'schedule.submissionStartsAt': new Date(Date.now() + 60 * 60_000),
    });
    const res = await upload(token, registrationId, Buffer.from('x'), 'dance.mp4', 'video/mp4');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SUBMISSION_CLOSED');
  });

  it('does not let other users touch a registration', async () => {
    const { registrationId } = await confirmedEntry();
    const { token: stranger } = await createUser('Stranger');
    const res = await upload(stranger, registrationId, Buffer.from('x'), 'dance.mp4', 'video/mp4');
    expect(res.status).toBe(404);
    expect(await RegistrationModel.countDocuments({ 'submission.fileId': { $exists: true } })).toBe(0);
  });
});
