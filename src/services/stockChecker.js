/**
 * Module Core Stock Checker
 * Handle browser setup, request interception, location selection, dan pengecekan stok
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const config = require('../config');
const { getRandomUserAgent, randomDelay, simulateHumanBehavior } = require('../utils/humanBehavior');

// Aktifkan stealth plugin
puppeteer.use(StealthPlugin());

/**
 * Setup browser dengan konfigurasi optimal untuk VPS
 */
async function setupBrowser() {
  console.log('[Browser] 🚀 Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: config.chromiumArgs,
    defaultViewport: {
      width: 1366,
      height: 768
    }
  });
  
  console.log('[Browser] ✅ Browser launched');
  return browser;
}

/**
 * Setup request interception untuk menghemat bandwidth dan RAM
 * Block: image, stylesheet, font, media, other
 * Allow: document, script, xhr, fetch
 * @param {object} page - Puppeteer page object
 */
async function setupRequestInterception(page) {
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    
    if (config.allowedResourceTypes.includes(resourceType)) {
      request.continue();
    } else {
      request.abort();
    }
  });
  
  console.log('[Browser] 🛡️ Request interception enabled');
}

/**
 * Setup page dengan User-Agent dan konfigurasi anti-detection
 * @param {object} browser - Puppeteer browser object
 */
async function setupPage(browser) {
  const page = await browser.newPage();
  
  // Set random User-Agent
  const userAgent = getRandomUserAgent();
  await page.setUserAgent(userAgent);
  
  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });
  
  // Setup request interception
  await setupRequestInterception(page);
  
  // Set viewport
  await page.setViewport({
    width: 1366 + Math.floor(Math.random() * 100),
    height: 768 + Math.floor(Math.random() * 100)
  });
  
  console.log('[Browser] 📄 Page configured');
  return page;
}

/**
 * Handle modal pemilihan lokasi (boutique)
 * @param {object} page - Puppeteer page object
 */
async function handleLocationModal(page) {
  if (!config.locationId) {
    console.log('[Location] ⏭️ Location ID not set, skipping location selection');
    return { selected: false, reason: 'No location ID configured' };
  }

  try {
    console.log('[Location] 🔍 Checking for location modal...');
    
    // Tunggu modal muncul (dengan timeout singkat)
    const modalSelector = config.locationSelectors.modal;
    const modal = await page.waitForSelector(modalSelector, { timeout: 5000 }).catch(() => null);
    
    if (!modal) {
      console.log('[Location] ℹ️ Location modal not found, may already be set');
      return { selected: false, reason: 'Modal not found' };
    }

    console.log('[Location] 📍 Location modal detected, selecting location...');
    
    // Simulasi delay manusia
    await randomDelay(500, 1000);
    
    // Cari dan pilih dropdown lokasi
    const selectSelector = config.locationSelectors.selectDropdown;
    await page.waitForSelector(selectSelector, { timeout: 5000 });
    
    // Select lokasi berdasarkan ID
    await page.select(selectSelector, config.locationId);
    console.log(`[Location] ✅ Selected location: ${config.locationId}`);
    
    // Delay sebelum klik konfirmasi
    await randomDelay(800, 1500);
    
    // Klik tombol konfirmasi
    const confirmSelector = config.locationSelectors.confirmButton;
    const confirmButton = await page.$(confirmSelector);
    
    if (confirmButton) {
      await confirmButton.click();
      console.log('[Location] ✅ Clicked confirm button');
    } else {
      // Coba cari dengan selector alternatif
      await page.click(confirmSelector).catch(() => {
        console.log('[Location] ⚠️ Confirm button not found, trying to close modal');
      });
    }
    
    // Delay manusia setelah pemilihan lokasi (1-3 detik)
    const locationDelay = Math.floor(
      Math.random() * (config.intervals.locationDelay.max - config.intervals.locationDelay.min + 1)
    ) + config.intervals.locationDelay.min;
    
    console.log(`[Location] ⏳ Waiting ${locationDelay}ms for page refresh...`);
    await randomDelay(locationDelay, locationDelay + 500);
    
    return { 
      selected: true, 
      locationId: config.locationId,
      locationName: config.locationName 
    };
    
  } catch (error) {
    console.log(`[Location] ⚠️ Error handling location modal: ${error.message}`);
    return { selected: false, reason: error.message };
  }
}

/**
 * Cek apakah halaman ter-block (403 / Captcha)
 * @param {object} page - Puppeteer page object
 */
