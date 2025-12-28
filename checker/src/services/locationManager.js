/**
 * Location Manager
 * Handle unique location aggregation from user settings with Boutique lookup
 */

const { UserSettings, Boutique } = require('../config/database');
const { Sequelize } = require('sequelize');

// Simple cache for boutique data
let boutiqueCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class LocationManager {
  /**
   * Get boutique cache (lazy load)
   */
  static async getBoutiqueMap() {
    if (boutiqueCache && Date.now() < cacheExpiry) {
      return boutiqueCache;
    }

    const boutiques = await Boutique.findAll({
      where: { isActive: true },
      raw: true
    });

    // Create map for quick lookup
    boutiqueCache = new Map(boutiques.map(b => [b.location_id, b]));
    cacheExpiry = Date.now() + CACHE_TTL;

    return boutiqueCache;
  }

  /**
   * Get unique active locations from user settings
   * Joins with Boutique table for proper naming
   */
  static async getUniqueActiveLocations() {
    try {
      // Get unique location_ids from active user settings
      const settings = await UserSettings.findAll({
        where: { isActive: true },
        attributes: [
          [Sequelize.fn('DISTINCT', Sequelize.col('location_id')), 'locationId']
        ],
        group: ['location_id'],
        raw: true
      });

      if (settings.length === 0) {
        return [];
      }

      // Get boutique data for these locations
      const boutiqueMap = await this.getBoutiqueMap();

      // Map with boutique names
      const locations = settings.map(s => {
        const boutique = boutiqueMap.get(s.locationId);
        return {
          locationId: s.locationId,
          locationName: boutique?.name || `Butik ${s.locationId}`,
          city: boutique?.city || 'Unknown'
        };
      });

      return locations;
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

  /**
   * Clear boutique cache
   */
  static clearCache() {
    boutiqueCache = null;
    cacheExpiry = 0;
  }
}

module.exports = LocationManager;
