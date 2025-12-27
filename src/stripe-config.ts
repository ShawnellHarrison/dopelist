export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_Tg7xizH5vcClOw',
    priceId: 'price_1SilhYEjTiKwQHWzBAJk1rrN',
    name: 'Dopelist',
    description: 'Access to premium classified listings',
    price: 1.00,
    currency: 'usd',
    mode: 'payment'
  }
];

export function getProductById(id: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === id);
}

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}