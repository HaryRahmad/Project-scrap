/**
 * Sequelize Database Connection for Checker
 */

const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'antam_monitor',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Define models
const User = sequelize.define('User', {
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  telegramChatId: {
    type: DataTypes.STRING,
    field: 'telegram_chat_id'
  }
}, {
  tableName: 'users',
  underscored: true
});

const UserSettings = sequelize.define('UserSettings', {
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  },
  locationId: {
    type: DataTypes.STRING,
    field: 'location_id'
  },
  locationName: {
    type: DataTypes.STRING,
    field: 'location_name'
  },
  targetWeights: {
    type: DataTypes.JSONB,
    field: 'target_weights'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'is_active'
  },
  lastNotifiedAt: {
    type: DataTypes.DATE,
    field: 'last_notified_at'
  },
  lastNotifiedStock: {
    type: DataTypes.JSONB,
    field: 'last_notified_stock'
  }
}, {
  tableName: 'user_settings',
  underscored: true
});

const StockCache = sequelize.define('StockCache', {
  locationId: {
    type: DataTypes.STRING,
    field: 'location_id',
    unique: true
  },
  locationName: {
    type: DataTypes.STRING,
    field: 'location_name'
  },
  lastData: {
    type: DataTypes.JSONB,
    field: 'last_data'
  }
}, {
  tableName: 'stock_caches',
  underscored: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

// Associations
User.hasOne(UserSettings, { foreignKey: 'user_id', as: 'settings' });
UserSettings.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  UserSettings,
  StockCache
};
