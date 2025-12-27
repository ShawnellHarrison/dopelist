import React, { useEffect, useState } from 'react';
import { getUserSubscription } from '../../lib/stripe';
import { useAuth } from '../auth/AuthProvider';
import { Crown, Calendar, CreditCard } from 'lucide-react';

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export function SubscriptionStatus() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const data = await getUserSubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return null;
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Crown className="w-5 h-5" />
          <span>No active subscription</span>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'trialing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'past_due':
      case 'unpaid':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'canceled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(subscription.subscription_status)}`}>
      <div className="flex items-center gap-2 mb-2">
        <Crown className="w-5 h-5" />
        <span className="font-medium capitalize">
          {subscription.subscription_status.replace('_', ' ')} Subscription
        </span>
      </div>
      
      {subscription.current_period_end && (
        <div className="flex items-center gap-2 text-sm mb-2">
          <Calendar className="w-4 h-4" />
          <span>
            {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
            {formatDate(subscription.current_period_end)}
          </span>
        </div>
      )}

      {subscription.payment_method_brand && subscription.payment_method_last4 && (
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4" />
          <span>
            {subscription.payment_method_brand.toUpperCase()} ending in {subscription.payment_method_last4}
          </span>
        </div>
      )}
    </div>
  );
}