/**
 * Profile Controller
 * Handle user profile updates including Telegram username and password
 */

const { User } = require('../models');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

class ProfileController {
  /**
   * Get user profile
   * GET /api/profile
   */
  static async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'email', 'telegramUsername', 'telegramChatId', 'createdAt']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          telegramUsername: user.telegramUsername,
          telegramLinked: !!user.telegramChatId,
          createdAt: user.createdAt
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile (Telegram username)
   * PUT /api/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { telegramUsername } = req.body;
      const userId = req.user.id;

      // Clean username
      const cleanUsername = telegramUsername ? telegramUsername.replace('@', '').toLowerCase() : null;

      // Update username
      await User.update(
        { telegramUsername: cleanUsername },
        { where: { id: userId } }
      );

      // Try to resolve Chat ID if username provided
      let chatId = null;
      let linked = false;

      if (cleanUsername) {
        chatId = await ProfileController.resolveTelegramChatId(cleanUsername);
        if (chatId) {
          await User.update(
            { telegramChatId: chatId },
            { where: { id: userId } }
          );
          linked = true;
        }
      }

      res.json({
        success: true,
        message: linked 
          ? 'Profile berhasil diupdate dan Telegram terhubung!'
          : 'Profile berhasil diupdate. Kirim /start ke bot Telegram untuk menghubungkan.',
        data: {
          telegramUsername: cleanUsername,
          telegramLinked: linked,
          instruction: linked ? null : 'Kirim /start ke bot Telegram, lalu update profile lagi'
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * PUT /api/profile/password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password lama dan baru wajib diisi'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 6 karakter'
        });
      }

      // Get user
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Verify current password
      const isValid = comparePassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Password lama salah'
        });
      }

      // Hash and update new password
      const hashedPassword = hashPassword(newPassword);
      await User.update(
        { password: hashedPassword },
        { where: { id: userId } }
      );

      res.json({
        success: true,
        message: 'Password berhasil diubah'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve Telegram username to Chat ID
   */
  static async resolveTelegramChatId(username) {
    if (!TELEGRAM_BOT_TOKEN || !username) return null;

    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`
      );

      if (response.data.ok && response.data.result) {
        for (const update of response.data.result) {
          const from = update.message?.from;
          if (from && from.username?.toLowerCase() === username.toLowerCase()) {
            console.log(`[Profile] Resolved @${username} -> ${from.id}`);
            return from.id.toString();
          }
        }
      }
      return null;
    } catch (error) {
      console.error('[Profile] Error resolving username:', error.message);
      return null;
    }
  }
}

module.exports = ProfileController;
