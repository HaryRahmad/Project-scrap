/**
 * Stock Scraper Service
 * Handle Puppeteer browser and stock scraping
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Config
const config = {
  targetUrl: 'https://www.logammulia.com/id/purchase/gold',
  chromiumArgs: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--disable-background-networking',
    '--mute-audio',
    '--no-first-run',
    '--disable-setuid-sandbox',
    '--disable-accelerated-2d-canvas'
  ],
  allowedResourceTypes: ['document', 'script', 'xhr', 'fetch'],
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ]
};

class StockScraper {
  /**
   * Setup browser with stealth
   */
  static async setupBrowser() {
    console.log('[Scraper] 🚀 Launching browser...');
    
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: config.chromiumArgs,
        defaultViewport: { width: 1366, height: 768 },
        protocolTimeout: 60000,
        timeout: 60000
      });
      
      console.log('[Scraper] ✅ Browser launched');
      return browser;
    } catch (error) {
      console.error('[Scraper] ❌ Failed to launch browser:', error.message);
      throw error;
    }
  }

  /**
   * Setup page with request interception
   */
  static async setupPage(browser) {
    const page = await browser.newPage();
    
    // Random user agent
    const ua = config.userAgents[Math.floor(Math.random() * config.userAgents.length)];
    await page.setUserAgent(ua);
    
    // Request interception
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (config.allowedResourceTypes.includes(req.resourceType())) {
        req.continue();
      } else {
        req.abort();
      }
    });
    
    return page;
  }

  /**
   * Check if page is blocked
   */
  static async isBlocked(page) {
    try {
      const content = await page.content();
      const blockIndicators = [
        '403 Forbidden', 'Access Denied', 'Just a moment',
        'Checking your browser', 'captcha', 'Attention Required'
      ];
      
      return blockIndicators.some(i => content.includes(i));
    } catch {
      return true;
    }
  }

  /**
   * Handle location modal selection
   */
  static async selectLocation(page, locationId) {
    try {
      // Wait for modal (short timeout)
      const modal = await page.waitForSelector('.modal-location, #modal-location', { timeout: 5000 }).catch(() => null);
      
      if (!modal) return false;
      
      // Select location
      await page.select('select[name="location"]', locationId).catch(() => {});
      await page.waitForTimeout(1000);
      
      // Click confirm
      await page.click('.btn-primary-full, .btn-confirm').catch(() => {});
      await page.waitForTimeout(2000);
      
      console.log(`[Scraper] 📍 Selected location: ${locationId}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Simulate human behavior
   */
  static async simulateHuman(page) {
    try {
      // Random mouse movement
      const x = 100 + Math.random() * 500;
      const y = 100 + Math.random() * 300;
      await page.mouse.move(x, y, { steps: 10 });
      
      // Scroll
      await page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 300));
      await page.waitForTimeout(500 + Math.random() * 1000);
    } catch {}
  }

  /**
   * Scrape stock for a specific location
   */
  static async scrapeLocation(browser, locationId) {
    const page = await this.setupPage(browser);
    
    try {
      // Navigate
      const response = await page.goto(config.targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      
      if (response?.status() === 403 || await this.isBlocked(page)) {
        await page.close();
        return { blocked: true };
      }
      
      // Handle location modal
      await this.selectLocation(page, locationId);
      
      // Simulate human behavior
      await this.simulateHuman(page);
      
      // Wait for products
      await page.waitForSelector('.product-card, .product-item', { timeout: 10000 }).catch(() => {});
      
      // Extract products
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('.product-card, .product-item, [class*="product"]');
        const results = [];
        
        items.forEach(item => {
          const title = item.querySelector('.product-title, h3, h4, [class*="title"]')?.innerText?.trim();
          const price = item.querySelector('.product-price, .price, [class*="price"]')?.innerText?.trim();
          const button = item.querySelector('button, .btn');
          
          if (title) {
            const isDisabled = button?.disabled || button?.classList.contains('disabled');
            const buttonText = button?.innerText?.toLowerCase() || '';
            const hasStock = !isDisabled && 
              (buttonText.includes('tambah') || buttonText.includes('beli') || buttonText.includes('cart'));
            
            results.push({
              title,
              price: price || '',
              hasStock,
              buttonText: buttonText.trim()
            });
          }
        });
        
        return results;
      });
      
      await page.close();
      
      const availableProducts = products.filter(p => p.hasStock);
      
      return {
        blocked: false,
        hasStock: availableProducts.length > 0,
        availableProducts,
        allProducts: products,
        totalProducts: products.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      await page.close();
      console.error('[Scraper] Error:', error.message);
      return {
        blocked: false,
        hasStock: false,
        error: error.message,
        availableProducts: [],
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = StockScraper;
