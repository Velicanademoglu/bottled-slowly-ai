# Bottled Slowly AI - MVP Prototipi

Yavaş teslimatlı, AI destekli konuşma başlatıcılı web tabanlı mesajlaşma uygulaması prototipi.

## Teknik Stack

- **Backend:** Node.js + Express + TypeScript
- **Veritabanı:** PostgreSQL + Prisma ORM
- **Frontend:** React + Vite + TypeScript
- **Kimlik doğrulama:** JWT
- **AI:** OpenAI GPT-4o-mini API (düşük maliyetli) veya fallback

## Yerel Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 2. Ortam değişkenlerini ayarla
# .env.example dosyalarını kopyala ve kendi değerlerini gir
# Yerel geliştirme için PostgreSQL çalıştırıyor olmalısın.

# 3. Veritabanını oluştur
cd backend
npx prisma migrate dev --name init
npx prisma generate
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
JWT_SECRET="degistir-bu-gizli-anahtari"
OPENAI_API_KEY=""
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

Frontend `.env` için:

```env
VITE_API_URL=http://localhost:3001
```

## Deploy

### 1. GitHub'a push et

```bash
git init
git add .
git commit -m "initial MVP"
git remote add origin https://github.com/Velicanademoglu/bottled-slowly-ai.git
git push -u origin main
```

### 2. Render'da backend deploy

- [Render Dashboard](https://dashboard.render.com/)'a git
- "New +" → "Blueprint" seç ve repo'daki `render.yaml` kullan
- Veya elle:
  - "New +" → "PostgreSQL" → ücretsiz veritabanı oluştur
  - "New +" → "Web Service" → GitHub repo'sunu bağla
  - Root directory: `backend`
  - Build Command: `npm install && npx prisma migrate deploy && npx prisma generate && npm run build`
  - Start Command: `npm start`
  - Environment Variables:
    - `DATABASE_URL`: Render PostgreSQL connection string
    - `JWT_SECRET`: güçlü rastgele string
    - `OPENAI_API_KEY`: (opsiyonel) boş bırakılırsa fallback çalışır
    - `PORT`: 3001
    - `FRONTEND_URL`: Vercel frontend URL'n (deploy sonrası güncelle)

### 3. Vercel'de frontend deploy

```bash
# Vercel CLI yüklü değilse
npm i -g vercel

# Deploy et
vercel
```

Veya Vercel Dashboard üzerinden:
- Proje import et
- Framework preset: Vite
- Build Command: `cd frontend && npm install && npm run build`
- Output Directory: `frontend/dist`
- Environment Variable: `VITE_API_URL=https://bottled-slowly-ai-api.onrender.com`

## AI Fallback

`OPENAI_API_KEY` boş veya geçersizse, uygulama yerleşik rastgele konuşma başlatıcıları kullanır.

## Gizlilik / KVKK Notları

Bu bir MVP prototipidir. Üretim kullanımına geçmeden önce:

- Açık rıza metni ve kullanıcı sözleşmesi hazırlanmalı
- Kişisel verilerin saklanma süresi ve amacı belirtilmeli
- Veri silme / dışa aktarma mekanizmaları eklenmeli
- HTTPS ve güvenli JWT yönetimi zorunludur
- AI API'ye gönderilen verilerin gizlilik politikası kullanıcıya açıklanmalı

## Geliştirme Komutları

```bash
npm run dev      # backend + frontend eşzamanlı
npm run backend  # sadece backend
npm run frontend # sadece frontend
```

