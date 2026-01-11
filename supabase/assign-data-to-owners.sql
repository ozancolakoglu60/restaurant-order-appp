-- Her restoranın verilerini kendi kullanıcılarına bağla
-- Bu script, restaurant_id olmayan verileri, oluşturan kullanıcının restaurant_id'sine bağlar

-- 1. Önce mevcut durumu göster
SELECT 'ÖNCE - restaurant_id olmayan veriler:' as durum;
SELECT 'Kullanıcılar' as tablo, COUNT(*) as sayi FROM public.users WHERE restaurant_id IS NULL
UNION ALL
SELECT 'Masalar' as tablo, COUNT(*) as sayi FROM public.tables WHERE restaurant_id IS NULL
UNION ALL
SELECT 'Ürünler' as tablo, COUNT(*) as sayi FROM public.products WHERE restaurant_id IS NULL
UNION ALL
SELECT 'Siparişler' as tablo, COUNT(*) as sayi FROM public.orders o 
  LEFT JOIN public.tables t ON t.id = o.table_id 
  WHERE t.restaurant_id IS NULL;

-- 2. Siparişler üzerinden masaları restoranlara bağla
-- Eğer bir masada sipariş varsa, o siparişi oluşturan kullanıcının restaurant_id'sini masaya ata
UPDATE public.tables t
SET restaurant_id = u.restaurant_id
FROM public.orders o
JOIN public.users u ON u.id = o.created_by_id
WHERE t.id = o.table_id 
  AND t.restaurant_id IS NULL
  AND u.restaurant_id IS NOT NULL;

-- 3. Siparişlerdeki product_id'ler üzerinden ürünleri restoranlara bağla
-- Eğer bir ürün siparişte kullanılmışsa, o siparişi oluşturan kullanıcının restaurant_id'sini ürüne ata
UPDATE public.products p
SET restaurant_id = u.restaurant_id
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN public.users u ON u.id = o.created_by_id
WHERE p.id = oi.product_id 
  AND p.restaurant_id IS NULL
  AND u.restaurant_id IS NOT NULL;

-- 4. Eğer hala restaurant_id olmayan masalar varsa, ilk admin kullanıcının restaurant_id'sine bağla
UPDATE public.tables t
SET restaurant_id = (
  SELECT restaurant_id 
  FROM public.users 
  WHERE role = 'admin' 
  AND restaurant_id IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE t.restaurant_id IS NULL;

-- 5. Eğer hala restaurant_id olmayan ürünler varsa, ilk admin kullanıcının restaurant_id'sine bağla
UPDATE public.products p
SET restaurant_id = (
  SELECT restaurant_id 
  FROM public.users 
  WHERE role = 'admin' 
  AND restaurant_id IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE p.restaurant_id IS NULL;

-- 6. Son durumu göster
SELECT 'SONRA - restaurant_id olmayan veriler:' as durum;
SELECT 'Kullanıcılar' as tablo, COUNT(*) as sayi FROM public.users WHERE restaurant_id IS NULL
UNION ALL
SELECT 'Masalar' as tablo, COUNT(*) as sayi FROM public.tables WHERE restaurant_id IS NULL
UNION ALL
SELECT 'Ürünler' as tablo, COUNT(*) as sayi FROM public.products WHERE restaurant_id IS NULL;

-- 7. Her restorana ait veri sayısını göster
SELECT 
  r.code as restoran_kodu,
  r.name as restoran_adi,
  (SELECT COUNT(*) FROM public.users WHERE restaurant_id = r.id) as kullanici_sayisi,
  (SELECT COUNT(*) FROM public.tables WHERE restaurant_id = r.id) as masa_sayisi,
  (SELECT COUNT(*) FROM public.products WHERE restaurant_id = r.id) as urun_sayisi
FROM public.restaurants r
ORDER BY r.created_at;
