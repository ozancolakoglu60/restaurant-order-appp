-- Verilerin sahiplik analizi
-- Hangi verilerin hangi restorana ait olması gerektiğini gösterir

-- 1. Her restoranın kullanıcılarını göster
SELECT 
  r.code as restoran_kodu,
  r.name as restoran_adi,
  u.id as kullanici_id,
  u.name as kullanici_adi,
  u.role as rol,
  au.email as email
FROM public.restaurants r
JOIN public.users u ON u.restaurant_id = r.id
LEFT JOIN auth.users au ON au.id = u.id
ORDER BY r.code, u.role, u.name;

-- 2. restaurant_id olmayan verileri göster
SELECT 'Kullanıcılar (restaurant_id yok)' as tip, COUNT(*) as sayi 
FROM public.users WHERE restaurant_id IS NULL

UNION ALL

SELECT 'Masalar (restaurant_id yok)' as tip, COUNT(*) as sayi 
FROM public.tables WHERE restaurant_id IS NULL

UNION ALL

SELECT 'Ürünler (restaurant_id yok)' as tip, COUNT(*) as sayi 
FROM public.products WHERE restaurant_id IS NULL;

-- 3. Siparişler üzerinden masaların hangi restorana ait olması gerektiğini göster
SELECT DISTINCT
  t.id as masa_id,
  t.table_number as masa_no,
  t.restaurant_id as mevcut_restaurant_id,
  u.restaurant_id as olmasi_gereken_restaurant_id,
  r1.code as mevcut_restoran,
  r2.code as olmasi_gereken_restoran
FROM public.tables t
LEFT JOIN public.restaurants r1 ON r1.id = t.restaurant_id
JOIN public.orders o ON o.table_id = t.id
JOIN public.users u ON u.id = o.created_by_id
LEFT JOIN public.restaurants r2 ON r2.id = u.restaurant_id
WHERE t.restaurant_id IS NULL OR t.restaurant_id != u.restaurant_id
ORDER BY t.table_number;

-- 4. Siparişler üzerinden ürünlerin hangi restorana ait olması gerektiğini göster
SELECT DISTINCT
  p.id as urun_id,
  p.name as urun_adi,
  p.restaurant_id as mevcut_restaurant_id,
  u.restaurant_id as olmasi_gereken_restaurant_id,
  r1.code as mevcut_restoran,
  r2.code as olmasi_gereken_restoran
FROM public.products p
LEFT JOIN public.restaurants r1 ON r1.id = p.restaurant_id
JOIN public.order_items oi ON oi.product_id = p.id
JOIN public.orders o ON o.id = oi.order_id
JOIN public.users u ON u.id = o.created_by_id
LEFT JOIN public.restaurants r2 ON r2.id = u.restaurant_id
WHERE p.restaurant_id IS NULL OR p.restaurant_id != u.restaurant_id
ORDER BY p.name;
