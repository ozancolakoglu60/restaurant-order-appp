-- Mevcut durumu kontrol etmek için çalıştırın

-- 1. Hangi tablolar mevcut?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Users tablosunda restaurant_id kolonu var mı?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Users tablosunda kaç kayıt var?
SELECT COUNT(*) as user_count FROM public.users;

-- 4. Tables tablosunda kaç kayıt var?
SELECT COUNT(*) as table_count FROM public.tables;

-- 5. Products tablosunda kaç kayıt var?
SELECT COUNT(*) as product_count FROM public.products;

-- 6. Orders tablosunda kaç kayıt var?
SELECT COUNT(*) as order_count FROM public.orders;
