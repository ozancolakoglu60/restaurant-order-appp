-- Eksik restaurant_id'leri düzelt
-- DİKKAT: Bu sorguyu çalıştırmadan önce check-missing-restaurant-ids.sql'yi çalıştırın!

-- 1. Önce REST001 restoranının ID'sini al
DO $$
DECLARE
  rest_id UUID;
  user_count INTEGER;
  table_count INTEGER;
  product_count INTEGER;
BEGIN
  -- REST001 restoranının ID'sini al
  SELECT id INTO rest_id
  FROM public.restaurants
  WHERE code = 'REST001'
  LIMIT 1;

  IF rest_id IS NULL THEN
    RAISE EXCEPTION 'REST001 restoranı bulunamadı!';
  END IF;

  RAISE NOTICE 'REST001 Restaurant ID: %', rest_id;

  -- restaurant_id olmayan kullanıcıları REST001'e bağla
  UPDATE public.users
  SET restaurant_id = rest_id
  WHERE restaurant_id IS NULL;
  
  GET DIAGNOSTICS user_count = ROW_COUNT;
  RAISE NOTICE 'Güncellenen kullanıcı sayısı: %', user_count;

  -- restaurant_id olmayan masaları REST001'e bağla
  UPDATE public.tables
  SET restaurant_id = rest_id
  WHERE restaurant_id IS NULL;
  
  GET DIAGNOSTICS table_count = ROW_COUNT;
  RAISE NOTICE 'Güncellenen masa sayısı: %', table_count;

  -- restaurant_id olmayan ürünleri REST001'e bağla
  UPDATE public.products
  SET restaurant_id = rest_id
  WHERE restaurant_id IS NULL;
  
  GET DIAGNOSTICS product_count = ROW_COUNT;
  RAISE NOTICE 'Güncellenen ürün sayısı: %', product_count;

  RAISE NOTICE 'Tüm eksik restaurant_id''ler REST001 restoranına bağlandı!';
END $$;

-- Kontrol: Güncellenmiş verileri göster
SELECT 'Kullanıcılar' as tablo, COUNT(*) as toplam, COUNT(restaurant_id) as restaurant_id_olan
FROM public.users

UNION ALL

SELECT 'Masalar' as tablo, COUNT(*) as toplam, COUNT(restaurant_id) as restaurant_id_olan
FROM public.tables

UNION ALL

SELECT 'Ürünler' as tablo, COUNT(*) as toplam, COUNT(restaurant_id) as restaurant_id_olan
FROM public.products;
