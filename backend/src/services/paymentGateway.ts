import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, paymentsConfigured } from '../config/env';
import { AppError } from '../lib/errors';

export interface GatewayOrder {
  id: string;
  amount: number;
  currency: string;
}

let client: Razorpay | null = null;

function getClient() {
  if (!paymentsConfigured) {
    throw new AppError(503, 'PAYMENTS_UNAVAILABLE', 'Payments are not configured on this server');
  }
  client ??= new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return client;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function hmac(secret: string, payload: string | Buffer) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Exported as an object so tests can stub the network call without touching the rest.
export const paymentGateway = {
  assertConfigured() {
    getClient();
  },

  async createOrder(input: { amount: number; currency: string; receipt: string; notes: Record<string, string> }) {
    const order = await getClient().orders.create(input);
    return { id: order.id, amount: Number(order.amount), currency: order.currency } satisfies GatewayOrder;
  },

  isValidPaymentSignature(orderId: string, paymentId: string, signature: string) {
    if (!env.RAZORPAY_KEY_SECRET) return false;
    return safeEqual(hmac(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), signature);
  },

  isValidWebhookSignature(rawBody: Buffer, signature: string) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
    return safeEqual(hmac(env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature);
  },
};
