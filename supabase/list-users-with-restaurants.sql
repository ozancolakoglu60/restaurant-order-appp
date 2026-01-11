-- Kullanıcıları ve bağlı oldukları restoranları listele
SELECT 
  u.id,
  u.name,
  u.role,
  r.code as restoran_kodu,
  r.name as restoran_adi,
  u.restaurant_id,
  u.created_at
FROM public.users u
LEFT JOIN public.restaurants r ON u.restaurant_id = r.id
ORDER BY 
  CASE WHEN u.restaurant_id IS NULL THEN 0 ELSE 1 END,
  r.code,
  u.name;
