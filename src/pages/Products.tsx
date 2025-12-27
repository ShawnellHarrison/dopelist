import React from 'react'
import { stripeProducts } from '../stripe-config'
import { ProductCard } from '../components/stripe/ProductCard'
import { SubscriptionStatus } from '../components/stripe/SubscriptionStatus'
import { useAuth } from '../lib/auth'

export function Products() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Products
          </h1>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your needs
          </p>
        </div>

        {user && (
          <div className="mb-12 max-w-2xl mx-auto">
            <SubscriptionStatus />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {stripeProducts.map((product) => (
            <ProductCard key={product.priceId} product={product} />
          ))}
        </div>

        {!user && (
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Sign in to purchase products and manage your subscriptions
            </p>
            <div className="space-x-4">
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Sign Up
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}