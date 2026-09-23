import { useEffect, useRef } from 'react';
import type { PaymentOrder, RazorpaySuccess } from '@/api/types';
import type { CheckoutResult } from './checkout';

interface Props {
  order: PaymentOrder | null;
  prefill: { name?: string; email?: string };
  description: string;
  onResult: (result: CheckoutResult) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (response: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay checkout failed to load'));
    document.body.appendChild(script);
  });
}

// On web the checkout script can run in the page directly, no WebView needed.
export function PaymentSheet({ order, prefill, description, onResult }: Props) {
  // Keep the latest props in a ref so the checkout only opens once per order.
  const latest = useRef({ prefill, description, onResult });
  useEffect(() => {
    latest.current = { prefill, description, onResult };
  });

  useEffect(() => {
    if (!order) return;
    let settled = false;
    const finish = (result: CheckoutResult) => {
      if (settled) return;
      settled = true;
      latest.current.onResult(result);
    };

    loadScript()
      .then(() => {
        const rzp = new window.Razorpay!({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: 'Feedants',
          description: latest.current.description,
          prefill: latest.current.prefill,
          theme: { color: '#03717B' },
          handler: (payload: RazorpaySuccess) => finish({ type: 'success', payload }),
          modal: { ondismiss: () => finish({ type: 'dismissed' }) },
        });
        rzp.on('payment.failed', (response) => finish({ type: 'failed', message: response.error?.description ?? 'Payment failed' }));
        rzp.open();
      })
      .catch((err: Error) => finish({ type: 'error', message: err.message }));
  }, [order]);

  return null;
}
