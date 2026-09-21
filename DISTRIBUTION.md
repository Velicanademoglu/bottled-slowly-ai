# PROJECT STAR - Bireysel Dağıtım ve Para Kazanma Rehberi

Bu rehber, uygulamayı henüz App Store / Play Store’a yüklemeden kendi kanallarınla (sosyal medya, forum, Telegram, WhatsApp, web sitesi vb.) dağıtmak ve reklamlardan gelir elde etmek için gereken adımları açıklar.

## 1. Backend’i İnternete Açmak

Mevcut APK, yerel ağdaki bilgisayarına (`192.168.2.94:3001`) bağlanıyor. Dağıtıma başlamadan önce backend’i internete açmalısın.

### Hızlı ve Ucuz Seçenekler

- **Railway / Render / Fly.io**: GitHub reposunu bağla, otomatik deploy et. Ücretsiz katmanlar sınırlıdır ama başlangıç için yeterlidir.
- **DigitalOcean / Hetzner / AWS Lightsail VPS**: Aylık 5–10$ civarı. Daha kontrollü ve ölçeklenebilir.
- **Ev bilgisayarı + tünel**: Cloudflare Tunnel veya ngrok ile geçici açabilirsin ama 50 bin kullanıcı için önerilmez.

### Backend Deployment Kontrol Listesi

1. `DATABASE_URL` ortam değişkenini PostgreSQL bağlantı dizisine ayarla.
2. `JWT_SECRET` ortam değişkenini güçlü ve rastgele bir değer yap.
3. `FRONTEND_URL` ortam değişkenini pazarlama domainine ayarla.
4. SMTP ayarlarını (Gmail, SendGrid, Mailgun vb.) e-posta doğrulama ve şifre sıfırlama için yap.
5. `npm run db:seed` komutunu çalıştırarak bot kullanıcıları ve örnek içerikleri oluştur.
6. HTTPS zorunlu. Cloudflare veya Nginx + Let’s Encrypt kullan.

### Örnek Üretim Ortam Değişkenleri

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:password@host:5432/projectstar"
JWT_SECRET="rastgele-64-karakter-olmalı"
FRONTEND_URL="https://projectstar.app"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 2. Frontend Build Ayarları

`frontend/.env.production` dosyasını oluştur (eğer yoksa):

