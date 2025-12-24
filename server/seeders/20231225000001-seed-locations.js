'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('locations', [
      { location_id: 'jakarta-pulogadung', name: 'LM Pulo Gadung', city: 'Jakarta', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: 'jakarta-cempakamas', name: 'LM Cempaka Mas', city: 'Jakarta', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: 'jakarta-pondokindah', name: 'LM Pondok Indah', city: 'Jakarta', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: 'bandung-braga', name: 'LM Bandung Braga', city: 'Bandung', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: 'surabaya-tunjungan', name: 'LM Surabaya Tunjungan', city: 'Surabaya', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: 'semarang-pemuda', name: 'LM Semarang Pemuda', city: 'Semarang', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: 'medan-kesawan', name: 'LM Medan Kesawan', city: 'Medan', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: 'makassar-somba', name: 'LM Makassar', city: 'Makassar', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: 'yogyakarta-malioboro', name: 'LM Yogyakarta', city: 'Yogyakarta', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: 'balikpapan', name: 'LM Balikpapan', city: 'Balikpapan', is_active: true, created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('locations', null, {});
  }
};
