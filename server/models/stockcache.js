'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockCache extends Model {
    static associate(models) {
      // No associations
    }
  }
  
  StockCache.init({
    locationId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'location_id'
    },
    locationName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'location_name'
    },
    lastData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'last_data'
    }
  }, {
    sequelize,
    modelName: 'StockCache',
    tableName: 'stock_caches',
    underscored: true,
    createdAt: false,
    updatedAt: 'updated_at'
  });
  
  return StockCache;
};
