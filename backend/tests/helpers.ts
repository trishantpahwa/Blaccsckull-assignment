import crypto from 'node:crypto';
import request from 'supertest';
import { vi } from 'vitest';
import { createApp } from '../src/app';
import { signToken } from '../src/lib/auth';
import { CompetitionModel } from '../src/models/Competition';
import { UserModel } from '../src/models/User';
import { paymentGateway } from '../src/services/paymentGateway';

export const app = createApp();
export const api = () => request(app);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export async function createCompetition(overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return CompetitionModel.create({
    slug: 'test-dance',
    title: { en: 'Test Dance', hi: 'टेस्ट नृत्य' },
    category: { en: 'Dance' },
    prizePool: 150000,
    entryFee: 9900,
    capacity: 20,
    judge: { name: 'Judge', title: { en: 'Kathak Dancer' }, experienceYears: 12 },
    schedule: {
      registrationOpensAt: new Date(now - DAY),
      registrationClosesAt: new Date(now + DAY),
      submissionStartsAt: new Date(now - HOUR),
      submissionEndsAt: new Date(now + 10 * DAY),
      resultAt: new Date(now + 12 * DAY),
    },
    about: { en: 'About', hi: 'परिचय' },
    rewards: [{ position: 1, amount: 55000 }],
    status: 'published',
    ...overrides,
  });
}

let userCounter = 0;

export async function createUser(name = 'Test User') {
  userCounter++;
  const user = await UserModel.create({
    name,
    email: `user${userCounter}-${crypto.randomUUID()}@example.com`,
    passwordHash: 'x',
    referralCode: `CODE${userCounter}${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
  });
  return { user, token: signToken(user._id.toString()) };
}

export function mockOrders() {
  return vi.spyOn(paymentGateway, 'createOrder').mockImplementation(async (input) => ({
    id: `order_${crypto.randomBytes(8).toString('hex')}`,
    amount: input.amount,
    currency: input.currency,
  }));
}

export function paymentSignature(orderId: string, paymentId: string) {
  return crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest('hex');
}

export function webhookSignature(body: string) {
  return crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!).update(body).digest('hex');
}
