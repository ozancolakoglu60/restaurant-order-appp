# 📱 TestSpirit ile Test Etme Rehberi

## 🔧 Sorun ve Çözüm

TestSpirit (veya diğer mobil test cihazları) uygulamanıza bağlanamıyorsa, genellikle şu sorunlar vardır:

1. ❌ Next.js sadece `localhost`'ta dinliyor
2. ❌ CORS headers eksik
3. ❌ Firewall engelliyor
4. ❌ Yanlış IP adresi kullanılıyor

---

## ✅ Çözüm Adımları

### 1. Bilgisayarınızın IP Adresini Öğrenin

**Windows:**
```bash
ipconfig
```
IPv4 Address'i bulun (örn: `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# veya
ip addr
```

### 2. Uygulamayı Network Modunda Başlatın

**Development modu için:**
```bash
npm run dev:network
```

**Production modu için:**
```bash
npm run build
npm run start:network
```

Bu komutlar uygulamayı `0.0.0.0` üzerinde başlatır, yani **tüm network interface'lerinden** erişilebilir.

### 3. TestSpirit'te Doğru URL Kullanın

❌ **YANLIŞ:**
```
http://localhost:3000
```

✅ **DOĞRU:**
```
http://192.168.1.100:3000
```
(Bilgisayarınızın gerçek IP adresini kullanın)

### 4. Firewall'u Kontrol Edin

**Windows:**
1. Windows Defender Firewall → "Allow an app through firewall"
2. Node.js veya Next.js'i ekleyin
3. Veya geçici olarak 3000 portunu açın

**Komut satırından (Yönetici olarak):**
```bash
netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000
```

### 5. Aynı Wi-Fi Ağında Olduğunuzdan Emin Olun

- TestSpirit cihazı ve bilgisayarınız **aynı Wi-Fi ağında** olmalı
- Farklı ağlarda iseniz, port forwarding veya ngrok gibi bir tunnel servisi kullanmanız gerekir

---

## 🚀 Hızlı Test

### Adım 1: Uygulamayı Başlatın
```bash
npm run dev:network
```

### Adım 2: IP Adresinizi Kontrol Edin
```bash
ipconfig
```

### Adım 3: TestSpirit'te Bağlanın
- TestSpirit uygulamasını açın
- URL alanına: `http://192.168.1.100:3000` yazın (IP'nizi kullanın)
- Bağlanın

---

## 🔍 Sorun Giderme

### "Connection refused" Hatası

**Çözüm 1:** IP adresini kontrol edin
```bash
ipconfig
# IPv4 Address'i doğru yazdığınızdan emin olun
```

**Çözüm 2:** Port'un açık olduğundan emin olun
```bash
netstat -an | findstr :3000
# LISTENING görünmeli
```

**Çözüm 3:** Uygulamanın `0.0.0.0` üzerinde dinlediğinden emin olun
- Terminal çıktısında şunu görmelisiniz: `- Local: http://0.0.0.0:3000`

### "CORS Error" Hatası

**Çözüm:** CORS headers zaten eklendi, ancak hala sorun varsa:
1. Browser cache'ini temizleyin
2. Uygulamayı yeniden başlatın
3. TestSpirit'i yeniden başlatın

### "Timeout" Hatası

**Çözüm:**
1. Firewall kurallarını kontrol edin
2. Antivirus yazılımını geçici olarak kapatın
3. VPN kullanıyorsanız kapatın

---

## 🌐 Alternatif: Ngrok Kullanımı (Farklı Ağlar İçin)

Eğer TestSpirit cihazınız farklı bir ağdaysa (örn: mobil data), ngrok kullanabilirsiniz:

1. **Ngrok'u indirin:** https://ngrok.com
2. **Kurulum yapın** ve hesap oluşturun
3. **Tunnel oluşturun:**
   ```bash
   ngrok http 3000
   ```
4. **Ngrok URL'ini kopyalayın** (örn: `https://abc123.ngrok.io`)
5. **TestSpirit'te bu URL'i kullanın**

**Not:** Ücretsiz ngrok URL'leri her yeniden başlatmada değişir.

---

## ✅ Başarı Kontrolü

Başarılı bağlantı için:
1. ✅ Uygulama `0.0.0.0:3000` üzerinde çalışıyor
2. ✅ IP adresi doğru
3. ✅ Firewall açık
4. ✅ Aynı Wi-Fi ağında
5. ✅ TestSpirit'te doğru URL girilmiş

---

## 📞 Ek Yardım

Sorun devam ederse:
1. Browser console'u kontrol edin (F12)
2. Terminal çıktısını kontrol edin
3. TestSpirit log'larını kontrol edin
4. Network bağlantısını test edin (ping ile)

**Test için:**
```bash
# TestSpirit cihazından bilgisayarınıza ping atın
ping 192.168.1.100
```

Eğer ping çalışıyorsa, sorun uygulama konfigürasyonundadır.
Eğer ping çalışmıyorsa, sorun network bağlantısındadır.
