'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GoldWeight extends Model {
    static associate(models) {
      // No direct associations, used as reference data
    }
  }
  
  GoldWeight.init({
    weightLabel: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'weight_label'
    },
    weightGram: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'weight_gram'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'GoldWeight',
    tableName: 'gold_weights',
    underscored: true
  });
  
  return GoldWeight;
};
