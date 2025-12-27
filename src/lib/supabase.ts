import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          user_id: string
          city_id: string
          category_id: string
          title: string
          description: string
          price: string | null
          contact_email: string | null
          stripe_payment_id: string
          votes: number | null
          created_at: string | null
          expires_at: string
          location: string
          images: string[] | null
          reactions: any | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          city_id: string
          category_id: string
          title: string
          description: string
          price?: string | null
          contact_email?: string | null
          stripe_payment_id: string
          votes?: number | null
          created_at?: string | null
          expires_at: string
          location?: string
          images?: string[] | null
          reactions?: any | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          city_id?: string
          category_id?: string
          title?: string
          description?: string
          price?: string | null
          contact_email?: string | null
          stripe_payment_id?: string
          votes?: number | null
          created_at?: string | null
          expires_at?: string
          location?: string
          images?: string[] | null
          reactions?: any | null
          is_active?: boolean | null
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          slug: string
          type: string
          parent_id: string | null
          craigslist_supported: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: string
          parent_id?: string | null
          craigslist_supported?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: string
          parent_id?: string | null
          craigslist_supported?: boolean | null
          created_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          section: string
          name: string
          slug: string
          icon: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          section: string
          name: string
          slug: string
          icon?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          section?: string
          name?: string
          slug?: string
          icon?: string | null
          created_at?: string | null
        }
      }
      stripe_customers: {
        Row: {
          id: number
          user_id: string
          customer_id: string
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          user_id: string
          customer_id: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          user_id?: string
          customer_id?: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      stripe_subscriptions: {
        Row: {
          id: number
          customer_id: string
          subscription_id: string | null
          price_id: string | null
          current_period_start: number | null
          current_period_end: number | null
          cancel_at_period_end: boolean | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          customer_id: string
          subscription_id?: string | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          customer_id?: string
          subscription_id?: string | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          status?: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      stripe_orders: {
        Row: {
          id: number
          checkout_session_id: string
          payment_intent_id: string
          customer_id: string
          amount_subtotal: number
          amount_total: number
          currency: string
          payment_status: string
          status: 'pending' | 'completed' | 'canceled'
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          checkout_session_id: string
          payment_intent_id: string
          customer_id: string
          amount_subtotal: number
          amount_total: number
          currency: string
          payment_status: string
          status?: 'pending' | 'completed' | 'canceled'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          checkout_session_id?: string
          payment_intent_id?: string
          customer_id?: string
          amount_subtotal?: number
          amount_total?: number
          currency?: string
          payment_status?: string
          status?: 'pending' | 'completed' | 'canceled'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
    }
    Views: {
      stripe_user_subscriptions: {
        Row: {
          customer_id: string | null
          subscription_id: string | null
          subscription_status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | null
          price_id: string | null
          current_period_start: number | null
          current_period_end: number | null
          cancel_at_period_end: boolean | null
          payment_method_brand: string | null
          payment_method_last4: string | null
        }
      }
      stripe_user_orders: {
        Row: {
          customer_id: string | null
          order_id: number | null
          checkout_session_id: string | null
          payment_intent_id: string | null
          amount_subtotal: number | null
          amount_total: number | null
          currency: string | null
          payment_status: string | null
          order_status: 'pending' | 'completed' | 'canceled' | null
          order_date: string | null
        }
      }
    }
  }
}