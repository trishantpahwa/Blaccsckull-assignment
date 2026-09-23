import { describe, expect, it, vi } from 'vitest';
import { CompetitionModel } from '../src/models/Competition';
import { RegistrationModel } from '../src/models/Registration';
import { paymentGateway } from '../src/services/paymentGateway';
import { confirmPayment, releaseExpiredHolds } from '../src/services/registrations';
import { api, createCompetition, createUser, mockOrders, paymentSignature, webhookSignature } from './helpers';

const register = (token: string, slug = 'test-dance') =>
  api().post(`/api/v1/competitions/${slug}/registrations`).set('Authorization', `Bearer ${token}`);

const bookedCount = async () => (await CompetitionModel.findOne({ slug: 'test-dance' }))!.bookedCount;

describe('competition details', () => {
  it('returns dynamic data and the viewer registration', async () => {
    await createCompetition();
    mockOrders();
    const { token } = await createUser();

    const anon = await api().get('/api/v1/competitions/test-dance?lang=hi');
    expect(anon.status).toBe(200);
    expect(anon.body.competition).toMatchObject({ title: 'टेस्ट नृत्य', spotsLeft: 20, entryFee: 9900 });
    expect(anon.body.competition.lifecycle.phase).toBe('registration_open');
    expect(anon.body.viewer).toBeNull();

    await register(token);
    const authed = await api().get('/api/v1/competitions/test-dance').set('Authorization', `Bearer ${token}`);
    expect(authed.body.competition.spotsLeft).toBe(19);
    expect(authed.body.viewer.registration.status).toBe('pending_payment');
  });

  it('hides drafts and returns 404 for unknown slugs', async () => {
    await createCompetition({ status: 'draft' });
    expect((await api().get('/api/v1/competitions/test-dance')).status).toBe(404);
    expect((await api().get('/api/v1/competitions/nope/availability')).status).toBe(404);
  });
});

describe('registration and payment', () => {
  it('holds a spot, then confirms it after a verified payment', async () => {
    await createCompetition();
    mockOrders();
    const { token } = await createUser();

    const res = await register(token);
    expect(res.status).toBe(201);
    expect(res.body.payment).toMatchObject({ keyId: 'rzp_test_key', amount: 9900, currency: 'INR' });
    expect(await bookedCount()).toBe(1);

    const { orderId } = res.body.payment;
    const verify = await api()
      .post(`/api/v1/registrations/${res.body.registration.id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpay_order_id: orderId, razorpay_payment_id: 'pay_1', razorpay_signature: paymentSignature(orderId, 'pay_1') });

    expect(verify.status).toBe(200);
    expect(verify.body.registration.status).toBe('confirmed');
    expect(await bookedCount()).toBe(1);

    const again = await register(token);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('ALREADY_REGISTERED');
  });

  it('returns the same pending order when the user retries', async () => {
    await createCompetition();
    const orders = mockOrders();
    const { token } = await createUser();

    const first = await register(token);
    const second = await register(token);
    expect(second.body.payment.orderId).toBe(first.body.payment.orderId);
    expect(orders).toHaveBeenCalledTimes(1);
    expect(await bookedCount()).toBe(1);
  });

  it('rejects a forged payment signature', async () => {
    await createCompetition();
    mockOrders();
    const { token } = await createUser();
    const res = await register(token);

    const verify = await api()
      .post(`/api/v1/registrations/${res.body.registration.id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpay_order_id: res.body.payment.orderId, razorpay_payment_id: 'pay_1', razorpay_signature: 'forged' });

    expect(verify.status).toBe(400);
    expect(verify.body.error.code).toBe('INVALID_SIGNATURE');
  });

  it('never books more spots than the capacity under concurrent load', async () => {
    await createCompetition({ capacity: 20 });
    mockOrders();
    const users = await Promise.all(Array.from({ length: 50 }, (_, i) => createUser(`User ${i}`)));

    const results = await Promise.all(users.map(({ token }) => register(token)));
    const statuses = results.map((r) => r.status);

    expect(statuses.filter((s) => s === 201)).toHaveLength(20);
    expect(results.filter((r) => r.status === 409).every((r) => r.body.error.code === 'SOLD_OUT')).toBe(true);
    expect(await bookedCount()).toBe(20);
    expect(await RegistrationModel.countDocuments({ status: 'pending_payment' })).toBe(20);
  });

  it('allows only one active registration when the same user double taps', async () => {
    await createCompetition();
    mockOrders();
    const { token } = await createUser();

    await Promise.all(Array.from({ length: 5 }, () => register(token)));
    expect(await RegistrationModel.countDocuments({ status: 'pending_payment' })).toBe(1);
    expect(await bookedCount()).toBe(1);
  });

  it('refuses registration outside the window', async () => {
    const past = new Date(Date.now() - 60_000);
    await createCompetition({ 'schedule.registrationClosesAt': past });
    const { token } = await createUser();

    const res = await register(token);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('REGISTRATION_CLOSED');
  });

  it('releases the spot when the payment order cannot be created', async () => {
    await createCompetition();
    vi.spyOn(paymentGateway, 'createOrder').mockRejectedValue(new Error('gateway down'));
    const { token } = await createUser();

    const res = await register(token);
    expect(res.status).toBe(502);
    expect(await bookedCount()).toBe(0);
    expect(await RegistrationModel.countDocuments({ status: 'cancelled' })).toBe(1);
  });

  it('confirms free competitions immediately', async () => {
    await createCompetition({ entryFee: 0 });
    const { token } = await createUser();

    const res = await register(token);
    expect(res.status).toBe(200);
    expect(res.body.payment).toBeNull();
    expect(res.body.registration.status).toBe('confirmed');
  });
});

