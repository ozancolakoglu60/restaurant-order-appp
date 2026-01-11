-- REST001 restoranına ait kullanıcıları listele

-- 1. REST001 restoranını bul
SELECT id, code, name, created_at 
FROM public.restaurants 
WHERE code = 'REST001';

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
WHERE r.code = 'REST001';

-- 3. Restaurant_id olmayan kullanıcılar (eski kullanıcılar)
SELECT 
  u.id,
  u.name,
  u.role,
  au.email,
  'Restaurant ID yok - REST001''e baglanmali' as durum
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.restaurant_id IS NULL;
