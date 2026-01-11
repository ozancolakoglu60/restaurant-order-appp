-- Add IBAN column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS iban TEXT;

-- Add payment_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'iban'));
