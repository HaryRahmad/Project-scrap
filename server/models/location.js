'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    static associate(models) {
      // No associations
    }
  }
  
  Location.init({
    locationId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'location_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    underscored: true
  });
  
  return Location;
};
