-- Belirli bir kullanıcıyı belirli bir restorana ata
-- KULLANIM: Kullanıcı ID ve Restoran ID'yi değiştirin

-- Örnek: Kullanıcı ID'si 'USER_ID_BURAYA' olan kullanıcıyı 
-- Restoran ID'si 'RESTORAN_ID_BURAYA' olan restorana ata

-- UPDATE public.users 
-- SET restaurant_id = 'RESTORAN_ID_BURAYA'
-- WHERE id = 'USER_ID_BURAYA';

-- Tüm kullanıcıları bir restorana ata (DİKKAT: Sadece test için!)
-- UPDATE public.users 
-- SET restaurant_id = 'RESTORAN_ID_BURAYA'
-- WHERE restaurant_id IS NULL;

-- Önce hangi restoranlar var kontrol edin
SELECT id, code, name FROM public.restaurants ORDER BY code;
