-- FlexMove Database Schema
-- PostgreSQL / Supabase
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location data (optional)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==================== USERS TABLE ====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('supplier', 'transporter', 'customer', 'admin')),
  company_name VARCHAR(255),
  phone VARCHAR(20),
  telegram_id BIGINT UNIQUE,
  telegram_username VARCHAR(255),
  telegram_linked_at TIMESTAMP WITH TIME ZONE,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true, "telegram": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_role ON users(role);

-- ==================== SUPPLIERS TABLE ====================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  products_offered TEXT[] DEFAULT ARRAY[]::TEXT[],
  verified BOOLEAN DEFAULT false,
  active_deals INTEGER DEFAULT 0,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suppliers_rating ON suppliers(rating DESC);
CREATE INDEX idx_suppliers_category ON suppliers(category);
CREATE INDEX idx_suppliers_verified ON suppliers(verified);

-- ==================== TRANSPORTERS TABLE ====================
CREATE TABLE transporters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  vehicle_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  location VARCHAR(255) NOT NULL,
  available BOOLEAN DEFAULT true,
  active_shipments INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  on_time_rate DECIMAL(5,2) DEFAULT 0.00,
  phone VARCHAR(20),
  email VARCHAR(255),
  vehicles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transporters_rating ON transporters(rating DESC);
CREATE INDEX idx_transporters_available ON transporters(available);
CREATE INDEX idx_transporters_location ON transporters(location);

-- ==================== CUSTOMERS TABLE ====================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  active_orders INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_name ON customers(name);

-- ==================== SHIPMENTS TABLE ====================
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id VARCHAR(50) UNIQUE NOT NULL, -- Display ID like SH001
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  transporter_id UUID REFERENCES transporters(id) ON DELETE SET NULL,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'dispatched', 'in_transit', 'delivered', 'delayed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  eta TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  cargo_type VARCHAR(100) NOT NULL,
  weight VARCHAR(50) NOT NULL,
  vehicle_type VARCHAR(100),
  cost DECIMAL(12,2) DEFAULT 0.00,
  carbon_footprint DECIMAL(10,2) DEFAULT 0.00,
  current_location JSONB,
  route JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_location_update TIMESTAMP WITH TIME ZONE
);

