const { UserSettings, StockCache } = require('../models');
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
}

module.exports = StockController;

