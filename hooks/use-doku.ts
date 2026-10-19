import { useState } from 'react';
import { apiRequest } from '@/lib/api';

type DokuEnvironment = 'dev' | 'prod';
type CheckoutSession = {
  tableId: string;
  startsAt: string;
  durationHours: number;
};
type CheckoutRequest = {
  outletId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  sessions: CheckoutSession[];
};
type CheckoutResponse = {
  reference: string;
  checkoutUrl: string;
  expiresAt: string;
};

function useDokuCheckout(environment: DokuEnvironment) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createCheckout(input: CheckoutRequest) {
    setLoading(true);
    setError('');
    try {
      const checkout = await apiRequest<CheckoutResponse>(
        `/payments/doku/${environment}/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
      window.location.assign(checkout.checkoutUrl);
      return checkout;
    } catch (cause) {
      const message = cause instanceof Error
        ? cause.message
        : 'Unable to start payment. Please try again.';
      setError(message);
      setLoading(false);
      return null;
    }
  }

  return { createCheckout, loading, error };
}

/** Starts DOKU Checkout against the merchant sandbox credentials. */
export function useDOKUDev() {
  return useDokuCheckout('dev');
}

/** Starts DOKU Checkout against the merchant production credentials. */
export function useDOKUProd() {
  return useDokuCheckout('prod');
}

/** Selects DOKU's sandbox by default; production requires an explicit public env setting. */
export function useDOKU() {
  const dev = useDOKUDev();
  const prod = useDOKUProd();
  return process.env.NEXT_PUBLIC_DOKU_ENV === 'prod' ? prod : dev;
}
