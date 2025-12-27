export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SilhYEjTiKwQHWzBAJk1rrN',
    name: 'Dopelist',
    description: 'Access to premium features and enhanced listings',
    mode: 'payment',
    price: 1.00,
    currency: 'usd'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};