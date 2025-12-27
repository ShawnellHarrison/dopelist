import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface UserSubscription {
  customer_id: string;
  subscription_id: string;
  subscription_status: string;
  price_id: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand: string;
  payment_method_last4: string;
}

interface UserOrder {
  customer_id: string;
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export function useStripe() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setOrders([]);
      setLoading(false);
      return;
    }

    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch subscription data
      const { data: subscriptionData } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .single();

      if (subscriptionData) {
        setSubscription(subscriptionData);
      }

      // Fetch orders data
      const { data: ordersData } = await supabase
        .from('stripe_user_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (ordersData) {
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching Stripe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveSubscription = subscription?.subscription_status === 'active';
  const hasPremiumAccess = hasActiveSubscription || orders.some(order => 
    order.payment_status === 'paid' && order.order_status === 'completed'
  );

  return {
    subscription,
    orders,
    loading,
    hasActiveSubscription,
    hasPremiumAccess,
    refetch: fetchUserData
  };
}