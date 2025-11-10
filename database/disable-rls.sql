-- Disable Row Level Security for Development
-- Run this in Supabase SQL Editor to allow unauthenticated access

-- Disable RLS on all tables (for development only!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE transporters DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'suppliers', 'transporters', 'customers', 'shipments', 'notifications')
ORDER BY tablename;

-- Should show rowsecurity = false for all tables