describe('expired holds and late payments', () => {
  async function pendingRegistration() {
    await createCompetition({ capacity: 1 });
    mockOrders();
    const { token } = await createUser();
    const res = await register(token);
    return res.body.payment.orderId as string;
  }

  it('releases expired holds exactly once', async () => {
    await pendingRegistration();
    const later = new Date(Date.now() + 11 * 60_000);

    const [a, b] = await Promise.all([releaseExpiredHolds(later), releaseExpiredHolds(later)]);
    expect(a + b).toBe(1);
    expect(await bookedCount()).toBe(0);
    expect(await RegistrationModel.countDocuments({ status: 'expired' })).toBe(1);
  });

  it('re-books a late payment when a spot is still free', async () => {
    const orderId = await pendingRegistration();
    await releaseExpiredHolds(new Date(Date.now() + 11 * 60_000));

    const reg = await confirmPayment(orderId, 'pay_late');
    expect(reg?.status).toBe('confirmed');
    expect(await bookedCount()).toBe(1);
  });

  it('flags a late payment for refund when the competition filled up meanwhile', async () => {
    const orderId = await pendingRegistration();
    await releaseExpiredHolds(new Date(Date.now() + 11 * 60_000));

    const { token } = await createUser('Someone else');
    expect((await register(token)).status).toBe(201);

    const reg = await confirmPayment(orderId, 'pay_late');
    expect(reg?.status).toBe('refund_due');
    expect(await bookedCount()).toBe(1);
  });

  it('handles duplicate webhooks idempotently', async () => {
    const orderId = await pendingRegistration();
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_hook', order_id: orderId } } },
    });

    for (let i = 0; i < 2; i++) {
      const res = await api()
        .post('/api/v1/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', webhookSignature(body))
        .send(body);
      expect(res.status).toBe(200);
    }

    const reg = await RegistrationModel.findOne({ razorpayOrderId: orderId });
    expect(reg?.status).toBe('confirmed');
    expect(reg?.razorpayPaymentId).toBe('pay_hook');
    expect(await bookedCount()).toBe(1);
  });

  it('rejects webhooks with a bad signature', async () => {
    const res = await api()
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'bad')
      .send('{"event":"payment.captured"}');
    expect(res.status).toBe(400);
  });
});
