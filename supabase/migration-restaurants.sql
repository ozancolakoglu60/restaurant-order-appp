-- Migration: Add restaurants table and update schema
-- Run this if you haven't run the full schema.sql yet

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Restaurants policies
DROP POLICY IF EXISTS "Everyone can view restaurants by code" ON public.restaurants;
CREATE POLICY "Everyone can view restaurants by code" ON public.restaurants
  FOR SELECT USING (true);

-- Add restaurant_id column to users table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'restaurant_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add restaurant_id column to tables table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tables' 
    AND column_name = 'restaurant_id'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
    -- Drop old unique constraint if exists
    ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_table_number_key;
    -- Add new unique constraint on (restaurant_id, table_number)
    ALTER TABLE public.tables ADD CONSTRAINT tables_restaurant_table_number_unique UNIQUE (restaurant_id, table_number);
  END IF;
END $$;

-- Add restaurant_id column to products table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'restaurant_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_code ON public.restaurants(code);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON public.users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON public.products(restaurant_id);

-- Create function to get user's restaurant_id
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rest_id UUID;
BEGIN
  SELECT restaurant_id INTO rest_id
  FROM public.users
  WHERE id = user_id;
  RETURN rest_id;
END;
$$;

-- ÖNEMLİ: Eğer orders tablosunda veri varsa, bunları temizlemeniz veya 
-- restaurant_id'leri manuel olarak atamanız gerekebilir.
-- Aşağıdaki sorguyu çalıştırarak orders tablosundaki verileri kontrol edin:
-- SELECT COUNT(*) FROM public.orders;
