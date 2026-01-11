-- Restaurant_id olmayan kullanıcıları REST001 restoranına bağla
-- DİKKAT: Bu sorguyu çalıştırmadan önce yukarıdaki list-restaurant-users.sql'yi çalıştırın

-- Önce REST001 restoranının ID'sini al
DO $$
DECLARE
  rest_id UUID;
BEGIN
  -- REST001 restoranının ID'sini al
  SELECT id INTO rest_id
  FROM public.restaurants
  WHERE code = 'REST001'
  LIMIT 1;

  IF rest_id IS NULL THEN
    RAISE EXCEPTION 'REST001 restoranı bulunamadı!';
  END IF;

  -- Restaurant_id olmayan kullanıcıları REST001'e bağla
  UPDATE public.users
  SET restaurant_id = rest_id
  WHERE restaurant_id IS NULL;

  RAISE NOTICE 'Kullanıcılar REST001 restoranına bağlandı. Restaurant ID: %', rest_id;
END $$;

-- Kontrol: Güncellenmiş kullanıcıları göster
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
