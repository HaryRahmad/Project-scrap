# SaaS Multi-User Gold Stock Monitor

Platform web untuk memantau stok emas Antam dengan fitur multi-user, dashboard real-time, dan notifikasi Telegram.

## ✨ Fitur

- 🔐 **Authentication** - Register/Login dengan JWT
- 📊 **Dashboard** - Tampilan status stok real-time
- ⚙️ **Settings** - Pilih lokasi butik & filter berat emas
- 📱 **Telegram Notifications** - Notifikasi per-user berdasarkan preferensi
- 🤖 **Smart Checker** - Scrape shared per-lokasi (hemat resource)
- 🔒 **Stealth Mode** - Puppeteer dengan anti-detection

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
