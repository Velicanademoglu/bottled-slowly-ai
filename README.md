# Bottled Slowly AI

AI destekli konuşma başlatıcılı, yavaş teslimatlı ve profil tabanlı arkadaşlık / mesajlaşma uygulaması.

## Teknik Stack

- **Backend:** Node.js + Express + TypeScript
- **Veritabanı:** PostgreSQL + Prisma ORM (üretim); SQLite yerel geliştirmede `prisma db push` ile
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Kimlik doğrulama:** JWT
- **AI:** OpenAI GPT-4o-mini API veya yerleşik fallback
- **Güvenlik:** Helmet, express-rate-limit, bcrypt, güçlü şifre politikası
- **PWA:** vite-plugin-pwa ile service worker ve offline desteği

## Özellikler

- Kayıt / giriş (JWT, şifre güçlülük kontrolü)
- Kullanıcı profili (biyografi, yaş, konum, ilgi alanları, avatar)
- Diğer kullanıcıları keşfetme
- Arkadaşlık isteği gönderme / kabul etme / reddetme
- Yavaş teslimatlı mesajlaşma (mesaj belirli süre sonra ulaşır)
- Mesaj durumları: Şişede / Yolda / Ulaştı
- AI konuşma başlatıcı (6 farklı persona)
- AI yanıt önerileri
- Mesaj şablonları
- Açık / koyu tema geçişi
- PWA desteği
- Admin paneli, raporlama, stardust ödül sistemi
- Responsive, modern ve animasyonlu arayüz

## Yerel Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 2. Ortam değişkenlerini ayarla
# .env.example dosyalarını kopyala ve kendi değerlerini gir
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Veritabanını oluştur
cd backend
npx prisma db push
cd ..

# 4. Hem backend hem frontend'i aynı anda çalıştır
npm run dev
```

Uygulama:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Çevre Değişkenleri

Backend `.env` için:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bottled_slowly_ai?schema=public"
JWT_SECRET="degistir-bu-gizli-anahtari-uretimde-kesinlikle-guclu-olmalidir"
OPENAI_API_KEY=""
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

Frontend `.env` için:

```env
VITE_API_URL=http://localhost:3001
```

## Deploy

### Render (Backend)

1. [Render Dashboard](https://dashboard.render.com/)'a git.
2. "New +" → "Blueprint" seç ve repo'daki `render.yaml` kullan.
3. Render otomatik olarak ücretsiz PostgreSQL ve Web Service oluşturur.
4. Build sonrası `FRONTEND_URL` değişkenini Vercel URL'n ile güncelle.

### Vercel (Frontend)

```bash
npm i -g vercel
vercel
```

Veya Vercel Dashboard üzerinden:
- Proje import et
- Framework preset: Vite
- Build Command: `cd frontend && npm install && npm run build`
- Output Directory: `frontend/dist`
- Environment Variable: `VITE_API_URL=https://bottled-slowly-ai-api.onrender.com`

## Geliştirme Komutları

```bash
npm run dev      # backend + frontend eşzamanlı
npm run backend  # sadece backend
npm run frontend # sadece frontend
```

## Güvenlik

- `helmet` ile güvenlik başlıkları
- `express-rate-limit` ile API hız sınırlaması (auth endpointlerine ek kısıtlama)
- Şifreler bcrypt ile hashlenir
- JWT ile kimlik doğrulama
- Şifre politikası: en az 8 karakter, bir harf ve bir rakam

## AI Fallback

`OPENAI_API_KEY` boş veya geçersizse, uygulama yerleşik rastgele konuşma başlatıcıları kullanır.

## Gizlilik / KVKK Notları

Bu bir MVP prototipidir. Üretim kullanımına geçmeden önce:

- Açık rıza metni ve kullanıcı sözleşmesi hazırlanmalı
- Kişisel verilerin saklanma süresi ve amacı belirtilmeli
- Veri silme / dışa aktarma mekanizmaları eklenmeli
- HTTPS ve güvenli JWT yönetimi zorunludur
- AI API'ye gönderilen verilerin gizlilik politikası kullanıcıya açıklanmalı