async function isBlocked(page) {
  try {
    const content = await page.content();
    const title = await page.title();
    
    // Cek berbagai indikator blocking
    const blockIndicators = [
      '403 Forbidden',
      'Access Denied',
      'Just a moment',
      'Checking your browser',
      'cf-browser-verification',
      'challenge-running',
      'captcha',
      'Attention Required'
    ];
    
    for (const indicator of blockIndicators) {
      if (content.includes(indicator) || title.includes(indicator)) {
        console.log(`[Checker] 🚫 Detected block indicator: ${indicator}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[Checker] ❌ Error checking block status:', error.message);
    return true; // Assume blocked on error
  }
}

/**
 * Filter produk berdasarkan berat yang dikonfigurasi
 * @param {string} productTitle - Judul produk
 * @returns {boolean} - true jika produk sesuai filter
 */
function matchesTargetWeight(productTitle) {
  // Jika tidak ada target weights, terima semua produk
  if (!config.targetWeights || config.targetWeights.length === 0) {
    return true;
  }
  
  const titleLower = productTitle.toLowerCase();
  
  // Cek apakah judul produk mengandung salah satu target weight
  return config.targetWeights.some(weight => {
    const weightLower = weight.toLowerCase();
    // Normalisasi format (misal: "1 gr", "1gr", "1 gram")
    const variations = [
      weightLower,
      weightLower.replace(' ', ''),
      weightLower.replace('gr', 'gram'),
      weightLower.replace(' gr', ' gram')
    ];
    
    return variations.some(v => titleLower.includes(v));
  });
}

/**
 * Cek status stok di halaman dengan filter berat
 * @param {object} page - Puppeteer page object
 */
async function checkStock(page) {
  try {
    // Tunggu halaman load
    await page.waitForSelector('body', { timeout: 30000 });
    
    // Simulasi human behavior sebelum scraping
    await simulateHumanBehavior(page);
    
    // Cari semua product cards
    const products = await page.$$(config.selectors.productCard);
    console.log(`[Checker] 📦 Found ${products.length} product cards`);
    
    const availableProducts = [];
    const checkedProducts = [];
    
    for (const product of products) {
      try {
        // Ambil judul produk
        const titleElement = await product.$(config.selectors.productTitle);
        const title = titleElement 
          ? await page.evaluate(el => el.innerText.trim(), titleElement)
          : 'Unknown Product';
        
        // Cek apakah produk sesuai dengan filter berat
        if (!matchesTargetWeight(title)) {
          continue; // Skip produk yang tidak sesuai filter
        }
        
        checkedProducts.push(title);
        
        // Ambil harga (optional)
        const priceElement = await product.$(config.selectors.productPrice);
        const price = priceElement
          ? await page.evaluate(el => el.innerText.trim(), priceElement)
          : '';
        
        // Cek tombol "Tambahkan ke Keranjang"
        const cartButton = await product.$(config.selectors.addToCartButton);
        
        if (cartButton) {
          // Cek apakah tombol disabled
          const isDisabled = await page.evaluate((btn, disabledSelector) => {
            return btn.disabled || 
                   btn.classList.contains('disabled') ||
                   btn.classList.contains('out-of-stock') ||
                   btn.closest(disabledSelector) !== null;
          }, cartButton, config.selectors.disabledButton);
          
          // Cek teks tombol
          const buttonText = await page.evaluate(el => el.innerText.toLowerCase(), cartButton);
          const hasStockText = config.selectors.inStockText.some(t => buttonText.includes(t.toLowerCase()));
          const hasOutOfStockText = config.selectors.outOfStockText.some(t => buttonText.includes(t.toLowerCase()));
          
          if (!isDisabled && (hasStockText || !hasOutOfStockText)) {
            availableProducts.push({
              title,
              price,
              buttonText: buttonText.trim(),
              weight: extractWeight(title)
            });
          }
        }
        
      } catch (err) {
        // Ignore individual product errors
      }
    }
    
    console.log(`[Checker] 🔍 Checked ${checkedProducts.length} matching products`);
    console.log(`[Checker] ✅ Found ${availableProducts.length} available products`);
    
    return {
      hasStock: availableProducts.length > 0,
      status: availableProducts.length > 0 ? 'Tersedia' : 'Habis',
      availableProducts,
      checkedCount: checkedProducts.length,
      totalProducts: products.length,
      locationName: config.locationName,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('[Checker] ❌ Error checking stock:', error.message);
    return {
      hasStock: null,
      status: 'Error',
      error: error.message,
      availableProducts: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Extract berat dari judul produk
 * @param {string} title - Judul produk
 * @returns {string} - Berat yang diekstrak
 */
function extractWeight(title) {
  const match = title.match(/(\d+(?:[.,]\d+)?)\s*(gr|gram|g)/i);
  return match ? `${match[1]} gr` : '';
}

/**
 * Navigasi ke halaman target
 * @param {object} page - Puppeteer page object
 */
async function navigateToTarget(page) {
  console.log(`[Checker] 🌐 Navigating to ${config.targetUrl}`);
  
  try {
    const response = await page.goto(config.targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    const statusCode = response ? response.status() : 0;
    console.log(`[Checker] 📊 Response status: ${statusCode}`);
    
    if (statusCode === 403) {
      return { success: false, blocked: true, statusCode };
    }
    
    return { success: statusCode >= 200 && statusCode < 400, blocked: false, statusCode };
    
  } catch (error) {
    console.error('[Checker] ❌ Navigation error:', error.message);
    return { success: false, blocked: false, error: error.message };
  }
}

module.exports = {
  setupBrowser,
  setupPage,
  setupRequestInterception,
  handleLocationModal,
  isBlocked,
  checkStock,
  navigateToTarget,
  matchesTargetWeight,
  extractWeight
};
