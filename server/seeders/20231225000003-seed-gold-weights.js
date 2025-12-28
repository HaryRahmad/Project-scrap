'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('gold_weights', [
      { weight_label: '0.5 gr', weight_gram: 0.5, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '1 gr', weight_gram: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '2 gr', weight_gram: 2, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '3 gr', weight_gram: 3, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '5 gr', weight_gram: 5, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '10 gr', weight_gram: 10, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '25 gr', weight_gram: 25, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '50 gr', weight_gram: 50, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '100 gr', weight_gram: 100, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '250 gr', weight_gram: 250, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '500 gr', weight_gram: 500, is_active: true, created_at: new Date(), updated_at: new Date() },
      { weight_label: '1000 gr', weight_gram: 1000, is_active: true, created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('gold_weights', null, {});
  }
};
