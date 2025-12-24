/**
 * Module Notifikasi Telegram
 * Dengan format notifikasi detail untuk produk emas
 */

const axios = require('axios');
const config = require('../config');

class TelegramNotifier {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.apiBaseUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    // Anti-spam: track last notification
    this.lastNotifiedProducts = new Set();
    this.lastNotificationTime = null;
    this.minNotificationInterval = 300000; // 5 menit minimum antar notifikasi stok tersedia
  }

  /**
   * Validasi konfigurasi Telegram
   */
  isConfigured() {
    return this.botToken && this.chatId && 
           this.botToken !== 'your_bot_token_here' && 
           this.chatId !== 'your_chat_id_here';
  }

  /**
   * Kirim pesan ke Telegram
   * @param {string} message - Pesan yang akan dikirim
   * @param {boolean} silent - Kirim tanpa notifikasi suara
   */
  async sendMessage(message, silent = false) {
    if (!this.isConfigured()) {
      console.log('[Telegram] ⚠️ Bot tidak dikonfigurasi. Pesan:', message);
      return false;
    }

    try {
      const response = await axios.post(`${this.apiBaseUrl}/sendMessage`, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML',
        disable_notification: silent,
        disable_web_page_preview: false
      }, {
        timeout: 10000
      });

      if (response.data.ok) {
        console.log('[Telegram] ✅ Pesan terkirim');
        return true;
      } else {
        console.log('[Telegram] ❌ Gagal kirim:', response.data.description);
        return false;
      }
    } catch (error) {
      console.error('[Telegram] ❌ Error:', error.message);
      return false;
    }
  }

  /**
   * Cek apakah perlu kirim notifikasi (anti-spam)
   * @param {array} products - Daftar produk tersedia
   */
  shouldNotify(products) {
    if (!products || products.length === 0) return false;
    
    // Cek waktu minimal antar notifikasi
    const now = Date.now();
    if (this.lastNotificationTime && 
        (now - this.lastNotificationTime) < this.minNotificationInterval) {
      
      // Cek apakah ada produk BARU yang belum pernah di-notify
      const newProducts = products.filter(p => !this.lastNotifiedProducts.has(p.title));
      if (newProducts.length === 0) {
        console.log('[Telegram] ⏳ Skipping notification (anti-spam, no new products)');
        return false;
      }
    }
    
    return true;
  }

  /**
   * Update tracking notifikasi
   * @param {array} products - Daftar produk yang di-notify
   */
  updateNotificationTracking(products) {
    this.lastNotificationTime = Date.now();
    products.forEach(p => this.lastNotifiedProducts.add(p.title));
  }

  /**
   * Reset tracking ketika stok habis
   */
  resetNotificationTracking() {
    this.lastNotifiedProducts.clear();
    this.lastNotificationTime = null;
  }

  /**
   * Kirim notifikasi stok tersedia dengan detail produk
   * @param {object} stockInfo - Informasi stok
   */
  async notifyStockAvailable(stockInfo) {
    const products = stockInfo.availableProducts || [];
    
    // Anti-spam check
    if (!this.shouldNotify(products)) {
      return false;
    }
    
    // Format daftar produk
    let productList = '';
    if (products.length > 0) {
      productList = products.slice(0, 5).map((p, i) => {
        const price = p.price ? ` - ${p.price}` : '';
        return `${i + 1}. <b>${p.title}</b>${price}`;
      }).join('\n');
      
      if (products.length > 5) {
        productList += `\n... dan ${products.length - 5} produk lainnya`;
      }
    }

    const message = `🔔 <b>STOK TERSEDIA!</b>

📦 <b>Produk:</b>
${productList || 'Detail produk tidak tersedia'}

📍 <b>Lokasi:</b> ${stockInfo.locationName || config.locationName || 'Tidak ditentukan'}

🕐 <b>Waktu:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

🔗 <a href="https://www.logammulia.com/id/purchase/gold">BELI SEKARANG →</a>`;

    const sent = await this.sendMessage(message);
    
    if (sent) {
      this.updateNotificationTracking(products);
    }
    
    return sent;
  }

  /**
   * Kirim notifikasi stok habis
   * @param {object} stockInfo - Informasi stok
   */
  async notifyStockEmpty(stockInfo) {
    // Reset tracking karena stok habis
    this.resetNotificationTracking();
    
    const message = `🔴 <b>Stok Emas Habis</b>

📍 Lokasi: ${stockInfo.locationName || config.locationName || '-'}
📊 Dicek: ${stockInfo.checkedCount || 0} produk sesuai filter
🕐 Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

Bot akan terus memantau...`;

    return this.sendMessage(message, true); // Silent notification
  }

  /**
   * Kirim notifikasi bot terdeteksi
   */
  async notifyDetected() {
    const message = `⚠️ <b>BOT TERDETEKSI!</b>

🚫 Halaman menampilkan 403/Captcha
😴 Bot akan sleep selama 30 menit
🕐 Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

    return this.sendMessage(message);
  }

  /**
   * Kirim notifikasi error
   * @param {string} errorMessage - Pesan error
   */
  async notifyError(errorMessage) {
    const message = `❌ <b>Error Bot</b>

🐛 ${errorMessage}
🕐 Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

    return this.sendMessage(message, true);
  }

  /**
   * Kirim notifikasi bot start
   */
  async notifyBotStart() {
    // Format target weights
    const weights = config.targetWeights && config.targetWeights.length > 0
      ? config.targetWeights.join(', ')
      : 'Semua berat';
    
    const message = `🚀 <b>Bot Pemantau Aktif</b>

✅ Bot mulai memantau stok emas Antam
📍 Lokasi: ${config.locationName || 'Default'}
⚖️ Filter: ${weights}
📅 Jadwal: Senin-Jumat, ${config.schedule.startHour}:00-${config.schedule.endHour}:00 WIB
🕐 Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

    return this.sendMessage(message, true);
  }
}

module.exports = new TelegramNotifier();
