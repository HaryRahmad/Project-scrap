# Antam Gold Stock Monitor

Scraper untuk monitoring stock emas batangan dari logammulia.com.

## Files

| File | Deskripsi |
|------|-----------|
| `scraper_ultrafast.py` | Main scraper, ultra-fast (~7-8 detik) |
| `scheduler.py` | Scheduler run otomatis + Telegram notification |
| `cookie_manager.py` | Helper untuk manage cookies |
| `requirements.txt` | Python dependencies |

## Setup

### 1. Install Dependencies
```bash
cd checker/python
pip install -r requirements.txt
```

### 2. Telegram Configuration
Scheduler akan otomatis baca `TELEGRAM_BOT_TOKEN` dari `server/.env`.

Tambahkan `TELEGRAM_CHAT_ID` ke environment:
```bash
# Windows
set TELEGRAM_CHAT_ID=your_chat_id

# Linux/Mac
export TELEGRAM_CHAT_ID=your_chat_id
```

Atau tambahkan ke `server/.env`:
```
TELEGRAM_CHAT_ID=your_chat_id
```

## Usage

### Manual Scrape
```bash
python scraper_ultrafast.py --location=bandung
```

### Auto Scheduler (Lokal)
```bash
python scheduler.py
```

Scheduler akan:
- Check setiap ~1 menit (dengan variasi ±15 detik)
- Kirim notifikasi Telegram jika stock tersedia
- Log semua aktivitas ke console

## Lokasi Tersedia

| Kode | Lokasi |
|------|--------|
| bandung | Bandung |
| jakarta | Jakarta |
| surabaya | Surabaya |
| medan | Medan |

## Performance

- Speed: **7-8 detik** per scrape
- Memory: ~400MB peak
- 96% faster dari original version
