// Supabase Client Configuration
// Real-time database with instant sync across all dashboards

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug: Check if env vars are loaded
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase Config:', {
    url: supabaseUrl ? '✅ Loaded' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Loaded' : '❌ Missing',
    urlValue: supabaseUrl.substring(0, 30) + '...',
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database Types
export interface Database {
  public: {
    Tables: {
      shipments: {
        Row: Shipment
        Insert: Omit<Shipment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Shipment, 'id'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at'>
        Update: Partial<Omit<User, 'id'>>
      }
      transporters: {
        Row: Transporter
        Insert: Omit<Transporter, 'id' | 'created_at'>
        Update: Partial<Omit<Transporter, 'id'>>
      }
      suppliers: {
        Row: Supplier
        Insert: Omit<Supplier, 'id' | 'created_at'>
        Update: Partial<Omit<Supplier, 'id'>>
      }
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id' | 'created_at'>
        Update: Partial<Omit<Customer, 'id'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id'>>
      }
    }
  }
}

// Type Definitions
export interface Shipment {
  id: string
  shipment_id: string // Display ID like SH001
  supplier_id: string
  customer_id: string
  transporter_id: string | null
  from_location: string
  to_location: string
  status: 'preparing' | 'dispatched' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled'
  progress: number // 0-100
  eta: string
  actual_delivery?: string
  cargo_type: string
  weight: string
  vehicle_type: string
  cost: number
  carbon_footprint: number
  current_location?: {
    lat: number
    lng: number
    address: string
  }
  route?: {
    lat: number
    lng: number
  }[]
  notes?: string
  created_at: string
  updated_at: string
  last_location_update?: string
}

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  role: 'supplier' | 'transporter' | 'customer' | 'admin'
  company_name?: string
  phone?: string
  email_verified: boolean
  verification_token?: string
  verification_token_expires?: string
  telegram_id?: number
  telegram_username?: string
  telegram_linked_at?: string
  notification_preferences: {
    email: boolean
    sms: boolean
    push: boolean
    telegram: boolean
  }
  created_at: string
  updated_at: string
}

export interface Transporter {
  id: string
  name: string
  rating: number
  vehicle_types: string[]
  location: string
  available: boolean
  active_shipments: number
  total_deliveries: number
  on_time_rate: number
  phone: string
  email: string
  vehicles: {
    id: string
    type: string
    registration: string
    status: 'available' | 'busy' | 'maintenance'
  }[]
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  category: string
  location: string
  rating: number
  products_offered: string[]
  verified: boolean
  active_deals: number
  phone: string
  email: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  company_name: string
  location: string
  active_orders: number
  total_orders: number
  phone: string
  email: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'shipment_update' | 'delivery' | 'disruption' | 'payment' | 'general'
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

// Helper function to get typed Supabase client
export function getSupabaseClient() {
  return supabase as any // Type assertion for now
}
