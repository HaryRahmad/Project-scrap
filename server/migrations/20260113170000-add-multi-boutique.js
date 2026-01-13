'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add location_ids JSONB column
    await queryInterface.addColumn('user_settings', 'location_ids', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false
    });

    // Migrate existing single location data to array
    await queryInterface.sequelize.query(`
      UPDATE user_settings 
      SET location_ids = jsonb_build_array(location_id) 
      WHERE location_id IS NOT NULL AND location_id != ''
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_settings', 'location_ids');
  }
};
