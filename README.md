# Garson Odaklı Restoran Sipariş Uygulaması (V1)

Modern, üretime uygun bir restoran sipariş uygulaması.

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env.local` dosyası oluşturun:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Supabase veritabanı şemasını oluşturun (supabase/schema.sql dosyasına bakın)

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## Özellikler

- ✅ Role-based authentication (Admin / Garson)
- ✅ Garson paneli (mobil uyumlu)
- ✅ Admin paneli (PC uyumlu)
- ✅ Realtime masa takibi
- ✅ Stok yönetimi
- ✅ Menü yönetimi
- ✅ Adisyon yazdırma
- ✅ Tek adisyon mantığı
