/**
 * Konfigurasi Bot Pemantau Stok Emas Antam
 */

module.exports = {
  // Target URL untuk pemantauan
  targetUrl: 'https://www.logammulia.com/id/purchase/gold',

  // ============================================
  // KONFIGURASI LOKASI (BOUTIQUE)
  // ============================================
  // ID Lokasi butik Antam - sesuaikan dengan pilihan Anda
  // Contoh ID: 'jakarta-pulogadung', 'jakarta-cempaka-mas', dll
  // Kosongkan string jika ingin skip pemilihan lokasi
  locationId: 'jakarta-pulogadung',
  
  // Nama lokasi untuk ditampilkan di notifikasi
  locationName: 'Pulo Gadung, Jakarta',

  // Selector untuk modal lokasi
  locationSelectors: {
    modal: '.modal-location, #modal-location, [class*="location-modal"]',
    selectDropdown: 'select[name="location"], #location-select, .location-dropdown',
    confirmButton: '.btn-primary-full, #btn-confirm-location, .btn-confirm, button[type="submit"]',
    closeButton: '.close, .btn-close, [data-dismiss="modal"]'
  },

  // ============================================
  // KONFIGURASI FILTER BERAT EMAS
  // ============================================
  // Daftar berat emas yang ingin dipantau
  // Kosongkan array jika ingin memantau semua berat
  targetWeights: [
    '0.5 gr',
    '1 gr',
    '2 gr',
    '3 gr',
    '5 gr',
    '10 gr',
    '25 gr',
    '50 gr',
    '100 gr'
  ],

  // ============================================
  // CHROMIUM FLAGS (OPTIMASI RAM)
  // ============================================
  chromiumArgs: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--single-process',
    '--no-zygote',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--mute-audio',
    '--no-first-run',
    '--safebrowsing-disable-auto-update',
    '--js-flags=--max-old-space-size=256'
  ],

  // ============================================
  // JADWAL OPERASIONAL
  // ============================================
  schedule: {
    workDays: [1, 2, 3, 4, 5], // Senin (1) sampai Jumat (5)
    startHour: 8,              // Jam mulai: 08:00
    endHour: 17                // Jam selesai: 17:00
  },

  // ============================================
  // INTERVAL PENGECEKAN
  // ============================================
  intervals: {
    minCheck: 45000,           // Minimum 45 detik
    maxCheck: 90000,           // Maximum 90 detik
    sleepCheck: 600000,        // Sleep mode: 10 menit
    detectionCooldown: 1800000, // Cooldown jika terdeteksi: 30 menit
    locationDelay: {           // Delay setelah pemilihan lokasi
      min: 1000,
      max: 3000
    }
  },

  // Browser lifecycle
  browserRestartThreshold: 15, // Restart browser setiap 15 kali check

  // Request types yang diizinkan (lainnya akan di-block)
  allowedResourceTypes: ['document', 'script', 'xhr', 'fetch'],

  // User agents populer untuk rotasi
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ],

  // ============================================
  // SELECTORS UNTUK SCRAPING
  // ============================================
  selectors: {
    // Product selectors
    productCard: '.product-card, .product-item, .gold-product, [class*="product-card"]',
    productTitle: '.product-title, .product-name, h3, h4, [class*="title"]',
    productPrice: '.product-price, .price, [class*="price"]',
    
    // Stock & Cart button selectors
    addToCartButton: '.btn-add-cart, .add-to-cart, button[class*="cart"], .btn-primary',
    disabledButton: '.disabled, [disabled], .btn-disabled, .out-of-stock',
    stockStatus: '.product-stock, .stock-status, .availability, [class*="stock"], [class*="availability"]',
    
    // Text indicators
    outOfStockText: ['habis', 'sold out', 'tidak tersedia', 'out of stock', 'kosong', 'empty'],
    inStockText: ['tersedia', 'available', 'ready', 'tambah', 'add to cart', 'beli']
  }
};
