-- REST001 restoranına ait kullanıcıları kontrol et

-- 1. REST001 restoranını bul
SELECT id, code, name FROM public.restaurants WHERE code = 'REST001';

-- 2. Bu restorana ait kullanıcıları listele
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
WHERE r.code = 'REST001' OR u.restaurant_id IS NULL;

-- 3. Tüm restoranları listele
SELECT id, code, name FROM public.restaurants;
