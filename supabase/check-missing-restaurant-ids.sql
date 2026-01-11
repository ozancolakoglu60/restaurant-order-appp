-- Eksik restaurant_id'leri kontrol et

-- 1. restaurant_id olmayan kullanıcılar
SELECT 
  COUNT(*) as users_without_restaurant,
  'users' as table_name
FROM public.users 
WHERE restaurant_id IS NULL

UNION ALL

-- 2. restaurant_id olmayan masalar
SELECT 
  COUNT(*) as tables_without_restaurant,
  'tables' as table_name
FROM public.tables 
WHERE restaurant_id IS NULL

UNION ALL

-- 3. restaurant_id olmayan ürünler
SELECT 
  COUNT(*) as products_without_restaurant,
  'products' as table_name
FROM public.products 
WHERE restaurant_id IS NULL;

-- 4. Tüm kullanıcıları ve restaurant_id'lerini listele
SELECT 
  u.id,
  u.name,
  u.role,
  u.restaurant_id,
  r.code as restaurant_code,
  r.name as restaurant_name,
  au.email
FROM public.users u
LEFT JOIN public.restaurants r ON r.id = u.restaurant_id
LEFT JOIN auth.users au ON au.id = u.id
ORDER BY u.created_at;

-- 5. Tüm masaları ve restaurant_id'lerini listele
SELECT 
  t.id,
  t.table_number,
  t.status,
  t.restaurant_id,
  r.code as restaurant_code,
  r.name as restaurant_name
FROM public.tables t
LEFT JOIN public.restaurants r ON r.id = t.restaurant_id
ORDER BY t.created_at;

-- 6. Tüm ürünleri ve restaurant_id'lerini listele
SELECT 
  p.id,
  p.name,
  p.price,
  p.restaurant_id,
  r.code as restaurant_code,
  r.name as restaurant_name
FROM public.products p
LEFT JOIN public.restaurants r ON r.id = p.restaurant_id
ORDER BY p.created_at;
