import React, { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { StripeProduct } from '../../stripe-config'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'

interface ProductCardProps {
  product: StripeProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { session } = useAuth()

  const handlePurchase = async () => {
    if (!session) {
      setError('Please sign in to make a purchase')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/products`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">
          {formatPrice(product.price, product.currency)}
          {product.mode === 'subscription' && <span className="text-lg font-normal">/month</span>}
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handlePurchase} 
          disabled={loading || !session}
          className="w-full"
        >
          {loading ? 'Processing...' : `Purchase ${product.name}`}
        </Button>
        
        {!session && (
          <p className="text-sm text-gray-600 text-center">
            Please sign in to make a purchase
          </p>
        )}
      </CardContent>
    </Card>
  )
}