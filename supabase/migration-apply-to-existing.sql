-- Migration: Add IBAN and payment_method to existing tables
-- This migration safely adds new columns to existing restaurants and orders tables
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Add IBAN column to restaurants table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'restaurants' 
    AND column_name = 'iban'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN iban TEXT;
    RAISE NOTICE 'Added iban column to restaurants table';
  ELSE
    RAISE NOTICE 'iban column already exists in restaurants table';
  END IF;
END $$;

-- Add payment_method column to orders table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN payment_method TEXT 
    CHECK (payment_method IN ('cash', 'credit_card', 'iban'));
    RAISE NOTICE 'Added payment_method column to orders table';
  ELSE
    RAISE NOTICE 'payment_method column already exists in orders table';
  END IF;
END $$;

-- Verify the changes
SELECT 
  'restaurants' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'restaurants' 
  AND column_name IN ('iban')
UNION ALL
SELECT 
  'orders' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders' 
  AND column_name IN ('payment_method');
