-- Migration: Add note column to order_items table
-- Allows waiters to add special instructions (e.g., "az ekmekli", "az soğanlı") to order items

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS note TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.order_items.note IS 'Special instructions or notes for this order item (e.g., "az ekmekli", "az soğanlı")';
