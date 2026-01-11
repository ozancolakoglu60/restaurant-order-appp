# 🚀 Restoran Sipariş Uygulaması - Canlıya Alma Rehberi

Bu rehber, uygulamanızı canlıya almak için gereken tüm adımları içerir.

## 📋 İçindekiler

1. [Ön Hazırlık](#ön-hazırlık)
2. [Supabase Kurulumu](#supabase-kurulumu)
3. [Vercel'e Deploy (Önerilen)](#vercele-deploy-önerilen)
4. [Veritabanı Şemasını Oluşturma](#veritabanı-şemasını-oluşturma)
5. [İlk Kullanıcıları Oluşturma](#ilk-kullanıcıları-oluşturma)
6. [Test ve Kontrol](#test-ve-kontrol)
7. [Telefona Kurulum](#telefona-kurulum)
8. [Sorun Giderme](#sorun-giderme)

---

## 🔧 Ön Hazırlık

### 1. Gereksinimler
- GitHub hesabı (ücretsiz)
- Supabase hesabı (ücretsiz) - **Zaten kuruluysa atlayabilirsiniz!**
- Vercel hesabı (ücretsiz)

### 2. Projeyi Hazırlama
```bash
# Projenin build edilebilir olduğundan emin olun
npm run build
```

Eğer build hatası varsa, önce hatayı düzeltin.

---

## 🗄️ Supabase Kurulumu

### ⚠️ ÖNEMLİ: Mevcut Supabase Kurulumunuz Varsa

Eğer zaten Supabase projenizi kurduysanız ve çalışıyorsa:
- ✅ **Yeniden kurmaya GEREK YOK!**
- ✅ Mevcut projenizi kullanabilirsiniz
- ✅ Sadece **Environment Variables'ı Vercel'e eklemeniz** yeterli
- ✅ [Vercel'e Deploy](#vercele-deploy-önerilen) bölümüne geçebilirsiniz

**Not**: Eğer Supabase projenizi zaten kurduysanız, aşağıdaki "Supabase Kurulumu" bölümünü atlayabilirsiniz.

---

### Yeni Supabase Kurulumu (Sadece İlk Kurulum İçin)

### Adım 1: Supabase Projesi Oluşturun

1. https://supabase.com adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın (veya email ile kayıt olun)
4. "New Project" butonuna tıklayın
5. Proje bilgilerini girin:
   - **Name**: `restaurant-order-app` (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre belirleyin (kaydedin!)
   - **Region**: Size en yakın bölgeyi seçin
6. "Create new project" butonuna tıklayın
7. Projenin hazır olmasını bekleyin (2-3 dakika)

### Adım 2: Supabase Bilgilerini Alın (Mevcut Proje İçin)

Eğer Supabase projeniz zaten varsa, sadece bu bilgileri almanız yeterli:

1. Supabase Dashboard'da sol menüden **Settings** → **API** seçin
2. Şu bilgileri kopyalayın (Vercel'de kullanacaksınız):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Uzun bir string (başlar: `eyJhbGc...`)

**Not**: Bu bilgileri `.env.local` dosyanızda zaten varsa, oradan da kopyalayabilirsiniz.

---

## 🌐 Vercel'e Deploy (Önerilen)

Vercel, Next.js uygulamaları için en iyi hosting platformudur. Ücretsiz ve kolay kullanım.

### Adım 1: Projeyi GitHub'a Yükleyin

### ⚠️ ÖNEMLİ: Mevcut GitHub Repository'niz Varsa

Eğer zaten GitHub'da repository oluşturduysanız ve tüm dosyalar zaten GitHub'da ise:
- ✅ **Yeniden oluşturmaya GEREK YOK!**
- ✅ Mevcut repository'nizi kullanabilirsiniz
- ✅ Eğer her şey zaten GitHub'da ise **direkt Vercel'e Deploy** edebilirsiniz
- ✅ [Vercel'e Deploy](#adım-2-vercele-deploy-edin) bölümüne geçebilirsiniz

**Kontrol İçin**:
- GitHub'a gidin: https://github.com
- Repository'nizi bulun (sağ üstte arama yapabilirsiniz)
- Tüm dosyalar orada mı kontrol edin
- Eğer her şey varsa, yeni bir şey yapmanıza gerek yok!

**Yeni Dosyalar Eklemek İçin - Yöntem 1: GitHub Desktop (Önerilen - En Kolay)**

1. **GitHub Desktop'u İndirin** (eğer yoksa):
   - https://desktop.github.com adresine gidin
   - "Download for Windows" butonuna tıklayın
   - İndirip kurun

2. **Repository'yi GitHub Desktop'a Ekleyin**:
   - GitHub Desktop'u açın
   - "File" → "Add Local Repository" seçin
   - "Choose..." butonuna tıklayın
   - `C:\restaurant-order-app` klasörünü seçin
   - "Add Repository" butonuna tıklayın

3. **Dosyaları Commit ve Push Edin**:
   - Sol tarafta değişiklikleri göreceksiniz
   - Alt kısımda "Summary" kısmına mesaj yazın: `Update: Production deployment hazırlığı`
   - "Commit to main" butonuna tıklayın
   - Üstteki "Push origin" butonuna tıklayın
   - Tamamlandı! Dosyalar GitHub'a yüklendi

**Yeni Dosyalar Eklemek İçin - Yöntem 2: GitHub Web Arayüzü (Basit Dosyalar İçin)**

1. GitHub repository'nize gidin
2. "Add file" → "Upload files" seçin
3. Dosyaları sürükle-bırak yapın (veya "choose your files" ile seçin)
4. Alt kısımda "Commit changes" bölümüne mesaj yazın
5. "Commit changes" butonuna tıklayın

**Not**: Bu yöntem tek tek dosya için uygundur. Tüm projeyi yüklemek için GitHub Desktop daha iyi.

**Yeni Dosyalar Eklemek İçin - Yöntem 3: Terminal (Gelişmiş)**

Terminal kullanıyorsanız:
```bash
cd restaurant-order-app
git add .
git commit -m "Update: Production deployment hazırlığı"
git push
```

---

### Yeni GitHub Repository Oluşturma (Sadece İlk Kurulum İçin)

#### Eğer Git henüz kurulu değilse:
1. https://desktop.github.com adresinden GitHub Desktop'u indirin
2. Kurun ve GitHub hesabınızla giriş yapın

#### GitHub'a yükleme (Terminal ile):
```bash
# Proje dizinine gidin
cd restaurant-order-app

# Git'i başlatın
git init

# Tüm dosyaları ekleyin
git add .

# İlk commit
git commit -m "Initial commit: Restaurant order app"

# GitHub'da yeni repository oluşturun:
# 1. https://github.com/new adresine gidin
# 2. Repository name: restaurant-order-app
# 3. Public veya Private seçin
# 4. "Create repository" butonuna tıklayın
# 5. Oluşturulan sayfada gösterilen komutları kullanın:

git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/restaurant-order-app.git
git push -u origin main
```

**Not**: `KULLANICI_ADINIZ` yerine GitHub kullanıcı adınızı yazın.

### Adım 2: Vercel'e Deploy Edin

1. https://vercel.com adresine gidin
2. "Sign Up" butonuna tıklayın
3. GitHub ile giriş yapın
4. Dashboard'da "Add New..." → "Project" seçin
5. GitHub repository'nizi bulun ve "Import" butonuna tıklayın

### Adım 3: Proje Ayarlarını Yapın

1. **Project Name**: `restaurant-order-app` (veya istediğiniz isim)
2. **Framework Preset**: Next.js (otomatik algılanır)
3. **Root Directory**: `./` (varsayılan)
4. **Build Command**: `npm run build` (varsayılan)
5. **Output Directory**: `.next` (varsayılan)
6. **Install Command**: `npm install` (varsayılan)

### Adım 4: Environment Variables Ekleyin

**ÇOK ÖNEMLİ**: Bu adımı atlamayın!

1. Vercel'de "Environment Variables" bölümüne scroll edin
2. Aşağıdaki değişkenleri ekleyin:

#### Değişken 1:
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Supabase'den kopyaladığınız Project URL
- **Environment**: Production, Preview, Development (hepsini seçin)

#### Değişken 2:
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Supabase'den kopyaladığınız anon public key
- **Environment**: Production, Preview, Development (hepsini seçin)

3. Her değişkeni ekledikten sonra "Add" butonuna tıklayın
4. Tüm değişkenler eklendikten sonra sayfanın altındaki "Deploy" butonuna tıklayın

### Adım 5: Deploy'i Bekleyin

- Deploy işlemi 2-5 dakika sürebilir
- İlerlemeyi takip edebilirsiniz
- Tamamlandığında yeşil "Success" mesajı göreceksiniz
- Uygulamanızın URL'si: `https://restaurant-order-app.vercel.app` (veya verilen URL)

### ✅ Vercel Avantajları

- ✅ Ücretsiz hosting
- ✅ Otomatik HTTPS (güvenli bağlantı)
- ✅ Global CDN (hızlı yükleme)
- ✅ Otomatik deployment (her git push'ta güncellenir)
- ✅ Özel domain ekleme imkanı (opsiyonel)

---

## 📊 Veritabanı Şemasını Oluşturma

### ⚠️ ÖNEMLİ: Veritabanı Zaten Hazırsa

Eğer zaten veritabanı şemanızı oluşturduysanız ve tablolar mevcutsa:
- ✅ **Yeniden oluşturmaya GEREK YOK!**
- ✅ Mevcut veritabanınızı kullanabilirsiniz
- ✅ Sadece kontrol için **Table Editor**'a bakmanız yeterli
- ✅ [Vercel'e Deploy](#vercele-deploy-önerilen) bölümüne geçebilirsiniz

**Kontrol İçin**: Supabase Dashboard → **Table Editor** → Şu tablolar var mı kontrol edin:
- `restaurants`
- `users`
- `tables`
- `products`
- `orders`
- `order_items`

Eğer tüm tablolar varsa, bu bölümü atlayabilirsiniz.

---

### Yeni Veritabanı Şeması Oluşturma (Sadece İlk Kurulum İçin)

### Adım 1: Supabase SQL Editor'a Gidin

1. Supabase Dashboard'da sol menüden **SQL Editor** seçin
2. "New query" butonuna tıklayın

### Adım 2: Schema.sql Dosyasını Çalıştırın

1. Bu projedeki `supabase/schema.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. Sağ üstteki **RUN** butonuna (veya Ctrl+Enter) tıklayın
5. "Success. No rows returned" mesajını görmelisiniz

**Önemli**: Eğer hata alırsanız:
- Hata mesajını okuyun
- Genellikle bazı tablolar zaten var ise oluşur
- Bu durumda sadece eksik tabloları oluşturmak için SQL'i düzenleyin

### Adım 3: Doğrulama

1. Supabase Dashboard'da **Table Editor**'a gidin
2. Şu tabloları görmelisiniz:
   - `restaurants`
   - `users`
   - `tables`
   - `products`
   - `orders`
   - `order_items`

---

## 👥 İlk Kullanıcıları Oluşturma

### ⚠️ ÖNEMLİ: Kullanıcılar Zaten Varsa

Eğer zaten admin kullanıcısı ve restoran oluşturduysanız:
- ✅ **Yeniden oluşturmaya GEREK YOK!**
- ✅ Mevcut kullanıcılarınızı kullanabilirsiniz
- ✅ Sadece giriş yapabildiğinizden emin olun
- ✅ [Vercel'e Deploy](#vercele-deploy-önerilen) bölümüne geçebilirsiniz

**Kontrol İçin**: Supabase Dashboard → **Authentication** → **Users** → Kullanıcılarınız var mı kontrol edin.

Eğer kullanıcılarınız varsa ve giriş yapabiliyorsanız, bu bölümü atlayabilirsiniz.

---

### Yeni Kullanıcı Oluşturma (Sadece İlk Kurulum İçin)

### Adım 1: Admin Kullanıcısı Oluşturun

#### 1.1. Authentication'dan Kullanıcı Ekle

1. Supabase Dashboard'da **Authentication** → **Users** seçin
2. "Add user" → "Create new user" seçin
3. Bilgileri girin:
   - **Email**: `admin@restaurant.com` (veya istediğiniz email)
   - **Password**: Güçlü bir şifre belirleyin
   - **Auto Confirm User**: ✅ İşaretleyin
4. "Create user" butonuna tıklayın
5. Oluşturulan kullanıcının **UUID**'sini kopyalayın (örnek: `123e4567-e89b-12d3-a456-426614174000`)

#### 1.2. Users Tablosuna Admin Ekle

1. **SQL Editor**'a gidin
2. Aşağıdaki SQL'i çalıştırın (UUID'yi değiştirin):

```sql
-- Admin kullanıcısı ekle
-- UUID'yi yukarıda kopyaladığınız UUID ile değiştirin
INSERT INTO public.users (id, name, role, email)
VALUES (
  'BURAYA_UUID_YAPISTIRIN',
  'Admin',
  'admin',
  'admin@restaurant.com'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role,
    email = EXCLUDED.email;
```

3. **RUN** butonuna tıklayın

#### 1.3. Restoran Oluşturun

1. SQL Editor'da aşağıdaki SQL'i çalıştırın:

```sql
-- Restoran oluştur
INSERT INTO public.restaurants (name, code)
VALUES ('Benim Restoranım', 'REST001')
ON CONFLICT (code) DO NOTHING
RETURNING id, code;
```

2. Çıkan **id** değerini not edin

#### 1.4. Admin'i Restorana Bağlayın

1. SQL Editor'da aşağıdaki SQL'i çalıştırın (UUID ve restaurant_id'yi değiştirin):

```sql
-- Admin'i restorana bağla
UPDATE public.users
SET restaurant_id = 'BURAYA_RESTORAN_ID_YAPISTIRIN'
WHERE id = 'BURAYA_ADMIN_UUID_YAPISTIRIN';
```

### Adım 2: Garson Kullanıcıları Oluşturun (İsteğe Bağlı)

1. **Authentication** → **Users** → "Add user"
2. Email ve şifre belirleyin (örn: `garson1@restaurant.com`)
3. UUID'yi kopyalayın
4. SQL Editor'da:

```sql
-- Garson kullanıcısı ekle
INSERT INTO public.users (id, name, role, email, restaurant_id)
VALUES (
  'BURAYA_GARSON_UUID_YAPISTIRIN',
  'Garson 1',
  'waiter',
  'garson1@restaurant.com',
  'BURAYA_RESTORAN_ID_YAPISTIRIN'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    restaurant_id = EXCLUDED.restaurant_id;
```

### Adım 3: Test Verileri (İsteğe Bağlı)

Eğer test için masa ve ürünler eklemek isterseniz:

1. SQL Editor'da `supabase/seed.sql` dosyasındaki komutları çalıştırın
2. Veya manuel olarak Table Editor'dan ekleyebilirsiniz:
   - **Table Editor** → `tables` → Yeni masa ekleyin
   - **Table Editor** → `products` → Yeni ürünler ekleyin

---

## ✅ Test ve Kontrol

### 1. Uygulamayı Açın

1. Vercel'de deploy edilen URL'nize gidin
2. Örnek: `https://restaurant-order-app.vercel.app`

### 2. Giriş Yapın

1. Ana sayfada "Giriş Yap" butonuna tıklayın
2. Admin email ve şifresini girin
3. Admin paneline yönlendirilmelisiniz

### 3. Özellikleri Test Edin

- ✅ Admin paneli açılıyor mu?
- ✅ Menü yönetimi çalışıyor mu?
- ✅ Masa yönetimi çalışıyor mu?
- ✅ Sipariş alma çalışıyor mu?
- ✅ Garson paneli çalışıyor mu?

### 4. Mobil Test

1. Telefonunuzdan Vercel URL'sini açın
2. PWA olarak kurulumu test edin (aşağıdaki bölüme bakın)

---

## 📱 Telefona Kurulum (PWA)

Uygulamanız PWA (Progressive Web App) olarak çalışır, yani telefona kurulabilir!

### Android (Chrome)

1. Chrome tarayıcısında Vercel URL'nizi açın
2. Sağ üstteki menü (⋮) → **"Ana ekrana ekle"** veya **"Add to Home screen"**
3. İsim verin (örn: "Restoran Sipariş")
4. **"Ekle"** butonuna tıklayın
5. Ana ekranda uygulama ikonu görünecek
6. İkona tıklayarak native uygulama gibi kullanabilirsiniz

### iOS (Safari)

1. Safari'de Vercel URL'nizi açın
2. Alt kısımdaki paylaş butonuna (□↑) tıklayın
3. **"Ana Ekrana Ekle"** veya **"Add to Home Screen"** seçin
4. İsim verin
5. **"Ekle"** butonuna tıklayın
6. Ana ekranda uygulama ikonu görünecek

### PWA Özellikleri

- ✅ Ana ekranda ikon
- ✅ Tam ekran modu
- ✅ Hızlı erişim
- ✅ Offline çalışma (sınırlı)

---

## 🔄 Güncellemeleri Yayınlama

Uygulamanızı güncellemek için:

1. Kod değişikliklerini yapın
2. Değişiklikleri commit edin:
   ```bash
   git add .
   git commit -m "Update: Yapılan değişiklikler"
   git push
   ```
3. Vercel otomatik olarak yeni deploy başlatacak
4. 2-3 dakika içinde güncellemeler canlıya alınacak

---

## 🐛 Sorun Giderme

### Build Hatası

**Hata**: "Build failed"

**Çözüm**:
1. Vercel Dashboard'da **Deployments** → **Build Logs** kontrol edin
2. Hata mesajını okuyun
3. Genellikle environment variables eksik olabilir
4. Environment Variables'ı kontrol edin

### Environment Variables Çalışmıyor

**Hata**: "Supabase env variables are missing"

**Çözüm**:
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` var mı kontrol edin
3. Değerler doğru mu kontrol edin
4. Environment'ları (Production, Preview, Development) kontrol edin
5. Değişiklik yaptıysanız yeniden deploy edin

### Giriş Yapamıyorum

**Hata**: Kullanıcı oluşturulmadı

**Çözüm**:
1. Supabase → **Authentication** → **Users** kontrol edin
2. Kullanıcı var mı?
3. SQL Editor'da users tablosuna eklendi mi kontrol edin
4. Restaurant_id atandı mı kontrol edin

### Veritabanı Hatası

**Hata**: "relation does not exist"

**Çözüm**:
1. `supabase/schema.sql` dosyasını tamamen çalıştırdığınızdan emin olun
2. Supabase → **Table Editor** → Tablolar var mı kontrol edin
3. Eksik tabloları manuel oluşturun

### PWA Kurulumu Çalışmıyor

**Hata**: "Add to Home Screen" görünmüyor

**Çözüm**:
1. HTTPS kullanıldığından emin olun (Vercel otomatik sağlar)
2. `manifest.json` dosyasının mevcut olduğunu kontrol edin
3. Browser console'u kontrol edin (F12)
4. Icon dosyaları (`icon-192.png`, `icon-512.png`) eksik olabilir (opsiyonel)

---

## 📞 Destek

### Yardım Gereken Durumlar

1. **Browser Console**: F12 → Console sekmesinde hataları kontrol edin
2. **Vercel Logs**: Vercel Dashboard → Deployments → Build/Function Logs
3. **Supabase Logs**: Supabase Dashboard → Logs
4. **GitHub Issues**: Proje repository'sinde issue açın

### Kontrol Listesi

Deployment öncesi kontrol edin:

- [ ] `npm run build` hatasız çalışıyor mu?
- [ ] Environment variables doğru mu?
- [ ] Supabase projesi oluşturuldu mu?
- [ ] Database schema çalıştırıldı mı?
- [ ] Admin kullanıcısı oluşturuldu mu?
- [ ] Restoran oluşturuldu mu?
- [ ] Admin restorana bağlandı mı?
- [ ] Vercel deploy başarılı mı?
- [ ] Giriş yapılabiliyor mu?
- [ ] Temel özellikler çalışıyor mu?

---

## 🎉 Başarılı Kurulum!

Uygulamanız artık canlıda! 

**Sonraki Adımlar**:
1. ✅ Admin panelinden restoran bilgilerini güncelleyin
2. ✅ Masalar ekleyin
3. ✅ Menü ürünlerini ekleyin
4. ✅ Garson kullanıcıları oluşturun
5. ✅ Kullanıcılara giriş bilgilerini paylaşın
6. ✅ Telefona kurulum yapın

**İyi çalışmalar! 🚀**

---

## 📝 Ek Notlar

### Özel Domain (Opsiyonel)

1. Vercel Dashboard → **Settings** → **Domains**
2. Domain adınızı ekleyin
3. DNS ayarlarını yapın (Vercel talimatları takip edin)

### Backup

- Supabase otomatik backup yapar
- Ancak önemli veriler için manuel backup alın
- SQL Editor'dan export yapabilirsiniz

### Güvenlik

- ✅ Environment variables asla public repository'ye commit etmeyin
- ✅ Supabase RLS (Row Level Security) aktif
- ✅ HTTPS zorunlu (Vercel otomatik sağlar)
- ✅ Güçlü şifreler kullanın
