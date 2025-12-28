'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Boutique extends Model {
    static associate(models) {
      // Boutique can have many UserSettings
      Boutique.hasMany(models.UserSettings, {
        foreignKey: 'location_id',
        sourceKey: 'locationId',
        as: 'userSettings'
      });
    }
  }
  
  Boutique.init({
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
    modelName: 'Boutique',
    tableName: 'boutiques',
    underscored: true
  });
  
  return Boutique;
};
