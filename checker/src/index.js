/**
 * Multi-User Gold Stock Checker Bot
 * 
 * - Scrape unique locations from active user settings
 * - Save results to stock_cache
 * - Notify users based on their preferences
 */

require('dotenv').config();

const { sequelize, StockCache } = require('./config/database');
const LocationManager = require('./services/locationManager');
const StockScraper = require('./services/stockScraper');
const NotificationMatcher = require('./services/notificationMatcher');
const Scheduler = require('./utils/scheduler');

// State management
let browser = null;
let checkCount = 0;
let isRunning = false;

// Config
const config = {
  browserRestartThreshold: 15,
  intervals: {
    minCheck: 45000,
    maxCheck: 90000,
    sleepCheck: 600000,
    detectionCooldown: 1800000
  },
  schedule: {
    workDays: [1, 2, 3, 4, 5],
    startHour: 8,
    endHour: 17
  }
};

/**
 * Log dengan timestamp
 */
function log(message) {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Cleanup browser
 */
async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
      log('[Checker] 🔒 Browser closed');
    } catch (error) {
      log(`[Checker] ⚠️ Error closing browser: ${error.message}`);
    }
    browser = null;
  }
}

/**
 * Satu siklus pengecekan untuk semua lokasi unik
 */
async function performCheckCycle() {
  checkCount++;
  log(`[Checker] 🔍 Starting check cycle #${checkCount}`);

  try {
    // 1. Get unique active locations from user settings
    const locations = await LocationManager.getUniqueActiveLocations();
    
    if (locations.length === 0) {
      log('[Checker] ⚠️ No active locations to check');
      return { success: true, locationsChecked: 0 };
    }

    log(`[Checker] 📍 Found ${locations.length} unique locations to check`);

    // 2. Restart browser if needed
    if (checkCount % config.browserRestartThreshold === 0 && browser) {
      log('[Checker] 🔄 Restarting browser to prevent memory leak...');
      await closeBrowser();
    }

    // 3. Setup browser if not exists
    if (!browser) {
      browser = await StockScraper.setupBrowser();
    }

    // 4. Scrape each location
    for (const location of locations) {
      log(`[Checker] 📍 Checking location: ${location.locationName} (${location.locationId})`);
      
      try {
        // Scrape stock data
        const stockData = await StockScraper.scrapeLocation(browser, location.locationId);
        
        if (stockData.blocked) {
          log('[Checker] 🚫 Blocked! Starting cooldown...');
          await NotificationMatcher.notifyAdminsBlocked();
          await closeBrowser();
          await Scheduler.sleep(config.intervals.detectionCooldown);
          return { success: false, blocked: true };
        }

        // 5. Save to stock_cache using Sequelize upsert
        await StockCache.upsert({
          locationId: location.locationId,
          locationName: location.locationName,
          lastData: stockData
        });

        log(`[Checker] 💾 Saved stock data for ${location.locationName}`);

        // 6. Match users and send notifications
        await NotificationMatcher.matchAndNotify(location.locationId, stockData);

        // Small delay between locations
        await Scheduler.sleep(2000, 4000);

      } catch (error) {
        log(`[Checker] ❌ Error checking ${location.locationName}: ${error.message}`);
      }
    }

    return { success: true, locationsChecked: locations.length };

  } catch (error) {
    log(`[Checker] ❌ Cycle error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main loop
 */
async function main() {
  log('========================================');
  log('  Multi-User Gold Stock Checker');
  log('  Version 1.0.0 (Sequelize)');
  log('========================================');

  // Test database connection
  try {
    await sequelize.authenticate();
    log('[Checker] ✅ Database connected');
  } catch (error) {
    log(`[Checker] ❌ Database connection failed: ${error.message}`);
    process.exit(1);
  }

  isRunning = true;

  while (isRunning) {
    try {
      // Check if within operating hours
      if (!Scheduler.isActiveTime(config.schedule)) {
        await closeBrowser();
        log('[Checker] 😴 Outside operating hours. Sleeping...');
        await Scheduler.sleepUntilActive(config.schedule, config.intervals.sleepCheck);
        continue;
      }

      // Perform check cycle
      const result = await performCheckCycle();

      if (result.blocked) {
        continue; // Already handled cooldown
      }

      // Random interval before next cycle
      const interval = Scheduler.getRandomInterval(
        config.intervals.minCheck,
        config.intervals.maxCheck
      );
      log(`[Checker] ⏳ Next check in ${Math.round(interval / 1000)}s...`);
      await Scheduler.sleep(interval);

    } catch (error) {
      log(`[Checker] ❌ Main loop error: ${error.message}`);
      await Scheduler.sleep(60000);
    }
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  log('[Checker] 🛑 Shutting down...');
  isRunning = false;
  await closeBrowser();
  await sequelize.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
main().catch(async (error) => {
  log(`[Checker] 💥 Fatal error: ${error.message}`);
  await closeBrowser();
  await sequelize.close();
  process.exit(1);
});
