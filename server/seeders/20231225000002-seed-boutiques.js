'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('boutiques', [
      // Jakarta & Sekitarnya
      { location_id: '200', name: 'Butik Emas LM - Pulo Gadung (Kantor Pusat)', city: 'Jakarta', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '203', name: 'Butik Emas LM - Gedung ANTAM (TB Simatupang)', city: 'Jakarta', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '205', name: 'Butik Emas LM - Setiabudi One', city: 'Jakarta', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '214', name: 'Butik Emas LM - Puri Indah', city: 'Jakarta', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '215', name: 'Butik Emas LM - Bekasi', city: 'Bekasi', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '216', name: 'Butik Emas LM - Serpong (Gading Serpong)', city: 'Tangerang', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '217', name: 'Butik Emas LM - Bintaro', city: 'Tangerang Selatan', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '218', name: 'Butik Emas LM - Bogor', city: 'Bogor', is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // Jawa Barat
      { location_id: '201', name: 'Butik Emas LM - Bandung', city: 'Bandung', is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // Jawa Tengah
      { location_id: '212', name: 'Butik Emas LM - Semarang', city: 'Semarang', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '213', name: 'Butik Emas LM - Yogyakarta', city: 'Yogyakarta', is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // Jawa Timur
      { location_id: '202', name: 'Butik Emas LM - Surabaya (Darmo)', city: 'Surabaya', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '220', name: 'Butik Emas LM - Surabaya (Pakuwon)', city: 'Surabaya', is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // Luar Jawa
      { location_id: '209', name: 'Butik Emas LM - Bali', city: 'Bali', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '206', name: 'Butik Emas LM - Medan', city: 'Medan', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '208', name: 'Butik Emas LM - Palembang', city: 'Palembang', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '210', name: 'Butik Emas LM - Balikpapan', city: 'Balikpapan', is_active: true, created_at: new Date(), updated_at: new Date() },
      { location_id: '207', name: 'Butik Emas LM - Makassar', city: 'Makassar', is_active: true, created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('boutiques', null, {});
  }
};
