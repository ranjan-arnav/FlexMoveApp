-- Quick Seed Data for Testing
-- Run this in Supabase SQL Editor if tables are empty

-- Insert test users
INSERT INTO users (id, email, name, role, company_name, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'supplier@flexmove.com', 'Demo Supplier', 'supplier', 'FlexSupply Corp', '+91-9876543210'),
  ('550e8400-e29b-41d4-a716-446655440002', 'customer@flexmove.com', 'Demo Customer', 'customer', 'TechMart India', '+91-9876543211'),
  ('550e8400-e29b-41d4-a716-446655440003', 'transporter@flexmove.com', 'Demo Transporter', 'transporter', 'Swift Logistics', '+91-9876543212')
ON CONFLICT (id) DO NOTHING;

-- Insert test suppliers
INSERT INTO suppliers (id, user_id, name, category, location, rating, products_offered, verified, active_deals, phone, email) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'ElectroSource India', 'Electronics & Components', 'Mumbai', 4.7, ARRAY['Semiconductors', 'Circuit Boards', 'LED Components', 'Batteries'], true, 12, '+91-9876543210', 'contact@electrosource.in'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Textile Masters Ltd', 'Textiles & Fabrics', 'Surat', 4.8, ARRAY['Cotton Fabric', 'Silk', 'Polyester', 'Denim'], true, 8, '+91-9876543213', 'info@textilemaster.in')
ON CONFLICT (id) DO NOTHING;

-- Insert test transporters
INSERT INTO transporters (id, user_id, name, rating, vehicle_types, location, available, active_shipments, total_deliveries, on_time_rate, phone, email, vehicles) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Swift Logistics', 4.8, ARRAY['20ft Container Truck', '40ft Container', 'Refrigerated Truck'], 'Delhi NCR', true, 0, 450, 96.5, '+91-9876543212', 'ops@swiftlogistics.in', '[{"id": "VEH001", "type": "20ft Container Truck", "registration": "DL01AB1234", "status": "available"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert test customers
INSERT INTO customers (id, user_id, name, company_name, location, active_orders, total_orders, phone, email) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Demo Customer', 'TechMart India', 'Mumbai', 0, 67, '+91-9876543211', 'customer@flexmove.com')
ON CONFLICT (id) DO NOTHING;

-- Insert test shipments (shipment_id will be auto-generated)
INSERT INTO shipments (
  supplier_id, 
  customer_id, 
  transporter_id, 
  from_location, 
  to_location, 
  status, 
  progress, 
  eta, 
  cargo_type, 
  weight, 
  vehicle_type, 
  cost, 
  carbon_footprint
) VALUES
  (
    '650e8400-e29b-41d4-a716-446655440001',
    '850e8400-e29b-41d4-a716-446655440001', 
    '750e8400-e29b-41d4-a716-446655440001', 
    'Delhi', 
    'Mumbai', 
    'in_transit', 
    65, 
    NOW() + INTERVAL '18 hours', 
    'Electronics', 
    '15 tons', 
    '20ft Container Truck', 
    32000.00, 
    45.5
  ),
  (
    '650e8400-e29b-41d4-a716-446655440002',
    '850e8400-e29b-41d4-a716-446655440001', 
    NULL, 
    'Surat', 
    'Bangalore', 
    'preparing', 
    10, 
    NOW() + INTERVAL '3 days', 
    'Textiles', 
    '8 tons', 
    'Truck', 
    18000.00, 
    28.3
  ),
  (
    '650e8400-e29b-41d4-a716-446655440001',
    '850e8400-e29b-41d4-a716-446655440001', 
    '750e8400-e29b-41d4-a716-446655440001', 
    'Mumbai', 
    'Pune', 
    'delivered', 
    100, 
    NOW(), 
    'Electronics', 
    '5 tons', 
    'Truck', 
    12000.00, 
    18.2
  );

-- Verify data was inserted
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Suppliers:', COUNT(*) FROM suppliers
UNION ALL
SELECT 'Transporters:', COUNT(*) FROM transporters
UNION ALL
SELECT 'Customers:', COUNT(*) FROM customers
UNION ALL
SELECT 'Shipments:', COUNT(*) FROM shipments;
