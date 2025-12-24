const { Location } = require('../models');

class LocationController {
  static async getAllLocations(req, res, next) {
    try {
      const locations = await Location.findAll({
        where: { isActive: true },
        order: [['city', 'ASC']]
      });

      res.json({
        success: true,
        data: locations
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = LocationController;
