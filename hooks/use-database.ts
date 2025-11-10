// Real-time Data Hooks
// Automatically sync data across all dashboards

'use client'

import { useState, useEffect, useCallback } from 'react'
import { DatabaseService } from '@/lib/database'
import type { Shipment, Transporter, Supplier, Customer, Notification } from '@/lib/supabase'

// ==================== SHIPMENTS ====================

export function useShipments(filters?: {
  supplier_id?: string
  customer_id?: string
  transporter_id?: string
  status?: string
}) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch initial data
  useEffect(() => {
    let isMounted = true

    async function fetchShipments() {
      try {
        console.log('🔍 Fetching shipments with filters:', filters)
        const data = await DatabaseService.getShipments(filters)
        console.log('✅ Fetched shipments:', data?.length || 0, 'items')
        if (isMounted) {
          setShipments(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('❌ Error fetching shipments:', err)
        if (isMounted) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }

    fetchShipments()

    return () => {
      isMounted = false
    }
  }, [filters?.supplier_id, filters?.customer_id, filters?.transporter_id, filters?.status])

  // Subscribe to real-time changes
  useEffect(() => {
    console.log('🔌 Setting up real-time subscription for shipments')
    const unsubscribe = DatabaseService.subscribeToShipments(({ new: newShipment, old: oldShipment, eventType }) => {
      console.log('🔔 Real-time event received:', eventType, newShipment)
      setShipments(prev => {
        if (eventType === 'INSERT') {
          console.log('➕ Adding new shipment to state:', newShipment.shipment_id)
          // Add new shipment
          return [newShipment, ...prev]
        } else if (eventType === 'UPDATE') {
          console.log('🔄 Updating shipment in state:', newShipment.shipment_id)
          // Update existing shipment
          return prev.map(s => s.id === newShipment.id ? newShipment : s)
        } else if (eventType === 'DELETE') {
          console.log('🗑️ Removing shipment from state:', oldShipment.shipment_id)
          // Remove deleted shipment
          return prev.filter(s => s.id !== oldShipment.id)
        }
        return prev
      })
    }, filters)

    return () => {
      console.log('🔌 Cleaning up real-time subscription')
      unsubscribe()
    }
  }, [filters?.supplier_id, filters?.customer_id, filters?.transporter_id])

  // Helper functions
  const updateShipment = useCallback(async (id: string, updates: Partial<Shipment>) => {
    try {
      const updated = await DatabaseService.updateShipment(id, updates)
      // State will update automatically via subscription
      return updated
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  const createShipment = useCallback(async (shipment: Omit<Shipment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const created = await DatabaseService.createShipment(shipment)
      // State will update automatically via subscription
      return created
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  const deleteShipment = useCallback(async (id: string) => {
    try {
      await DatabaseService.deleteShipment(id)
      // State will update automatically via subscription
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  const updateLocation = useCallback(async (id: string, location: { lat: number, lng: number, address: string }) => {
    try {
      await DatabaseService.updateShipmentLocation(id, location)
      // State will update automatically via subscription
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  return {
    shipments,
    loading,
    error,
    updateShipment,
    createShipment,
    deleteShipment,
    updateLocation,
    refetch: async () => {
      setLoading(true)
      const data = await DatabaseService.getShipments(filters)
      setShipments(data)
      setLoading(false)
    }
  }
}

// ==================== SINGLE SHIPMENT ====================

export function useShipment(id: string) {
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchShipment() {
      try {
        const data = await DatabaseService.getShipment(id)
        if (isMounted) {
          setShipment(data)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }

    if (id) {
      fetchShipment()
    }

    return () => {
      isMounted = false
    }
  }, [id])

  // Subscribe to changes for this specific shipment
  useEffect(() => {
    if (!id) return

    const unsubscribe = DatabaseService.subscribeToShipments(({ new: newShipment, eventType }) => {
      if (newShipment.id === id && eventType === 'UPDATE') {
        setShipment(newShipment)
      } else if (eventType === 'DELETE' && newShipment.id === id) {
        setShipment(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [id])

  return { shipment, loading, error }
}

// ==================== TRANSPORTERS ====================

export function useTransporters(filters?: { available?: boolean, location?: string }) {
  const [transporters, setTransporters] = useState<Transporter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchTransporters() {
      try {
        const data = await DatabaseService.getTransporters(filters)
        if (isMounted) {
          setTransporters(data)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }

    fetchTransporters()

    return () => {
      isMounted = false
    }
  }, [filters?.available, filters?.location])

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubscribe = DatabaseService.subscribeToTransporters((payload) => {
      const eventType = payload.eventType
      const newData = payload.new as Transporter

      setTransporters(prev => {
        if (eventType === 'INSERT') {
          return [newData, ...prev]
        } else if (eventType === 'UPDATE') {
          return prev.map(t => t.id === newData.id ? newData : t)
        } else if (eventType === 'DELETE') {
          return prev.filter(t => t.id !== newData.id)
        }
        return prev
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return { transporters, loading, error }
}

// ==================== SUPPLIERS ====================

export function useSuppliers(filters?: { category?: string, verified?: boolean }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchSuppliers() {
      try {
        const data = await DatabaseService.getSuppliers(filters)
        if (isMounted) {
          setSuppliers(data)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }

    fetchSuppliers()

    return () => {
      isMounted = false
    }
  }, [filters?.category, filters?.verified])

  return { suppliers, loading, error }
}

// ==================== CUSTOMERS ====================

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchCustomers() {
      try {
        const data = await DatabaseService.getCustomers()
        if (isMounted) {
          setCustomers(data)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }

    fetchCustomers()

    return () => {
      isMounted = false
    }
  }, [])

  return { customers, loading, error }
}

// ==================== NOTIFICATIONS ====================

export function useNotifications(userId: string, unreadOnly = false) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch initial notifications
  useEffect(() => {
    let isMounted = true

    async function fetchNotifications() {
      try {
        const data = await DatabaseService.getNotifications(userId, unreadOnly)
        if (isMounted) {
          setNotifications(data)
          setUnreadCount(data.filter(n => !n.read).length)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }

    if (userId) {
      fetchNotifications()
    }

    return () => {
      isMounted = false
    }
  }, [userId, unreadOnly])

  // Subscribe to new notifications
  useEffect(() => {
    if (!userId) return

    const unsubscribe = DatabaseService.subscribeToNotifications(userId, (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          tag: notification.id
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [userId])

  // Helper functions
  const markAsRead = useCallback(async (id: string) => {
    try {
      await DatabaseService.markNotificationAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await DatabaseService.markAllNotificationsAsRead(userId)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(err as Error)
    }
  }, [userId])

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead
  }
}

// ==================== ANALYTICS ====================

export function useAnalytics(userId: string, role: string) {
  const { shipments, loading: shipmentsLoading } = useShipments(
    role === 'supplier' ? { supplier_id: userId } :
    role === 'customer' ? { customer_id: userId } :
    role === 'transporter' ? { transporter_id: userId } : {}
  )

  const analytics = {
    totalShipments: shipments.length,
    activeShipments: shipments.filter(s => s.status !== 'delivered' && s.status !== 'cancelled').length,
    completedShipments: shipments.filter(s => s.status === 'delivered').length,
    delayedShipments: shipments.filter(s => s.status === 'delayed').length,
    averageProgress: shipments.length > 0 
      ? Math.round(shipments.reduce((acc, s) => acc + s.progress, 0) / shipments.length)
      : 0,
    totalCarbon: shipments.reduce((acc, s) => acc + (s.carbon_footprint || 0), 0),
    totalCost: shipments.reduce((acc, s) => acc + (s.cost || 0), 0),
    onTimeRate: shipments.length > 0
      ? ((shipments.filter(s => s.status === 'delivered').length / shipments.length) * 100).toFixed(1) + '%'
      : '0%'
  }

  return {
    analytics,
    loading: shipmentsLoading
  }
}
