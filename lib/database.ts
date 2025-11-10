// Real-time Database Service
// Handles all CRUD operations with automatic sync across dashboards

import { supabase } from './supabase'
import type { Shipment, User, Transporter, Supplier, Customer, Notification } from './supabase'
import { notifyShipmentUpdate } from './telegram-notifications'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export class DatabaseService {
  // ==================== AUTHENTICATION ====================
  
  // Create new user account with email verification
  static async createUser(userData: {
    email: string
    password: string
    name: string
    role: 'supplier' | 'transporter' | 'customer'
    company_name?: string
    phone?: string
  }) {
    try {
      // 1. Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        return { success: false, error: 'Email already registered' }
      }

      // 2. Hash password
      const saltRounds = 10
      const password_hash = await bcrypt.hash(userData.password, saltRounds)

      // 3. Generate verification token
      const verification_token = crypto.randomBytes(32).toString('hex')
      const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

      // 4. Create user in users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          password_hash,
          name: userData.name,
          role: userData.role,
          company_name: userData.company_name,
          phone: userData.phone,
          email_verified: false,
          verification_token,
          verification_token_expires,
          notification_preferences: {
            email: true,
            sms: false,
            push: true,
            telegram: false
          }
        }])
        .select()
        .single()
      
      if (userError) throw userError
      
      // 5. Create role-specific record
      if (userData.role === 'supplier') {
        await supabase.from('suppliers').insert([{
          user_id: user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          category: 'General',
          location: '',
          rating: 5.0,
          products_offered: [],
          verified: false,
          active_deals: 0
        }])
      } else if (userData.role === 'transporter') {
        await supabase.from('transporters').insert([{
          user_id: user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          location: '',
          rating: 5.0,
          vehicle_types: [],
          available: true,
          active_shipments: 0,
          total_deliveries: 0,
          on_time_rate: 100,
          vehicles: []
        }])
      } else if (userData.role === 'customer') {
        await supabase.from('customers').insert([{
          user_id: user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          company_name: userData.company_name || userData.name,
          location: '',
          active_orders: 0,
          total_orders: 0
        }])
      }

      // 6. Send verification email via API route
      try {
        const response = await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            name: userData.name,
            token: verification_token
          })
        })
        
        if (response.ok) {
          console.log('✅ Verification email sent to:', userData.email)
        } else {
          console.error('⚠️ Failed to send verification email')
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send verification email:', emailError)
        // Don't fail user creation if email fails
      }
      
      console.log('✅ User created successfully:', user)
      return { 
        success: true, 
        user: user as User,
        message: 'Account created! Please check your email to verify your account.'
      }
    } catch (error: any) {
      console.error('❌ Error creating user:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Login user with password validation
  static async loginUser(email: string, password: string) {
    try {
      // 1. Get user by email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      
      if (error || !user) {
        return { success: false, error: 'Invalid email or password' }
      }

      // 2. Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash)
      
      if (!passwordMatch) {
        return { success: false, error: 'Invalid email or password' }
      }

      // 3. Check if email is verified
      if (!user.email_verified) {
        return { 
          success: false, 
          error: 'Please verify your email before signing in. Check your inbox for the verification link.',
          needsVerification: true
        }
      }
      
      console.log('✅ User logged in successfully:', email)
      return { success: true, user: user as User }
    } catch (error: any) {
      console.error('❌ Error logging in:', error)
      return { success: false, error: 'An error occurred during login' }
    }
  }

  // Verify email with token
  static async verifyEmail(token: string) {
    try {
      // 1. Find user with this token
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('verification_token', token)
        .single()

      if (error || !user) {
        return { success: false, error: 'Invalid verification link' }
      }

      // 2. Check if token is expired
      if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
        return { success: false, error: 'Verification link has expired. Please request a new one.' }
      }

      // 3. Update user as verified
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email_verified: true,
          verification_token: null,
          verification_token_expires: null
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      console.log('✅ Email verified for:', user.email)
      return { success: true, message: 'Email verified successfully! You can now sign in.' }
    } catch (error: any) {
      console.error('❌ Error verifying email:', error)
      return { success: false, error: 'An error occurred during verification' }
    }
  }

  // Resend verification email
  static async resendVerificationEmail(email: string) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !user) {
        return { success: false, error: 'User not found' }
      }

      if (user.email_verified) {
        return { success: false, error: 'Email already verified' }
      }

      // Generate new token
      const verification_token = crypto.randomBytes(32).toString('hex')
      const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      // Update user with new token
      await supabase
        .from('users')
        .update({
          verification_token,
          verification_token_expires
        })
        .eq('id', user.id)

      // Send email via API route
      try {
        const response = await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            token: verification_token
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to send email')
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send verification email:', emailError)
        return { success: false, error: 'Failed to send verification email' }
      }

      return { success: true, message: 'Verification email sent! Please check your inbox.' }
    } catch (error: any) {
      console.error('❌ Error resending verification:', error)
      return { success: false, error: 'Failed to send verification email' }
    }
  }
  
  // ==================== SHIPMENTS ====================
  
  // Get all shipments (with filters)
  static async getShipments(filters?: {
    supplier_id?: string
    customer_id?: string
    transporter_id?: string
    status?: string
  }) {
    let query = supabase.from('shipments').select('*')
    
    if (filters?.supplier_id) query = query.eq('supplier_id', filters.supplier_id)
    if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id)
    if (filters?.transporter_id) query = query.eq('transporter_id', filters.transporter_id)
    if (filters?.status) query = query.eq('status', filters.status)
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Shipment[]
  }
  
  // Get single shipment
  static async getShipment(id: string) {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Shipment
  }
  
  // Get shipment by display ID (SH001, etc)
  static async getShipmentByDisplayId(shipmentId: string) {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('shipment_id', shipmentId)
      .single()
    
    if (error) throw error
    return data as Shipment
  }
  
  // Create new shipment
  static async createShipment(shipment: Omit<Shipment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('shipments')
      .insert([shipment])
      .select()
      .single()
    
    if (error) throw error
    
    // Notify all parties via Telegram
    await this.notifyNewShipment(data as Shipment)
    
    return data as Shipment
  }
  
  // Update shipment
  static async updateShipment(id: string, updates: Partial<Shipment>) {
    const { data, error } = await supabase
      .from('shipments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Notify about status change
    if (updates.status || updates.progress || updates.current_location) {
      await this.notifyShipmentChange(data as Shipment, updates)
    }
    
    return data as Shipment
  }
  
  // Update shipment location (for real-time tracking)
  static async updateShipmentLocation(id: string, location: { lat: number, lng: number, address: string }) {
    const { data, error } = await supabase
      .from('shipments')
      .update({
        current_location: location,
        last_location_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Shipment
  }
  
  // Delete shipment
  static async deleteShipment(id: string) {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
  
  // Subscribe to shipment changes (real-time)
  static subscribeToShipments(
    callback: (payload: { new: Shipment, old: Shipment, eventType: string }) => void,
    filters?: { supplier_id?: string, customer_id?: string, transporter_id?: string }
  ) {
    let channel = supabase
      .channel('shipments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shipments',
      }, (payload: any) => {
        // Filter on client side if needed
        const newData = payload.new as Shipment
        const oldData = payload.old as Shipment
        
        let shouldNotify = true
        
        if (filters?.supplier_id && newData?.supplier_id !== filters.supplier_id) {
          shouldNotify = false
        }
        if (filters?.customer_id && newData?.customer_id !== filters.customer_id) {
          shouldNotify = false
        }
        if (filters?.transporter_id && newData?.transporter_id !== filters.transporter_id) {
          shouldNotify = false
        }
        
        if (shouldNotify) {
          callback({
            new: newData,
            old: oldData,
            eventType: payload.eventType
          })
        }
      })
      .subscribe()
    
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel)
    }
  }
  
  // ==================== USERS ====================
  
  static async getUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as User
  }
  
  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) throw error
    return data as User
  }
  
  static async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as User
  }
  
  static async linkTelegramAccount(userId: string, telegramId: number, telegramUsername?: string) {
    return this.updateUser(userId, {
      telegram_id: telegramId,
      telegram_username: telegramUsername,
      telegram_linked_at: new Date().toISOString()
    })
  }
  
  // ==================== TRANSPORTERS ====================
  
  static async getTransporters(filters?: { available?: boolean, location?: string }) {
    let query = supabase.from('transporters').select('*')
    
    if (filters?.available !== undefined) {
      query = query.eq('available', filters.available)
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    
    const { data, error } = await query.order('rating', { ascending: false })
    
    if (error) throw error
    return data as Transporter[]
  }
  
  static async getTransporter(id: string) {
    const { data, error } = await supabase
      .from('transporters')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Transporter
  }
  
  static async updateTransporter(id: string, updates: Partial<Transporter>) {
    const { data, error } = await supabase
      .from('transporters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Transporter
  }
  
  // Subscribe to transporter changes
  static subscribeToTransporters(callback: (payload: any) => void) {
    const channel = supabase
      .channel('transporters-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transporters',
      }, callback)
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }
  
  // ==================== SUPPLIERS ====================
  
  static async getSuppliers(filters?: { category?: string, verified?: boolean }) {
    let query = supabase.from('suppliers').select('*')
    
    if (filters?.category) {
      query = query.ilike('category', `%${filters.category}%`)
    }
    if (filters?.verified !== undefined) {
      query = query.eq('verified', filters.verified)
    }
    
    const { data, error } = await query.order('rating', { ascending: false })
    
    if (error) throw error
    return data as Supplier[]
  }
  
  // ==================== CUSTOMERS ====================
  
  static async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data as Customer[]
  }
  
  // ==================== NOTIFICATIONS ====================
  
  static async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single()
    
    if (error) throw error
    return data as Notification
  }
  
  static async getNotifications(userId: string, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
    
    if (unreadOnly) {
      query = query.eq('read', false)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false }).limit(50)
    
    if (error) throw error
    return data as Notification[]
  }
  
  static async markNotificationAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    
    if (error) throw error
  }
  
  static async markAllNotificationsAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    
    if (error) throw error
  }
  
  // Subscribe to notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload: any) => {
        callback(payload.new as Notification)
      })
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }
  
  // ==================== HELPER FUNCTIONS ====================
  
  private static async notifyNewShipment(shipment: Shipment) {
    try {
      // Get user_id from supplier record
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('user_id')
        .eq('id', shipment.supplier_id)
        .single()
      
      if (supplier?.user_id) {
        await this.createNotification({
          user_id: supplier.user_id,
          type: 'shipment_update',
          title: 'New Shipment Created',
          message: `Shipment ${shipment.shipment_id} has been created successfully.`,
          data: { shipment_id: shipment.id },
          read: false
        })
      }
      
      // Get user_id from customer record
      const { data: customer } = await supabase
        .from('customers')
        .select('user_id')
        .eq('id', shipment.customer_id)
        .single()
      
      if (customer?.user_id) {
        await this.createNotification({
          user_id: customer.user_id,
          type: 'shipment_update',
          title: 'Order Confirmed',
          message: `Your order ${shipment.shipment_id} is being prepared.`,
          data: { shipment_id: shipment.id },
          read: false
        })
      }
      
      // Send Telegram notification if linked
      await notifyShipmentUpdate({
        id: shipment.id,
        origin: shipment.from_location,
        destination: shipment.to_location,
        status: shipment.status as 'pending' | 'in-transit' | 'delivered' | 'delayed',
        progress: shipment.progress
      }, 'created')
    } catch (error) {
      console.error('Error sending notifications:', error)
      // Don't fail shipment creation if notifications fail
    }
  }
  
  private static async notifyShipmentChange(shipment: Shipment, changes: Partial<Shipment>) {
    try {
      let message = ''
      if (changes.status) {
        message = `Shipment ${shipment.shipment_id} status changed to ${changes.status}`
      } else if (changes.progress) {
        message = `Shipment ${shipment.shipment_id} progress updated to ${changes.progress}%`
      } else if (changes.current_location) {
        message = `Shipment ${shipment.shipment_id} location updated`
      }
      
      // Get user_ids from supplier, customer, and transporter records
      const userIds: string[] = []
      
      // Get supplier's user_id
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('user_id')
        .eq('id', shipment.supplier_id)
        .single()
      if (supplier?.user_id) userIds.push(supplier.user_id)
      
      // Get customer's user_id
      const { data: customer } = await supabase
        .from('customers')
        .select('user_id')
        .eq('id', shipment.customer_id)
        .single()
      if (customer?.user_id) userIds.push(customer.user_id)
      
      // Get transporter's user_id if assigned
      if (shipment.transporter_id) {
        const { data: transporter } = await supabase
          .from('transporters')
          .select('user_id')
          .eq('id', shipment.transporter_id)
          .single()
        if (transporter?.user_id) userIds.push(transporter.user_id)
      }
      
      // Create notifications for all parties
      for (const userId of userIds) {
        await this.createNotification({
          user_id: userId,
          type: 'shipment_update',
          title: 'Shipment Update',
          message,
          data: { shipment_id: shipment.id },
          read: false
        })
      }
      
      // Send Telegram notifications
      await notifyShipmentUpdate({
        id: shipment.id,
        origin: shipment.from_location,
        destination: shipment.to_location,
        status: shipment.status as 'pending' | 'in-transit' | 'delivered' | 'delayed',
        progress: shipment.progress,
        currentLocation: shipment.current_location?.address
      }, changes.status ? 'status_changed' : 'location_updated')
    } catch (error) {
      console.error('Error sending change notifications:', error)
      // Don't fail shipment update if notifications fail
    }
  }
}
