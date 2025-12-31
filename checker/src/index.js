/**
 * Multi-User Gold Stock Checker Bot
 * 
 * Dynamic Unique Queueing:
 * - Query unique locations from active user settings
 * - Idle mode when no active users
 * - POST stock updates to Server API for notification dispatch
 */

require('dotenv').config();

const axios = require('axios');
const { sequelize } = require('./config/database');
const LocationManager = require('./services/locationManager');
const StockScraper = require('./services/stockScraper');
const Scheduler = require('./utils/scheduler');

// State management
let browser = null;
let checkCount = 0;
let isRunning = false;

// Config
const config = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
  checkerSecret: process.env.CHECKER_SECRET || '',
  browserRestartThreshold: 15,
  intervals: {
    minCheck: 45000,      // 45 seconds
    maxCheck: 90000,      // 90 seconds
    idleCheck: 300000,    // 5 minutes (when no active users)
    sleepCheck: 600000,   // 10 minutes
    detectionCooldown: 1800000, // 30 minutes
    betweenLocations: { min: 2000, max: 4000 }
  },
  schedule: {
    workDays: [1, 2, 3, 4, 5], // Monday - Friday
    startHour: 8,
    endHour: 20  // 8 PM
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
 * POST stock update to Server API
 */
async function postStockUpdate(locationId, locationName, stockData) {
  try {
    const response = await axios.post(`${config.serverUrl}/api/stock/update`, {
      locationId,
      locationName,
      stockData,
      secret: config.checkerSecret
    }, {
      timeout: 10000
    });

    if (response.data.success) {
      log(`[Checker] 📤 Posted to server: ${response.data.data.notified} users notified`);
    }
    return response.data;
  } catch (error) {
    log(`[Checker] ⚠️ Failed to POST to server: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * POST blocked notification to Server
 */
async function postBlocked() {
  try {
    await axios.post(`${config.serverUrl}/api/stock/blocked`, {
      secret: config.checkerSecret
    }, {
      timeout: 10000
    });
    log('[Checker] 📤 Blocked notification sent to server');
  } catch (error) {
    log(`[Checker] ⚠️ Failed to notify server about block: ${error.message}`);
  }
}

/**
 * Satu siklus pengecekan untuk semua lokasi unik
 */
async function performCheckCycle() {
  checkCount++;
  log(`[Checker] 🔍 Starting check cycle #${checkCount}`);

  try {
    // 1. Get unique active locations from user settings (Dynamic Queue)
    const locations = await LocationManager.getUniqueActiveLocations();
    
    if (locations.length === 0) {
      log('[Checker] 😴 No active locations - entering idle mode...');
      return { success: true, locationsChecked: 0, idle: true };
    }

    log(`[Checker] 📍 Found ${locations.length} unique locations to check`);

    // 2. Restart browser if needed (prevent memory leak)
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
      log(`[Checker] 📍 Checking: ${location.locationName} (${location.locationId})`);
      
      try {
        // Scrape stock data
        const stockData = await StockScraper.scrapeLocation(browser, location.locationId);
        
        if (stockData.blocked) {
          log('[Checker] 🚫 Blocked! Starting cooldown...');
          await postBlocked();
          await closeBrowser();
          await Scheduler.sleep(config.intervals.detectionCooldown);
          return { success: false, blocked: true };
        }

        // 5. POST to Server API (Server handles cache + notifications)
        await postStockUpdate(
          location.locationId,
          location.locationName,
          stockData
        );

        // Log stock status
        if (stockData.hasStock) {
          log(`[Checker] ✅ STOCK AVAILABLE at ${location.locationName}! ${stockData.availableProducts?.length || 0} products`);
        } else {
          log(`[Checker] ❌ No stock at ${location.locationName}`);
        }

        // Small delay between locations (anti-detection)
        const delay = Scheduler.getRandomInterval(
          config.intervals.betweenLocations.min,
          config.intervals.betweenLocations.max
        );
        await Scheduler.sleep(delay);

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
 * Main loop with Dynamic Queueing
 */
async function main() {
  log('========================================');
  log('  Multi-User Gold Stock Checker');
  log('  Version 2.0.0 (Dynamic Queue + Event-Driven)');
  log('========================================');
  log(`  Server URL: ${config.serverUrl}`);
  log(`  Operating Hours: ${config.schedule.startHour}:00 - ${config.schedule.endHour}:00`);
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

      // Determine next interval based on result
      let interval;
      if (result.idle) {
        // No active users - use longer idle interval
        interval = config.intervals.idleCheck;
        log(`[Checker] 😴 Idle mode - next check in ${Math.round(interval / 1000)}s...`);
      } else {
        // Normal operation - random interval
        interval = Scheduler.getRandomInterval(
          config.intervals.minCheck,
          config.intervals.maxCheck
        );
        log(`[Checker] ⏳ Next check in ${Math.round(interval / 1000)}s...`);
      }
      
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
