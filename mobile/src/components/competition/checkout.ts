import type { PaymentOrder, RazorpaySuccess } from '@/api/types';

export type CheckoutResult =
  | { type: 'success'; payload: RazorpaySuccess }
  | { type: 'failed'; message: string }
  | { type: 'dismissed' }
  | { type: 'error'; message: string };

export function checkoutUrl(order: PaymentOrder, prefill: { name?: string; email?: string }, description: string) {
  const params = new URLSearchParams({
    key: order.keyId,
    order_id: order.orderId,
    amount: String(order.amount),
    currency: order.currency,
    description,
    name: prefill.name ?? '',
    email: prefill.email ?? '',
  });
  return `${order.checkoutUrl}?${params.toString()}`;
}

export function parseCheckoutMessage(data: string): CheckoutResult | null {
  try {
    const message = JSON.parse(data) as CheckoutResult;
    return message && typeof message.type === 'string' ? message : null;
  } catch {
    return null;
  }
}
