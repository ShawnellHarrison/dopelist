import React, { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { getProductByPriceId } from '../../stripe-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'

interface SubscriptionData {
  subscription_status: string
  price_id: string | null
  current_period_end: number | null
  cancel_at_period_end: boolean | null
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchSubscription()
  }, [user])

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
        .maybeSingle()

      if (error) {
        throw error
      }

      setSubscription(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading subscription status...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load subscription status: {error}</AlertDescription>
      </Alert>
    )
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription. Browse our products to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null
  const isActive = subscription.subscription_status === 'active'
  const periodEnd = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
        <CardDescription>
          Your current subscription details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <strong>Plan:</strong> {product?.name || 'Unknown Plan'}
        </div>
        <div>
          <strong>Status:</strong> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {subscription.subscription_status}
          </span>
        </div>
        {periodEnd && (
          <div>
            <strong>
              {subscription.cancel_at_period_end ? 'Expires on:' : 'Renews on:'}
            </strong> {periodEnd}
          </div>
        )}
        {subscription.cancel_at_period_end && (
          <Alert>
            <AlertDescription>
              Your subscription will not renew and will end on {periodEnd}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}