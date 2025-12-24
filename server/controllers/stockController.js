const { UserSettings, StockCache } = require('../models');

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
}

module.exports = StockController;
