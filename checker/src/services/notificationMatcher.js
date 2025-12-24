/**
 * Notification Matcher Service
 * Match stock changes with user preferences and send Telegram notifications
 */

const axios = require('axios');
const { User, UserSettings } = require('../config/database');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

class NotificationMatcher {
  /**
   * Send Telegram message
   */
  static async sendTelegram(chatId, message) {
    if (!TELEGRAM_BOT_TOKEN || !chatId) {
      console.log('[Notifier] ⚠️ Telegram not configured');
      return false;
    }

    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });
      return true;
    } catch (error) {
      console.error('[Notifier] Telegram error:', error.message);
      return false;
    }
  }

  /**
   * Check if product matches user's target weights
   */
  static matchesWeight(productTitle, targetWeights) {
    if (!targetWeights || targetWeights.length === 0) return true;
    
    const titleLower = productTitle.toLowerCase();
    return targetWeights.some(weight => {
      const w = weight.toLowerCase();
      return titleLower.includes(w) || titleLower.includes(w.replace(' ', ''));
    });
  }

  /**
   * Match users and send notifications for a location
   */
  static async matchAndNotify(locationId, stockData) {
    if (!stockData.hasStock || !stockData.availableProducts?.length) {
      return { notified: 0 };
    }

    try {
      // Get users for this location
      const userSettings = await UserSettings.findAll({
        where: { locationId, isActive: true },
        include: [{
          association: 'user',
          attributes: ['id', 'email', 'telegramChatId']
        }]
      });

      let notifiedCount = 0;

      for (const setting of userSettings) {
        const user = setting.user;
        
        if (!user || !user.telegramChatId) continue;

        // Filter products by user's target weights
        const matchingProducts = stockData.availableProducts.filter(p =>
          this.matchesWeight(p.title, setting.targetWeights)
        );

        if (matchingProducts.length === 0) continue;

        // Check if already notified for these products
        const lastNotified = setting.lastNotifiedStock || [];
        const newProducts = matchingProducts.filter(p =>
          !lastNotified.some(n => n.title === p.title)
        );

        if (newProducts.length === 0) continue;

        // Build notification message
        const productList = matchingProducts.slice(0, 5).map((p, i) =>
          `${i + 1}. <b>${p.title}</b>${p.price ? ` - ${p.price}` : ''}`
        ).join('\n');

        const message = `🔔 <b>STOK TERSEDIA!</b>

📦 <b>Produk:</b>
${productList}

📍 <b>Lokasi:</b> ${setting.locationName}

🔗 <a href="https://www.logammulia.com/id/purchase/gold">BELI SEKARANG →</a>`;

        // Send notification
        const sent = await this.sendTelegram(user.telegramChatId, message);
        
        if (sent) {
          // Update last notified
          await setting.update({
            lastNotifiedAt: new Date(),
            lastNotifiedStock: matchingProducts
          });
          
          notifiedCount++;
          console.log(`[Notifier] ✅ Notified user ${user.email}`);
        }
      }

      return { notified: notifiedCount };

    } catch (error) {
      console.error('[Notifier] Error:', error.message);
      return { notified: 0, error: error.message };
    }
  }

  /**
   * Notify admins when blocked
   */
  static async notifyAdminsBlocked() {
    const message = `⚠️ <b>BOT TERDETEKSI!</b>

🚫 Halaman menampilkan 403/Captcha
😴 Bot akan sleep selama 30 menit`;

    // Get all users with telegram configured
    const users = await User.findAll({
      where: {
        telegramChatId: { [require('sequelize').Op.ne]: null }
      },
      limit: 5
    });

    for (const user of users) {
      await this.sendTelegram(user.telegramChatId, message);
    }
  }
}

module.exports = NotificationMatcher;
