'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      location_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      target_weights: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_notified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_notified_stock: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_settings');
  }
};
