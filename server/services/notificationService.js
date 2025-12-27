/**
 * Notification Service
 * Handle Telegram notifications and user matching
 */

const axios = require('axios');
const { User, UserSettings } = require('../models');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

class NotificationService {
  /**
   * Send message to Telegram
   */
  static async sendTelegram(chatId, message) {
    if (!TELEGRAM_BOT_TOKEN || !chatId) {
      console.log('[Notification] ⚠️ Telegram not configured or chatId missing');
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
      console.error('[Notification] Telegram error:', error.message);
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
   * Build notification message for user
   */
  static buildMessage(locationName, products) {
    const productList = products.slice(0, 5).map((p, i) =>
      `${i + 1}. <b>${p.title}</b>${p.price ? ` - ${p.price}` : ''}`
    ).join('\n');

    return `🔔 <b>STOK TERSEDIA!</b>

📦 <b>Produk:</b>
${productList}

📍 <b>Lokasi:</b> ${locationName}

🔗 <a href="https://www.logammulia.com/id/purchase/gold">BELI SEKARANG →</a>`;
  }

  /**
   * Handle stock update from Checker
   * Match users and send notifications
   */
  static async handleStockUpdate(locationId, locationName, stockData) {
    if (!stockData.hasStock || !stockData.availableProducts?.length) {
      console.log(`[Notification] No stock at ${locationName}, skipping notifications`);
      return { notified: 0 };
    }

    try {
      // Get all active users monitoring this location
      const userSettings = await UserSettings.findAll({
        where: { locationId, isActive: true },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'telegramChatId']
        }]
      });

      console.log(`[Notification] Found ${userSettings.length} users monitoring ${locationName}`);

      let notifiedCount = 0;

      for (const setting of userSettings) {
        const user = setting.user;
        
        if (!user || !user.telegramChatId) {
          console.log(`[Notification] User ${user?.email || 'unknown'} has no Telegram configured`);
          continue;
        }

        // Filter products by user's target weights
        const matchingProducts = stockData.availableProducts.filter(p =>
          this.matchesWeight(p.title, setting.targetWeights)
        );

        if (matchingProducts.length === 0) {
          console.log(`[Notification] No matching products for ${user.email}`);
          continue;
        }

        // Check if already notified for these products (prevent spam)
        const lastNotified = setting.lastNotifiedStock || [];
        const newProducts = matchingProducts.filter(p =>
          !lastNotified.some(n => n.title === p.title)
        );

        if (newProducts.length === 0) {
          console.log(`[Notification] ${user.email} already notified for these products`);
          continue;
        }

        // Build and send notification
        const message = this.buildMessage(locationName, matchingProducts);
        const sent = await this.sendTelegram(user.telegramChatId, message);

        if (sent) {
          // Update last notified
          await setting.update({
            lastNotifiedAt: new Date(),
            lastNotifiedStock: matchingProducts
          });

          notifiedCount++;
          console.log(`[Notification] ✅ Sent to ${user.email}`);
        }
      }

      return { notified: notifiedCount, total: userSettings.length };

    } catch (error) {
      console.error('[Notification] Error:', error.message);
      return { notified: 0, error: error.message };
    }
  }

  /**
   * Notify admins when bot is blocked
   */
  static async notifyBlocked() {
    const message = `⚠️ <b>BOT TERDETEKSI!</b>

🚫 Halaman menampilkan 403/Captcha
😴 Bot akan sleep selama 30 menit`;

    const { Op } = require('sequelize');
    
    const users = await User.findAll({
      where: {
        telegramChatId: { [Op.ne]: null }
      },
      limit: 5
    });

    for (const user of users) {
      await this.sendTelegram(user.telegramChatId, message);
    }
  }
}

module.exports = NotificationService;
