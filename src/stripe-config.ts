export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SilhYEjTiKwQHWzBAJk1rrN',
    name: 'Dopelist',
    description: 'Premium classified ad posting',
    mode: 'payment',
  },
];