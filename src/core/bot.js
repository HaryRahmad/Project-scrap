/**
 * Bot Pemantau Stok Emas Antam
 * Core Bot Logic
 * 
 * Fitur:
 * - Puppeteer-extra dengan Stealth Plugin
 * - Interval acak 45-90 detik
 * - Jadwal operasional Senin-Jumat 08:00-17:00
 * - Pemilihan lokasi (boutique) otomatis
 * - Filter berat emas berdasarkan konfigurasi
 * - Request interception untuk hemat RAM
 * - Notifikasi Telegram saat status berubah
 * - Browser restart setiap 15 kali check
 * - Detection handling dengan 30 menit cooldown
 */

const config = require('../config');
const telegram = require('../services/telegram');
const scheduler = require('../utils/scheduler');
const stockChecker = require('../services/stockChecker');
const { randomDelay } = require('../utils/humanBehavior');

// State management
let lastStockStatus = null;
let checkCount = 0;
let browser = null;
let isRunning = false;
let locationSelected = false; // Track if location has been selected

/**
 * Log dengan timestamp
 */
function log(message) {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Cleanup browser resources
 */
async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
      log('[Main] 🔒 Browser closed');
    } catch (error) {
      log(`[Main] ⚠️ Error closing browser: ${error.message}`);
    }
    browser = null;
    locationSelected = false; // Reset location flag when browser closes
  }
}

/**
 * Handle detection cooldown
 */
async function handleDetection() {
  log('[Main] 🚨 Bot terdeteksi! Memulai cooldown 30 menit...');
  
  await telegram.notifyDetected();
  await closeBrowser();
  
  // Sleep 30 menit
  await scheduler.sleep(config.intervals.detectionCooldown);
  
  log('[Main] ⏰ Cooldown selesai. Melanjutkan pemantauan...');
}

/**
 * Proses perubahan status stok
 */
async function handleStockChange(currentStatus) {
  if (lastStockStatus === null) {
    // First check, just set the status
    log(`[Main] 📊 Status awal: ${currentStatus.status}`);
    if (currentStatus.availableProducts && currentStatus.availableProducts.length > 0) {
      log(`[Main] 📦 Produk tersedia: ${currentStatus.availableProducts.map(p => p.title).join(', ')}`);
    }
    lastStockStatus = currentStatus;
    
    // Kirim notifikasi jika stok tersedia di awal
    if (currentStatus.hasStock) {
      await telegram.notifyStockAvailable(currentStatus);
    }
    return;
  }
  
  // Cek apakah status berubah
  if (lastStockStatus.hasStock !== currentStatus.hasStock) {
    log(`[Main] 🔄 Status berubah: ${lastStockStatus.status} → ${currentStatus.status}`);
    
    if (currentStatus.hasStock) {
      // Stok tersedia!
      await telegram.notifyStockAvailable(currentStatus);
    } else {
      // Stok habis
      await telegram.notifyStockEmpty(currentStatus);
    }
  } else if (currentStatus.hasStock) {
    // Status tetap tersedia, cek apakah ada produk baru
    const oldProducts = new Set((lastStockStatus.availableProducts || []).map(p => p.title));
    const newProducts = (currentStatus.availableProducts || []).filter(p => !oldProducts.has(p.title));
    
    if (newProducts.length > 0) {
      log(`[Main] 🆕 Produk baru tersedia: ${newProducts.map(p => p.title).join(', ')}`);
      await telegram.notifyStockAvailable(currentStatus);
    } else {
      log(`[Main] ℹ️ Status tetap: ${currentStatus.status} (${currentStatus.availableProducts?.length || 0} produk)`);
    }
  } else {
    log(`[Main] ℹ️ Status tetap: ${currentStatus.status}`);
  }
  
  lastStockStatus = currentStatus;
}

/**
 * Satu siklus pengecekan
 */
