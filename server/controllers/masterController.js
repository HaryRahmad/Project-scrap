const { Boutique, GoldWeight } = require('../models');

// Simple in-memory cache
let boutiqueCache = null;
let weightCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class MasterController {
  /**
   * GET /api/master/boutiques
   * Get all active boutiques
   */
  static async getBoutiques(req, res, next) {
    try {
      // Check cache
      if (boutiqueCache && Date.now() < cacheExpiry) {
        return res.json({
          success: true,
          data: boutiqueCache,
          cached: true
        });
      }

      const boutiques = await Boutique.findAll({
        where: { isActive: true },
        order: [['city', 'ASC'], ['name', 'ASC']],
        attributes: ['id', 'locationId', 'name', 'city']
      });

      // Update cache
      boutiqueCache = boutiques;
      cacheExpiry = Date.now() + CACHE_TTL;

      res.json({
        success: true,
        data: boutiques
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/master/weights
   * Get all active gold weights
   */
  static async getWeights(req, res, next) {
    try {
      // Check cache
      if (weightCache && Date.now() < cacheExpiry) {
        return res.json({
          success: true,
          data: weightCache,
          cached: true
        });
      }

      const weights = await GoldWeight.findAll({
        where: { isActive: true },
        order: [['weightGram', 'ASC']],
        attributes: ['id', 'weightLabel', 'weightGram']
      });

      // Update cache
      weightCache = weights;
      cacheExpiry = Date.now() + CACHE_TTL;

      res.json({
        success: true,
        data: weights
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear cache (admin use)
   */
  static clearCache() {
    boutiqueCache = null;
    weightCache = null;
    cacheExpiry = 0;
  }
}

module.exports = MasterController;
