const { User, UserSettings } = require('../models');

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

      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const userId = req.user.id;
      const { locationId, locationName, targetWeights, isActive, telegramChatId } = req.body;

      // Find or create settings
      let settings = await UserSettings.findOne({ where: { userId } });

      if (settings) {
        // Update existing
        await settings.update({
          locationId: locationId || settings.locationId,
          locationName: locationName || settings.locationName,
          targetWeights: targetWeights !== undefined ? targetWeights : settings.targetWeights,
          isActive: isActive !== undefined ? isActive : settings.isActive
        });
      } else {
        // Create new (inactive by default)
        settings = await UserSettings.create({
          userId,
          locationId: locationId || '200',
          locationName: locationName || 'Butik Emas LM - Pulo Gadung (Kantor Pusat)',
          targetWeights: targetWeights || [],
          isActive: isActive !== undefined ? isActive : false
        });
      }

      // Update telegram chat ID in user table if provided
      if (telegramChatId !== undefined) {
        await User.update(
          { telegramChatId },
          { where: { id: userId } }
        );
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
}

module.exports = SettingsController;
