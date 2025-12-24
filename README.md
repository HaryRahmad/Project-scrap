# SaaS Multi-User Gold Stock Monitor

Platform web untuk memantau stok emas Antam dengan fitur multi-user, dashboard real-time, dan notifikasi Telegram.

## ✨ Fitur

- 🔐 **Authentication** - Register/Login dengan JWT
- 📊 **Dashboard** - Tampilan status stok real-time
- ⚙️ **Settings** - Pilih lokasi butik & filter berat emas
- 📱 **Telegram Notifications** - Notifikasi per-user berdasarkan preferensi
- 🤖 **Smart Checker** - Scrape shared per-lokasi (hemat resource)
- 🔒 **Stealth Mode** - Puppeteer dengan anti-detection

## 🏗️ Arsitektur

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Client    │────▶│   Server    │────▶│  PostgreSQL  │
│  (React)    │     │  (Express)  │     │              │
└─────────────┘     └─────────────┘     └──────────────┘
                                              ▲
                    ┌─────────────┐           │
                    │   Checker   │───────────┘
                    │ (Puppeteer) │──────▶ Telegram
                    └─────────────┘
```

## 📁 Struktur Project

```
Project-scrap/
├── server/                    # Backend API
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── helpers/
│   ├── prisma/
│   └── app.js
│
├── checker/                   # Bot Multi-User
│   └── src/
│       ├── services/
│       └── utils/
│
├── client/                    # React Frontend
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── layouts/
│       ├── store/
│       └── helpers/
│
├── ecosystem.config.js       # PM2 config
└── README.md
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm/yarn

### 2. Setup Database

```bash
# Buat database PostgreSQL
createdb antam_monitor
```

### 3. Setup Server

```bash
cd server
cp .env.example .env
# Edit .env dengan kredensial database

npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 4. Setup Checker

```bash
cd checker
cp .env.example .env
# Edit .env (DATABASE_URL & TELEGRAM_BOT_TOKEN)

npm install
npm run dev
```

### 5. Setup Client

```bash
cd client
npm install
npm run dev
```

## 🔧 Environment Variables

### Server (.env)
```env
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/antam_monitor"
JWT_SECRET=your-secret-key
```

### Checker (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/antam_monitor"
TELEGRAM_BOT_TOKEN=your-bot-token
```

## 🖥️ Deployment (VPS)

```bash
# Install PM2
npm install -g pm2

# Build client
cd client && npm run build

# Start services
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
pm2 startup
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET | /api/settings | Get user settings |
| PUT | /api/settings | Update settings |
| GET | /api/stock | Get stock for user |
| GET | /api/locations | Get all locations |

## 📝 License

MIT License
