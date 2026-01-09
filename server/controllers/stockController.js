const { UserSettings, StockCache, Boutique } = require('../models');
const NotificationService = require('../services/notificationService');

class StockController {
  static async getStock(req, res, next) {
    try {
      const userId = req.user.id;

      // Get user settings to find their location
      const settings = await UserSettings.findOne({
        where: { userId }
      });

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Settings tidak ditemukan. Silakan atur lokasi terlebih dahulu.'
        });
      }

      // Get stock cache for user's location
      const stockCache = await StockCache.findOne({
        where: { locationId: settings.locationId }
      });

      if (!stockCache) {
        return res.json({
          success: true,
          data: {
            location: {
              id: settings.locationId,
              name: settings.locationName
            },
            stock: null,
            message: 'Data stok belum tersedia. Checker bot akan segera mengumpulkan data.'
          }
        });
      }

      // Filter stock data based on user's target weights
      const targetWeights = settings.targetWeights || [];
      let filteredProducts = stockCache.lastData?.availableProducts || [];

      if (targetWeights.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          const productTitle = product.title?.toLowerCase() || '';
          return targetWeights.some(weight => {
            const weightLower = weight.toLowerCase();
            return productTitle.includes(weightLower) || 
                   productTitle.includes(weightLower.replace(' ', ''));
          });
        });
      }

      res.json({
        success: true,
        data: {
          location: {
            id: settings.locationId,
            name: settings.locationName
          },
          stock: {
            hasStock: filteredProducts.length > 0,
            products: filteredProducts,
            totalChecked: stockCache.lastData?.checkedCount || 0,
            lastUpdated: stockCache.updatedAt
          },
          filters: {
            targetWeights
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getAllStock(req, res, next) {
    try {
      const stockCaches = await StockCache.findAll({
        order: [['updatedAt', 'DESC']]
      });

      res.json({
        success: true,
        data: stockCaches
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle stock update from Checker Bot
   * POST /api/stock/update
   * Body: { locationId, locationName, stockData, secret }
   */
  static async handleStockUpdate(req, res, next) {
    try {
      const { locationId, locationName, stockData, secret } = req.body;

      // Validate checker secret (simple auth)
      const CHECKER_SECRET = process.env.CHECKER_SECRET;
      if (CHECKER_SECRET && secret !== CHECKER_SECRET) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid checker secret'
        });
      }

      if (!locationId || !stockData) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: locationId, stockData'
        });
      }

      // 1. Upsert to stock_caches
      await StockCache.upsert({
        locationId,
        locationName: locationName || locationId,
        lastData: stockData
      });

      console.log(`[Stock] 💾 Saved stock data for ${locationName || locationId}`);

      // 2. Match users and send notifications
      const result = await NotificationService.handleStockUpdate(
        locationId,
        locationName || locationId,
        stockData
      );

      res.json({
        success: true,
        message: 'Stock update processed',
        data: {
          locationId,
          hasStock: stockData.hasStock || false,
          notified: result.notified,
          totalUsers: result.total || 0
        }
      });

    } catch (error) {
      console.error('[Stock] Update error:', error.message);
      next(error);
    }
  }

  /**
   * Handle blocked notification from Checker
   * POST /api/stock/blocked
   */
  static async handleBlocked(req, res, next) {
    try {
      const { secret } = req.body;

      // Validate checker secret
      const CHECKER_SECRET = process.env.CHECKER_SECRET;
      if (CHECKER_SECRET && secret !== CHECKER_SECRET) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      await NotificationService.notifyBlocked();

      res.json({
        success: true,
        message: 'Blocked notification sent'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * TEST ENDPOINT - Simulate stock found for testing notifications
   * POST /api/stock/test-notify
   * Body: { locationId?, weight? }
   */
  static async testNotify(req, res, next) {
    try {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Test endpoint disabled in production'
        });
      }

      const userId = req.user.id;
      const { weight } = req.body;

      // Get user's settings
      const settings = await UserSettings.findOne({
        where: { userId },
        include: [{
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'email', 'telegramChatId']
        }]
      });

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Settings tidak ditemukan'
        });
      }

      // Create fake stock data
      const fakeProducts = [
        { title: weight || '1 Gram Emas Antam', price: 'Rp 1.500.000', hasStock: true },
        { title: '5 Gram Emas Antam', price: 'Rp 7.200.000', hasStock: true },
        { title: '10 Gram Emas Antam', price: 'Rp 14.300.000', hasStock: true }
      ];

      const fakeStockData = {
        hasStock: true,
        availableProducts: fakeProducts,
        totalProducts: fakeProducts.length,
        timestamp: new Date().toISOString()
      };

      // Reset notification history first (to ensure notification is sent)
      await settings.update({ lastNotifiedStock: [] });

      // Trigger notification
      const result = await NotificationService.handleStockUpdate(
        settings.locationId,
        settings.locationName,
        fakeStockData
      );

      res.json({
        success: true,
        message: 'Test notification triggered',
        data: {
          locationId: settings.locationId,
          locationName: settings.locationName,
          telegramConfigured: !!settings.user?.telegramChatId,
          notified: result.notified,
          fakeProducts: fakeProducts.map(p => p.title)
        }
      });

    } catch (error) {
      console.error('[Stock] Test notify error:', error.message);
      next(error);
    }
  }

  /**
   * Get unique locations to check - untuk Python scheduler
   * Returns active locations dari user settings yang isActive = true
   * Mapping dari database boutiques table
   */
  static async getCheckerLocations(req, res, next) {
    try {
      // Get semua unique locationId dari active user settings
      const activeSettings = await UserSettings.findAll({
        where: { isActive: true },
        attributes: ['locationId'],
        group: ['locationId']
      });

      if (activeSettings.length === 0) {
        console.log('[Checker] No active settings found');
        return res.json({
          success: true,
          locations: [],
          count: 0
        });
      }

      // Get location IDs
      const locationIds = activeSettings.map(s => s.locationId);

      // Query boutiques dari database untuk get city names
      const boutiques = await Boutique.findAll({
        where: { locationId: locationIds },
        attributes: ['locationId', 'city']
      });

      // Convert city names to lowercase keys for scraper
      const locations = boutiques
        .map(b => b.city.toLowerCase().replace(/\s+/g, ''))
        .filter(loc => loc);

      // Remove duplicates
      const uniqueLocations = [...new Set(locations)];

      console.log(`[Checker] Returning ${uniqueLocations.length} locations:`, uniqueLocations);

      res.json({
        success: true,
        locations: uniqueLocations,
        count: uniqueLocations.length
      });

    } catch (error) {
      console.error('[Checker] Error fetching locations:', error.message);
      next(error);
    }
  }
}

module.exports = StockController;

