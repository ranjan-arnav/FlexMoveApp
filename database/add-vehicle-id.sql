-- Add vehicle_id column to shipments table
-- Run this in Supabase SQL Editor

-- Add the vehicle_id column
ALTER TABLE shipments 
ADD COLUMN vehicle_id VARCHAR(50);

-- Add an index for better query performance
CREATE INDEX idx_shipments_vehicle_id ON shipments(vehicle_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shipments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
