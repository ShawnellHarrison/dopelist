import React from 'react';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { StripeCheckout } from '../components/StripeCheckout';
import { Check, Star } from 'lucide-react';

export function Pricing() {
  const product = STRIPE_PRODUCTS[0]; // Dopelist product

  const features = [
    'Enhanced visibility in search results',
    'Priority placement in category listings',
    'Extended listing duration (30 days)',
    'Multiple image uploads (up to 10)',
    'Contact form integration',
    'Social media sharing tools',
    'Analytics and view tracking',
    'Customer support priority'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Boost Your Listings
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get maximum exposure for your classified ads with our premium features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Features List */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <Star className="w-6 h-6 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Premium Features</h2>
            </div>
            
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Why Choose Premium?</h3>
              <p className="text-blue-800 text-sm">
                Premium listings receive 5x more views and sell 3x faster than standard listings. 
                Invest in your success today!
              </p>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="sticky top-8">
            <StripeCheckout product={product} />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-2">
                Secure payment powered by Stripe
              </p>
              <div className="flex justify-center items-center space-x-4 text-xs text-gray-400">
                <span>🔒 SSL Encrypted</span>
                <span>💳 All Cards Accepted</span>
                <span>⚡ Instant Activation</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How long does my premium listing last?</h3>
              <p className="text-gray-600 text-sm">Premium listings are active for 30 days from the date of purchase.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I upgrade an existing listing?</h3>
              <p className="text-gray-600 text-sm">Yes, you can upgrade any active listing to premium at any time.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">We accept all major credit cards, debit cards, and digital wallets through Stripe.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a refund policy?</h3>
              <p className="text-gray-600 text-sm">We offer a 7-day money-back guarantee if you're not satisfied with the results.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}