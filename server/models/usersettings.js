'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserSettings extends Model {
    static associate(models) {
      UserSettings.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  
  UserSettings.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    locationId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'location_id'
    },
    locationName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'location_name'
    },
    locationIds: {
      type: DataTypes.JSONB,
      defaultValue: [],
      allowNull: false,
      field: 'location_ids'
    },
    targetWeights: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'target_weights'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    lastNotifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_notified_at'
    },
    lastNotifiedStock: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'last_notified_stock'
    }
  }, {
    sequelize,
    modelName: 'UserSettings',
    tableName: 'user_settings',
    underscored: true
  });
  
  return UserSettings;
};
