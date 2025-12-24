# Bot Pemantau Stok Emas Antam

Bot Node.js untuk memantau ketersediaan stok emas di [logammulia.com](https://www.logammulia.com/id/purchase/gold) dengan fitur anti-detection, optimasi RAM, dan notifikasi Telegram.

## ✨ Fitur

- 🔒 **Puppeteer Stealth** - Bypass Cloudflare dengan stealth plugin
- ⏰ **Jadwal Otomatis** - Aktif Senin-Jumat 08:00-17:00 WIB
- 🎲 **Interval Acak** - 45-90 detik untuk menghindari deteksi
- 💾 **Optimasi RAM** - Request interception & Chromium flags untuk VPS 2GB
- 🤖 **Simulasi Manusia** - Mouse movement & smooth scroll
- 📱 **Notifikasi Telegram** - Alert hanya saat status berubah
- 🛡️ **Anti-Block** - Auto cooldown 30 menit jika terdeteksi
- ♻️ **Memory Management** - Browser restart setiap 15 checks

## 📋 Prasyarat

- Node.js 18+ 
- NPM atau Yarn
- VPS Linux (recommended: 2 vCPU, 2GB RAM)
- Telegram Bot Token

## 🚀 Instalasi

### 1. Clone & Install Dependencies

```bash
cd Project-scrap
npm install
```

### 2. Konfigurasi Telegram

1. Buat bot di Telegram via [@BotFather](https://t.me/BotFather):
   - Ketik `/newbot`
   - Ikuti instruksi untuk membuat bot
   - Salin **Bot Token**

2. Dapatkan Chat ID:
   - Kirim pesan ke bot Anda
   - Kunjungi `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Cari nilai `chat.id` di response

3. Setup environment:

```bash
cp .env.example .env
```

4. Edit file `.env`:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### 3. Jalankan Bot

```bash
# Development
npm start

# Atau dengan auto-restart
npm run dev
```

## 🖥️ Deployment di VPS

### Dengan PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start app.js --name antam-monitor

# Enable auto-start on reboot
pm2 startup
pm2 save

# Monitor logs
pm2 logs antam-monitor

# Restart bot
pm2 restart antam-monitor

# Stop bot
pm2 stop antam-monitor
```

### Dengan Systemd

Buat file `/etc/systemd/system/antam-monitor.service`:

```ini
[Unit]
Description=Antam Gold Stock Monitor
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/Project-scrap
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Kemudian:

```bash
sudo systemctl daemon-reload
sudo systemctl enable antam-monitor
sudo systemctl start antam-monitor
sudo systemctl status antam-monitor
```

## ⚙️ Konfigurasi

Edit `src/config/index.js` untuk menyesuaikan:

| Setting | Default | Deskripsi |
|---------|---------|-----------|
| `schedule.workDays` | `[1,2,3,4,5]` | Hari aktif (1=Senin) |
| `schedule.startHour` | `8` | Jam mulai |
| `schedule.endHour` | `17` | Jam selesai |
| `intervals.minCheck` | `45000` | Interval minimum (ms) |
| `intervals.maxCheck` | `90000` | Interval maximum (ms) |
| `browserRestartThreshold` | `15` | Restart browser setiap N checks |

## 📊 Struktur Project

```
Project-scrap/
├── app.js                    # Entry point
├── src/
│   ├── config/
│   │   └── index.js          # Konfigurasi terpusat
│   ├── core/
│   │   └── bot.js            # Main loop & orchestration
│   ├── services/
│   │   ├── telegram.js       # Notifikasi Telegram
│   │   └── stockChecker.js   # Puppeteer & scraping
│   └── utils/
│       ├── scheduler.js      # Jadwal & interval
│       └── humanBehavior.js  # Simulasi perilaku manusia
├── .env                      # Environment variables (buat sendiri)
├── .env.example              # Template environment
├── package.json
└── README.md
```

## 🔧 Troubleshooting

### Browser tidak bisa launch

```bash
# Install dependencies Chromium di Ubuntu/Debian
sudo apt update
sudo apt install -y chromium-browser \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxcomposite1 \
  libxdamage1 libxrandr2 libgbm1 \
  libasound2 libpangocairo-1.0-0 \
  libgtk-3-0
```

### Memory usage tinggi

- Pastikan request interception aktif
- Kurangi `browserRestartThreshold` ke 10
- Tambahkan swap memory di VPS

### Sering terdeteksi (403)

- Tingkatkan interval minimum ke 60 detik
- Aktifkan VPN/proxy di VPS
- Gunakan residential proxy

## 📝 License

MIT License
