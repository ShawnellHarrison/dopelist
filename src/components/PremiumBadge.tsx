import React from 'react';
import { Crown } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

export function PremiumBadge() {
  const { hasPremiumAccess, loading } = useStripe();

  if (loading || !hasPremiumAccess) {
    return null;
  }

  return (
    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <Crown className="w-3 h-3 mr-1" />
      Premium
    </div>
  );
}