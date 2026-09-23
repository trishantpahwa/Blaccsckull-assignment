import express, { Router } from 'express';
import { badRequest } from '../lib/errors';
import { logger } from '../lib/logger';
import { paymentGateway } from '../services/paymentGateway';
import { confirmPayment } from '../services/registrations';

interface RazorpayWebhook {
  event: string;
  payload?: { payment?: { entity?: { id: string; order_id: string } } };
}

export const webhooksRouter = Router();

// Signature is computed over the exact bytes Razorpay sent, so this route needs the raw body.
webhooksRouter.post('/razorpay', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  const signature = req.header('x-razorpay-signature') ?? '';
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!paymentGateway.isValidWebhookSignature(raw, signature)) {
    throw badRequest('INVALID_SIGNATURE', 'Invalid webhook signature');
  }

  const event = JSON.parse(raw.toString('utf8')) as RazorpayWebhook;
  const payment = event.payload?.payment?.entity;

  if ((event.event === 'payment.captured' || event.event === 'order.paid') && payment?.order_id) {
    try {
      await confirmPayment(payment.order_id, payment.id);
    } catch (err) {
      // Orders created outside this app would land here; acknowledge so Razorpay stops retrying.
      logger.warn({ err, orderId: payment.order_id }, 'Webhook for unknown order');
    }
  }
  res.json({ ok: true });
});
