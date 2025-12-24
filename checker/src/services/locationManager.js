/**
 * Location Manager
 * Handle unique location aggregation from user settings
 */

const { UserSettings } = require('../config/database');
const { Sequelize } = require('sequelize');

class LocationManager {
  /**
   * Get unique active locations from user settings
   * Returns distinct locationId + locationName pairs
   */
  static async getUniqueActiveLocations() {
    try {
      const settings = await UserSettings.findAll({
        where: { isActive: true },
        attributes: [
          [Sequelize.fn('DISTINCT', Sequelize.col('location_id')), 'locationId'],
          'locationName'
        ],
        group: ['location_id', 'location_name'],
        raw: true
      });

      return settings;
    } catch (error) {
      console.error('[LocationManager] Error getting locations:', error.message);
      return [];
    }
  }

  /**
   * Get all users for a specific location
   */
  static async getUsersForLocation(locationId) {
    try {
      const settings = await UserSettings.findAll({
        where: {
          locationId,
          isActive: true
        },
        include: [{
          association: 'user',
          attributes: ['id', 'email', 'telegramChatId']
        }]
      });

      return settings;
    } catch (error) {
      console.error('[LocationManager] Error getting users:', error.message);
      return [];
    }
  }
}

module.exports = LocationManager;
