import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { STRIPE_PRODUCTS, StripeProduct } from '../stripe-config';
import { CreditCard, Loader2 } from 'lucide-react';

interface StripeCheckoutProps {
  product: StripeProduct;
  onSuccess?: () => void;
}

export function StripeCheckout({ product, onSuccess }: StripeCheckoutProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      alert('Please sign in to continue');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: product.priceId,
          mode: product.mode,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: window.location.href,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
        <div className="text-2xl font-bold text-green-600">
          ${product.price.toFixed(2)}
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">{product.description}</p>
      
      <button
        onClick={handleCheckout}
        disabled={loading || !user}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Purchase Now
          </>
        )}
      </button>
      
      {!user && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Please sign in to purchase
        </p>
      )}
    </div>
  );
}