async function performCheck() {
  checkCount++;
  log(`[Main] 🔍 Memulai pengecekan #${checkCount}`);
  
  try {
    // Cek apakah perlu restart browser
    if (checkCount % config.browserRestartThreshold === 0 && browser) {
      log('[Main] 🔄 Restart browser untuk mencegah memory leak...');
      await closeBrowser();
    }
    
    // Launch browser jika belum ada
    if (!browser) {
      browser = await stockChecker.setupBrowser();
    }
    
    // Setup page baru
    const page = await stockChecker.setupPage(browser);
    
    try {
      // Navigasi ke halaman target
      const navResult = await stockChecker.navigateToTarget(page);
      
      if (!navResult.success) {
        if (navResult.blocked) {
          await page.close();
          return { blocked: true };
        }
        throw new Error(navResult.error || 'Navigation failed');
      }
      
      // Cek apakah ter-block
      if (await stockChecker.isBlocked(page)) {
        await page.close();
        return { blocked: true };
      }
      
      // Handle pemilihan lokasi (hanya jika belum dipilih)
      if (!locationSelected && config.locationId) {
        log('[Main] 📍 Attempting to select location...');
        const locationResult = await stockChecker.handleLocationModal(page);
        
        if (locationResult.selected) {
          log(`[Main] ✅ Location selected: ${locationResult.locationName}`);
          locationSelected = true;
          
          // Tunggu page refresh setelah pemilihan lokasi
          await randomDelay(2000, 3000);
        }
      }
      
      // Cek status stok dengan filter berat
      const stockStatus = await stockChecker.checkStock(page);
      
      // Log detail hasil
      log(`[Main] 📊 Checked ${stockStatus.checkedCount}/${stockStatus.totalProducts} products matching filter`);
      if (stockStatus.availableProducts && stockStatus.availableProducts.length > 0) {
        log(`[Main] ✅ Available: ${stockStatus.availableProducts.map(p => p.title).join(', ')}`);
      }
      
      // Handle perubahan status
      await handleStockChange(stockStatus);
      
      await page.close();
      return { success: true, status: stockStatus };
      
    } catch (error) {
      await page.close();
      throw error;
    }
    
  } catch (error) {
    log(`[Main] ❌ Error: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Main loop
 */
async function main() {
  log('========================================');
  log('  Bot Pemantau Stok Emas Antam');
  log('  Version 2.0.0');
  log('========================================');
  
  // Print config info
  log(`[Main] 📍 Lokasi: ${config.locationName || 'Default'}`);
  log(`[Main] ⚖️ Filter berat: ${config.targetWeights?.join(', ') || 'Semua'}`);
  
  // Cek konfigurasi Telegram
  if (!telegram.isConfigured()) {
    log('[Main] ⚠️ Telegram belum dikonfigurasi!');
    log('[Main] 📝 Salin .env.example ke .env dan isi kredensial Telegram');
  } else {
    await telegram.notifyBotStart();
  }
  
  // Print schedule info
  const scheduleInfo = scheduler.getScheduleStatus();
  log(`[Main] 📅 Hari: ${scheduleInfo.currentDay}, Jam: ${scheduleInfo.currentHour}:00`);
  log(`[Main] 🕐 Jadwal operasional: Senin-Jumat, ${config.schedule.startHour}:00-${config.schedule.endHour}:00`);
  
  isRunning = true;
  
  // Main loop
  while (isRunning) {
    try {
      // Cek apakah dalam jadwal operasional
      if (!scheduler.isActiveTime()) {
        await closeBrowser();
        await scheduler.sleepUntilActive();
        continue;
      }
      
      // Lakukan pengecekan
      const result = await performCheck();
      
      // Handle hasil
      if (result.blocked) {
        await handleDetection();
        continue;
      }
      
      // Interval acak sebelum pengecekan berikutnya
      const interval = scheduler.getRandomInterval();
      log(`[Main] ⏳ Menunggu ${scheduler.formatDuration(interval)} sebelum pengecekan berikutnya...`);
      await scheduler.sleep(interval);
      
    } catch (error) {
      log(`[Main] ❌ Unexpected error: ${error.message}`);
      await telegram.notifyError(error.message);
      
      // Delay sebelum retry
      await scheduler.sleep(60000);
    }
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  log('[Main] 🛑 Shutting down...');
  isRunning = false;
  await closeBrowser();
  process.exit(0);
}

// Handle process signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', async (error) => {
  log(`[Main] 💥 Uncaught exception: ${error.message}`);
  await telegram.notifyError(`Uncaught exception: ${error.message}`);
  await closeBrowser();
});
process.on('unhandledRejection', async (reason, promise) => {
  log(`[Main] 💥 Unhandled rejection: ${reason}`);
  await telegram.notifyError(`Unhandled rejection: ${reason}`);
});

// Start bot
main().catch(async (error) => {
  log(`[Main] 💥 Fatal error: ${error.message}`);
  await telegram.notifyError(`Fatal error: ${error.message}`);
  await closeBrowser();
  process.exit(1);
});