-- Indexes for shipments
CREATE INDEX idx_shipments_shipment_id ON shipments(shipment_id);
CREATE INDEX idx_shipments_supplier_id ON shipments(supplier_id);
CREATE INDEX idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX idx_shipments_transporter_id ON shipments(transporter_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_created_at ON shipments(created_at DESC);

-- ==================== NOTIFICATIONS TABLE ====================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('shipment_update', 'delivery', 'disruption', 'payment', 'general')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ==================== TELEGRAM LINKS TABLE ====================
CREATE TABLE telegram_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(255),
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_preferences JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_telegram_links_user_id ON telegram_links(user_id);
CREATE INDEX idx_telegram_links_telegram_id ON telegram_links(telegram_id);

-- ==================== ANALYTICS TABLE ====================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- ==================== FUNCTIONS & TRIGGERS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transporters_updated_at BEFORE UPDATE ON transporters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate sequential shipment IDs
CREATE OR REPLACE FUNCTION generate_shipment_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
BEGIN
  -- Get the next ID number
  SELECT COALESCE(MAX(CAST(SUBSTRING(shipment_id FROM 3) AS INTEGER)), 0) + 1
  INTO next_id
  FROM shipments;
  
  -- Generate shipment_id like SH001, SH002, etc.
  NEW.shipment_id := 'SH' || LPAD(next_id::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_shipment_id_trigger
BEFORE INSERT ON shipments
FOR EACH ROW
WHEN (NEW.shipment_id IS NULL)
EXECUTE FUNCTION generate_shipment_id();

-- Function to update transporter active shipments count
CREATE OR REPLACE FUNCTION update_transporter_shipments()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.transporter_id IS NOT NULL THEN
    UPDATE transporters
    SET active_shipments = active_shipments + 1
    WHERE id = NEW.transporter_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE transporters
    SET 
      active_shipments = GREATEST(active_shipments - 1, 0),
      total_deliveries = total_deliveries + 1
    WHERE id = NEW.transporter_id;
  ELSIF TG_OP = 'DELETE' AND OLD.transporter_id IS NOT NULL THEN
    UPDATE transporters
    SET active_shipments = GREATEST(active_shipments - 1, 0)
    WHERE id = OLD.transporter_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transporter_shipments_trigger
AFTER INSERT OR UPDATE OR DELETE ON shipments
FOR EACH ROW EXECUTE FUNCTION update_transporter_shipments();

-- ==================== ROW LEVEL SECURITY (RLS) ====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Suppliers can see their shipments
CREATE POLICY suppliers_select_shipments ON shipments
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
  );

-- Customers can see their shipments
CREATE POLICY customers_select_shipments ON shipments
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Transporters can see their assigned shipments
CREATE POLICY transporters_select_shipments ON shipments
  FOR SELECT USING (
    transporter_id IN (SELECT id FROM transporters WHERE user_id = auth.uid())
  );

-- Users can read their own notifications
CREATE POLICY users_select_notifications ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- ==================== SEED DATA ====================

-- Insert demo users (passwords should be hashed in production)
INSERT INTO users (id, email, name, role, company_name, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'supplier@flexmove.com', 'Demo Supplier', 'supplier', 'FlexSupply Corp', '+91-9876543210'),
  ('550e8400-e29b-41d4-a716-446655440002', 'customer@flexmove.com', 'Demo Customer', 'customer', 'TechMart India', '+91-9876543211'),
  ('550e8400-e29b-41d4-a716-446655440003', 'transporter@flexmove.com', 'Demo Transporter', 'transporter', 'Swift Logistics', '+91-9876543212');

-- Insert demo suppliers (from telegram-data.ts)
INSERT INTO suppliers (user_id, name, category, location, rating, products_offered, verified, active_deals, phone, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'ElectroSource India', 'Electronics & Components', 'Mumbai', 4.7, ARRAY['Semiconductors', 'Circuit Boards', 'LED Components', 'Batteries'], true, 12, '+91-9876543210', 'contact@electrosource.in'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Textile Masters Ltd', 'Textiles & Fabrics', 'Surat', 4.8, ARRAY['Cotton Fabric', 'Silk', 'Polyester', 'Denim'], true, 8, '+91-9876543213', 'info@textilemaster.in');

-- Insert demo transporters
INSERT INTO transporters (user_id, name, rating, vehicle_types, location, available, active_shipments, total_deliveries, on_time_rate, phone, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Swift Logistics', 4.8, ARRAY['20ft Container Truck', '40ft Container', 'Refrigerated Truck'], 'Delhi NCR', true, 12, 450, 96.5, '+91-9876543212', 'ops@swiftlogistics.in');

-- Insert demo customers
INSERT INTO customers (user_id, name, company_name, location, active_orders, total_orders, phone, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Demo Customer', 'TechMart India', 'Mumbai', 5, 67, '+91-9876543211', 'customer@flexmove.com');

-- Insert demo shipments (will auto-generate shipment_id via trigger)
INSERT INTO shipments (supplier_id, customer_id, transporter_id, from_location, to_location, status, progress, eta, cargo_type, weight, vehicle_type, cost, carbon_footprint) VALUES
  ((SELECT id FROM suppliers LIMIT 1), (SELECT id FROM customers LIMIT 1), (SELECT id FROM transporters LIMIT 1), 
   'Delhi', 'Mumbai', 'in_transit', 65, NOW() + INTERVAL '18 hours', 'Electronics', '15 tons', '20ft Container Truck', 32000.00, 45.5);

-- Grant permissions (adjust based on your auth setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
