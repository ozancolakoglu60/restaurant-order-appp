-- Seed data for testing

-- Insert admin user (you need to create this user in Supabase Auth first, then update the UUID)
-- Replace 'YOUR_ADMIN_USER_ID' with actual UUID from auth.users
INSERT INTO public.users (id, name, role) VALUES
  ('YOUR_ADMIN_USER_ID', 'Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Insert waiter users (you need to create these users in Supabase Auth first, then update the UUIDs)
-- Replace 'YOUR_WAITER_USER_ID_1' and 'YOUR_WAITER_USER_ID_2' with actual UUIDs from auth.users
INSERT INTO public.users (id, name, role) VALUES
  ('YOUR_WAITER_USER_ID_1', 'Garson 1', 'waiter'),
  ('YOUR_WAITER_USER_ID_2', 'Garson 2', 'waiter')
ON CONFLICT (id) DO NOTHING;

-- Insert tables
INSERT INTO public.tables (table_number, status) VALUES
  (1, 'empty'),
  (2, 'empty'),
  (3, 'empty'),
  (4, 'empty'),
  (5, 'empty'),
  (6, 'empty'),
  (7, 'empty'),
  (8, 'empty'),
  (9, 'empty'),
  (10, 'empty'),
  (11, 'empty'),
  (12, 'empty')
ON CONFLICT (table_number) DO NOTHING;

-- Insert products (with and without stock)
INSERT INTO public.products (name, price, is_active, stock_quantity, stock_enabled) VALUES
  -- Stoklu ürünler
  ('Köfte', 120.00, true, 50, true),
  ('Döner', 100.00, true, 30, true),
  ('Lahmacun', 25.00, true, 100, true),
  ('Pide', 80.00, true, 20, true),
  ('Pizza', 150.00, true, 15, true),
  -- Stoksuz ürünler
  ('Çay', 10.00, true, 0, false),
  ('Kahve', 15.00, true, 0, false),
  ('Kola', 20.00, true, 0, false),
  ('Su', 5.00, true, 0, false),
  ('Ayran', 12.00, true, 0, false),
  -- Düşük stoklu ürün (test için)
  ('Salata', 30.00, true, 3, true),
  -- Pasif ürün (stok bitti)
  ('Mantı', 90.00, false, 0, true)
ON CONFLICT DO NOTHING;
