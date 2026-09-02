Set-Location "C:\Users\Lenovo\.verdent\verdent-projects\bottled-slowly-ai"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Bottled Slowly AI - Baslatma Scripti" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Bagimliliklar yukleniyor (ilk sefer uzun surebilir)..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "HATA: npm install basarisiz." -ForegroundColor Red
    Read-Host "Devam etmek icin Enter'a bas"
    exit 1
}

Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "HATA: backend npm install basarisiz." -ForegroundColor Red
    Read-Host "Devam etmek icin Enter'a bas"
    exit 1
}

Set-Location ..\frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "HATA: frontend npm install basarisiz." -ForegroundColor Red
    Read-Host "Devam etmek icin Enter'a bas"
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "[2/5] .env dosyalari kontrol ediliyor..."
if (-not (Test-Path "backend\.env")) {
    @'
DATABASE_URL="file:./dev.db"
JWT_SECRET="degistir-bu-gizli-anahtari"
OPENAI_API_KEY=""
PORT=3001
'@ | Set-Content "backend\.env" -Encoding UTF8
    Write-Host "backend\.env olusturuldu." -ForegroundColor Green
} else {
    Write-Host "backend\.env zaten var, atlaniyor."
}

if (-not (Test-Path "frontend\.env")) {
    "VITE_API_URL=http://localhost:3001" | Set-Content "frontend\.env" -Encoding UTF8
    Write-Host "frontend\.env olusturuldu." -ForegroundColor Green
} else {
    Write-Host "frontend\.env zaten var, atlaniyor."
}

Write-Host ""
Write-Host "[3/5] Veritabani hazirlaniyor..."
Set-Location backend
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host "HATA: Prisma migrate basarisiz." -ForegroundColor Red
    Read-Host "Devam etmek icin Enter'a bas"
    exit 1
}

npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "HATA: Prisma generate basarisiz." -ForegroundColor Red
    Read-Host "Devam etmek icin Enter'a bas"
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "[4/5] Uygulama baslatiliyor..."
Write-Host "Tarayici: http://localhost:5173"
Write-Host "API: http://localhost:3001"
Write-Host "Kapatmak icin Ctrl+C yapabilirsin."
Write-Host ""
npm run dev

Read-Host "Devam etmek icin Enter'a bas"
