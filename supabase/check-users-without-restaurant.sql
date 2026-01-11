-- Kullanıcıları restaurant_id olmadan kontrol et
-- Not: email auth.users tablosunda, public.users tablosunda değil
SELECT 
  u.id, 
  u.name, 
  u.role, 
  u.restaurant_id,
  u.created_at
FROM public.users u
WHERE u.restaurant_id IS NULL
ORDER BY u.created_at DESC;

-- Kullanıcı sayısı
SELECT 
  COUNT(*) as toplam_kullanici,
  COUNT(restaurant_id) as restaurant_id_olan,
  COUNT(*) - COUNT(restaurant_id) as restaurant_id_olmayan
FROM public.users;
