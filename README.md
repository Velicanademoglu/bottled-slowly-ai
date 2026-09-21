# Bottled Slowly AI

AI destekli konuşma başlatıcılı, yavaş teslimatlı ve profil tabanlı arkadaşlık / mesajlaşma uygulaması.

## Teknik Stack

- **Backend:** Node.js + Express + TypeScript
- **Veritabanı:** SQLite + Prisma ORM (yerel geliştirmede; üretimde PostgreSQL'e geçilebilir)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Kimlik doğrulama:** JWT
- **AI:** OpenAI GPT-4o-mini API veya yerleşik fallback
- **Güvenlik:** Helmet, express-rate-limit, bcrypt, güçlü şifre politikası

## Özellikler

- Kayıt / giriş (JWT, şifre güçlülük kontrolü)
- Kullanıcı profili (biyografi, yaş, konum, ilgi alanları, avatar)
- Diğer kullanıcıları keşfetme
- Arkadaşlık isteği gönderme / kabul etme / reddetme
- Yavaş teslimatlı mesajlaşma (mesaj belirli süre sonra ulaşır)
- Mesaj durumları: Şişede / Yolda / Ulaştı
- AI konuşma başlatıcı
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
DATABASE_URL="file:./dev.db"
JWT_SECRET="degistir-bu-gizli-anahtari-uretimde-kesinlikle-guclu-olmalidir"
OPENAI_API_KEY=""
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

Frontend `.env` için:

```env
VITE_API_URL=http://localhost:3001
```

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
