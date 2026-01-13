const { User, UserSettings } = require('../models');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

class SettingsController {
  static async getSettings(req, res, next) {
    try {
      const userId = req.user.id;

      const settings = await UserSettings.findOne({
        where: { userId }
      });

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Settings tidak ditemukan'
        });
      }

      // Get user's telegram info
      const user = await User.findByPk(userId, {
        attributes: ['telegramChatId', 'telegramUsername']
      });

      res.json({
        success: true,
        data: {
          ...settings.toJSON(),
          telegramChatId: user?.telegramChatId,
          telegramUsername: user?.telegramUsername
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const userId = req.user.id;
      const { locationId, locationName, locationIds, targetWeights, isActive, telegramUsername } = req.body;

      // Validate locationIds if provided
      let finalLocationIds = [];
      if (locationIds && Array.isArray(locationIds)) {
        // Max 5 locations
        if (locationIds.length > 5) {
          return res.status(400).json({
            success: false,
            message: 'Maksimal 5 lokasi yang dapat dipantau'
          });
        }
        finalLocationIds = locationIds;
      } else if (locationId) {
        // Backward compatibility: single locationId
        finalLocationIds = [locationId];
      }

      // Find or create settings
      let settings = await UserSettings.findOne({ where: { userId } });

      if (settings) {
        // Update existing
        await settings.update({
          locationId: locationId || finalLocationIds[0] || settings.locationId,
          locationName: locationName || settings.locationName,
          locationIds: finalLocationIds.length > 0 ? finalLocationIds : settings.locationIds,
          targetWeights: targetWeights !== undefined ? targetWeights : settings.targetWeights,
          isActive: isActive !== undefined ? isActive : settings.isActive
        });
      } else {
        // Create new (inactive by default)
        settings = await UserSettings.create({
          userId,
          locationId: locationId || finalLocationIds[0] || '200',
          locationName: locationName || 'Butik Emas LM - Pulo Gadung (Kantor Pusat)',
          locationIds: finalLocationIds,
          targetWeights: targetWeights || [],
          isActive: isActive !== undefined ? isActive : false
        });
      }

      // If telegramUsername provided, try to resolve Chat ID
      if (telegramUsername !== undefined) {
        const username = telegramUsername.replace('@', '').toLowerCase();
        await User.update(
          { telegramUsername: username },
          { where: { id: userId } }
        );

        // Try to resolve Chat ID from username
        const chatId = await SettingsController.resolveTelegramChatId(username);
        if (chatId) {
          await User.update(
            { telegramChatId: chatId },
            { where: { id: userId } }
          );
        }
      }

      res.json({
        success: true,
        message: 'Settings berhasil diupdate',
        data: settings
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve Telegram username to Chat ID using getUpdates
   */
  static async resolveTelegramChatId(username) {
    if (!TELEGRAM_BOT_TOKEN || !username) return null;

    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`
      );

      if (response.data.ok && response.data.result) {
        // Find the user by username in recent updates
        for (const update of response.data.result) {
          const from = update.message?.from;
          if (from && from.username?.toLowerCase() === username.toLowerCase()) {
            console.log(`[Telegram] Resolved @${username} -> ${from.id}`);
            return from.id.toString();
          }
        }
      }
      return null;
    } catch (error) {
      console.error('[Telegram] Error resolving username:', error.message);
      return null;
    }
  }

  /**
   * Link Telegram account - user enters username, system resolves Chat ID
   * POST /api/settings/link-telegram
   */
  static async linkTelegram(req, res, next) {
    try {
      const userId = req.user.id;
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username Telegram diperlukan'
        });
      }

      const cleanUsername = username.replace('@', '').toLowerCase();

      // Save username
      await User.update(
        { telegramUsername: cleanUsername },
        { where: { id: userId } }
      );

      // Try to resolve Chat ID
      const chatId = await SettingsController.resolveTelegramChatId(cleanUsername);

      if (chatId) {
        await User.update(
          { telegramChatId: chatId },
          { where: { id: userId } }
        );

        return res.json({
          success: true,
          message: 'Telegram berhasil terhubung!',
          data: {
            username: cleanUsername,
            chatId: chatId,
            linked: true
          }
        });
      }

      // Username saved but Chat ID not found yet
      res.json({
        success: true,
        message: 'Username disimpan. Silakan kirim /start ke bot Telegram, lalu coba lagi.',
        data: {
          username: cleanUsername,
          chatId: null,
          linked: false,
          instruction: 'Kirim /start ke bot Telegram Anda, lalu klik "Link Telegram" lagi'
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = SettingsController;

