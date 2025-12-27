import React from 'react'
import { useSubscription } from '../../hooks/useSubscription'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

export function SubscriptionStatus() {
  const { subscription, loading, isActive, planName } = useSubscription()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-700">No Active Plan</p>
            <p className="text-sm text-gray-500">You don't have an active subscription</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (subscription.subscription_status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'trialing':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'past_due':
      case 'unpaid':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'canceled':
        return <XCircle className="w-5 h-5 text-gray-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (subscription.subscription_status) {
      case 'active':
        return 'bg-green-50 border-green-200'
      case 'trialing':
        return 'bg-blue-50 border-blue-200'
      case 'past_due':
      case 'unpaid':
        return 'bg-red-50 border-red-200'
      case 'canceled':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className={`rounded-lg p-4 border ${getStatusColor()}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">
              {planName || 'Subscription Plan'}
            </p>
            <span className="text-sm font-medium text-gray-600">
              {formatStatus(subscription.subscription_status || 'unknown')}
            </span>
          </div>
          
          {subscription.current_period_end && (
            <p className="text-sm text-gray-500">
              {subscription.subscription_status === 'active' ? 'Renews' : 'Expires'} on{' '}
              {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
            </p>
          )}
          
          {subscription.payment_method_brand && subscription.payment_method_last4 && (
            <p className="text-sm text-gray-500">
              {subscription.payment_method_brand.toUpperCase()} ending in {subscription.payment_method_last4}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}