import { describe, expect, it } from 'vitest';
import { UserModel } from '../src/models/User';
import { api } from './helpers';

const signup = (body: Record<string, unknown>) => api().post('/api/v1/auth/signup').send(body);

describe('auth', () => {
  it('signs up, logs in and returns the current user', async () => {
    const res = await signup({ name: 'Asha', email: 'Asha@Example.com', password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('asha@example.com');
    expect(res.body.user.referralLink).toMatch(/\/r\/[A-Z0-9]{8}$/);

    const login = await api().post('/api/v1/auth/login').send({ email: 'asha@example.com', password: 'secret123' });
    expect(login.status).toBe(200);

    const me = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(me.body.user.name).toBe('Asha');
  });

  it('rejects duplicate emails and bad input', async () => {
    await signup({ name: 'Asha', email: 'asha@example.com', password: 'secret123' });
    const dup = await signup({ name: 'Asha', email: 'ASHA@example.com', password: 'secret123' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('EMAIL_TAKEN');

    const bad = await signup({ name: 'A', email: 'nope', password: '1' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('does not reveal whether the email or the password was wrong', async () => {
    await signup({ name: 'Asha', email: 'asha@example.com', password: 'secret123' });
    const wrongPassword = await api().post('/api/v1/auth/login').send({ email: 'asha@example.com', password: 'nope1234' });
    const unknownEmail = await api().post('/api/v1/auth/login').send({ email: 'ghost@example.com', password: 'nope1234' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('credits the referrer when someone signs up with their code', async () => {
    const referrer = await signup({ name: 'Ravi', email: 'ravi@example.com', password: 'secret123' });
    await signup({ name: 'Meera', email: 'meera@example.com', password: 'secret123', referralCode: referrer.body.user.referralCode.toLowerCase() });

    const saved = await UserModel.findOne({ email: 'ravi@example.com' });
    expect(saved?.referralCount).toBe(1);
    expect(saved?.referralEarnings).toBe(1000);

    const stats = await api().get('/api/v1/referrals/me').set('Authorization', `Bearer ${referrer.body.token}`);
    expect(stats.body).toMatchObject({ signups: 1, earnings: 1000, rewardPerSignup: 1000 });
  });

  it('rejects requests with an invalid token', async () => {
    const res = await api().get('/api/v1/auth/me').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
});
