'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.UserSettings, {
        foreignKey: 'user_id',
        as: 'settings'
      });
    }
  }
  
  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    telegramChatId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'telegram_chat_id'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true
  });
  
  return User;
};
