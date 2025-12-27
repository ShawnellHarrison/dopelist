import React from 'react'
import { stripeProducts } from '../stripe-config'
import { ProductCard } from '../components/stripe/ProductCard'
import { SubscriptionStatus } from '../components/stripe/SubscriptionStatus'
import { useAuth } from '../hooks/useAuth'
import { ShoppingBag } from 'lucide-react'

export function ProductsPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <ShoppingBag className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Products
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our selection of premium products and services
          </p>
        </div>

        {user && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Subscription</h2>
            <SubscriptionStatus />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stripeProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {stripeProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}