```env
VITE_API_URL=https://api.projectstar.app
VITE_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Build komutu:

```bash
cd frontend
npm install
npm run build
npx cap copy android
```

## 3. APK İmzalama ve Dağıtım

Debug APK yalnızca kendi testin için uygundur. 50 bin kişiye dağıtmak için **release APK** veya **AAB** imzalamalısın.

### Keystore Oluştur

```bash
cd frontend/android/app
keytool -genkey -v -keystore projectstar.keystore -alias projectstar -keyalg RSA -keysize 2048 -validity 10000
```

### İmzalı Release APK Build Et

`frontend/android/app/build.gradle` içinde signingConfig eklenebilir veya Android Studio kullanılabilir:

```bash
cd frontend/android
./gradlew assembleRelease
```

Çıktı: `frontend/android/app/build/outputs/apk/release/app-release.apk`

**Önemli:** Keystore dosyasını ve şifrelerini asla kaybetme. Aynı keystore olmadan uygulamayı güncelleyemezsin.

### Bireysel Dağıtım Kanalları

- Kendi web sitende doğrudan APK indirme bağlantısı.
- Telegram kanalı / grup.
- Twitter/X, Instagram, TikTok tanıtım videoları.
- Reddit (r/androidapps, ülke özel subredditler).
- Türkçe forumlar ve Discord sunucuları.
- QR kod ile paylaşma.

## 4. Reklam Entegrasyonu (AdMob)

### Adım 1: AdMob Hesabı Aç

- https://admob.google.com adresinden hesap oluştur.
- Yeni bir uygulama ekle ve paket adını `app.projectstar.mobile` olarak kaydet.
- Publisher ID’ni al ve `frontend/public/app-ads.txt` içindeki `pub-REPLACE_WITH_YOUR_ADMOB_PUBLISHER_ID` kısmını güncelle.

### Adım 2: app-ads.txt Yayınla

`frontend/public/app-ads.txt` dosyasını alan adının kök dizinine yükle:

```
https://projectstar.app/app-ads.txt
```

AdMob bu dosyayı periyodik olarak tarar. Eksikse gelirler düşer.

### Adım 3: Reklam Birimleri Oluştur

Önerilen birimler:

| Birim | Tür | Kullanım Yeri |
|-------|-----|---------------|
| `rewarded_stardust` | Rewarded | Stardust kazanmak için |
| `rewarded_extra_cast` | Rewarded | Ekstra mesaj hakkı için |
| `interstitial_cast_done` | Interstitial | Mesaj fırlatıldıktan sonra |
| `interstitial_discovery` | Interstitial | Keşif ekranı geçişlerinde |
| `banner_profile` | Banner | Profil / mağaza alt kısmı |

### Adım 4: Plugin Ekle

```bash
cd frontend
npm install admob-plus-cordova
npx cap sync android
```

Sonra `frontend/src/native/ad.ts` içindeki abstraction’u gerçek AdMob çağrılarıyla doldur.

## 5. Para Kazanma Tahmini (50.000 İndirme)

Aşağıdaki tahminler çok değişkenlik gösterir; kesin gelir garantisi değildir.

### Varsayımlar

- 50.000 toplam indirme.
- Aktif kullanıcı oranı (MAU): indirmenin %30–40’ı = 15.000–20.000 aylık aktif.
- Günlük aktif kullanıcı (DAU): MAU’un %15–20’si = 2.250–4.000.

### Rewarded Ads Geliri

- Günlük izlenen reklam: DAU başına 1–2 adet.
- eCPM (Türkiye): 0.30–1.00$; (Global karışık): 1.00–3.00$.
- Günlük izlenme: 3.000 adet.
- Aylık gelir: **90–450$** arası.

### Interstitial Ads Geliri

- Günlük gösterim: DAU başına 2–3 adet.
- eCPM: 0.20–0.80$.
- Aylık gelir: **40–300$** arası.

### Banner Ads Geliri

- Düşük etkileşim; aylık **10–50$** civarı.

### In-App Purchases (Stardust / Premium)

- Dönüşüm oranı düşüktür (%0.5–2 arası).
- Aylık gelir: **100–1.000$** (ürün fiyatlandırmasına göre).

### Toplam Aylık Tahmin

| Senaryo | Reklam Geliri | IAP Geliri | Toplam |
|---------|---------------|------------|--------|
| Kötü | 50$ | 50$ | ~100$ |
| Ortalama | 250$ | 300$ | ~550$ |
| İyi | 700$ | 1.000$ | ~1.700$ |

**Not:** Para kazanmak için kullanıcıları reklama boğma. Reklam dengesi iyi olursa kullanıcı kalır, kötü olursa uygulamayı siler.

## 6. Yasal ve Gizlilik

- **Gizlilik politikası:** `https://projectstar.app/privacy` adresinde yayınla. (Mevcut `PrivacyPolicyPage.tsx` kullanılabilir.)
- **Kullanım şartları:** `https://projectstar.app/terms` adresinde yayınla. (Mevcut `TermsPage.tsx` kullanılabilir.)
- **KVKK metni:** Türkiye kullanıcıları için açık rıza metni ekle. (Mevcut `KVKKPage.tsx` kullanılabilir.)
- **Yaş sınırı:** Uygulamayı 18+ olarak konumlandır. Kayıtta doğum tarihi doğrulaması çalışıyor.
- **Reklam izni:** Avrupa kullanıcıları için GDPR/UMP onay ekranı ekle. AdMob UMP SDK’sı kullanılabilir.

## 7. Sıradaki Adımlar

1. Backend’i bir VPS/cloud’a taşı ve domain bağla.
2. `VITE_API_URL`’i üretim domainiyle güncelle.
3. Release APK imzala.
4. AdMob hesabı aç ve `app-ads.txt` yayınla.
5. Sosyal medya tanıtımına başla.
6. Kullanıcı geri bildirimlerini topla ve ilk güncellemeyi planla.

---

**Hatırlatma:** Mevcut debug APK yalnızca aynı Wi-Fi ağındaki bilgisayarda çalışır. Dağıtıma başlamadan önce üretim backend’ini hazır etmelisin.
