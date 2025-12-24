/**
 * Module Simulasi Perilaku Manusia
 * Untuk menghindari deteksi bot
 */

const config = require('../config');

/**
 * Delay dengan durasi acak
 * @param {number} min - Minimum milidetik
 * @param {number} max - Maximum milidetik
 */
async function randomDelay(min = 500, max = 2000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Dapatkan User-Agent acak dari daftar
 */
function getRandomUserAgent() {
  const index = Math.floor(Math.random() * config.userAgents.length);
  return config.userAgents[index];
}

/**
 * Simulasi pergerakan mouse acak
 * @param {object} page - Puppeteer page object
 */
async function randomMouseMove(page) {
  try {
    const viewport = page.viewport();
    if (!viewport) return;

    // Generate 2-4 random mouse movements
    const movements = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < movements; i++) {
      const x = Math.floor(Math.random() * (viewport.width - 100)) + 50;
      const y = Math.floor(Math.random() * (viewport.height - 100)) + 50;
      
      // Move dengan kecepatan natural (steps acak)
      const steps = Math.floor(Math.random() * 10) + 5;
      await page.mouse.move(x, y, { steps });
      
      await randomDelay(100, 300);
    }
    
    console.log('[Human] 🖱️ Mouse movement simulated');
  } catch (error) {
    // Ignore mouse movement errors
  }
}

/**
 * Simulasi scroll halus
 * @param {object} page - Puppeteer page object
 * @param {number} minDistance - Jarak scroll minimum (default 200)
 * @param {number} maxDistance - Jarak scroll maximum (default 500)
 */
async function smoothScroll(page, minDistance = 200, maxDistance = 500) {
  try {
    const distance = Math.floor(Math.random() * (maxDistance - minDistance + 1)) + minDistance;
    const direction = Math.random() > 0.3 ? 1 : -1; // 70% scroll down, 30% scroll up
    const actualDistance = distance * direction;
    
    // Scroll dengan increment kecil untuk efek smooth
    const steps = Math.floor(Math.abs(actualDistance) / 20);
    const stepDistance = actualDistance / steps;
    
    for (let i = 0; i < steps; i++) {
      await page.evaluate((scrollY) => {
        window.scrollBy(0, scrollY);
      }, stepDistance);
      
      await randomDelay(10, 30);
    }
    
    console.log(`[Human] 📜 Scrolled ${actualDistance}px`);
  } catch (error) {
    // Ignore scroll errors
  }
}

/**
 * Simulasi hover pada elemen acak
 * @param {object} page - Puppeteer page object
 */
async function randomHover(page) {
  try {
    // Cari elemen yang bisa di-hover
    const elements = await page.$$('a, button, .product-item, [class*="product"]');
    
    if (elements.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(elements.length, 5));
      const element = elements[randomIndex];
      
      const box = await element.boundingBox();
      if (box) {
        await page.mouse.move(
          box.x + box.width / 2,
          box.y + box.height / 2,
          { steps: Math.floor(Math.random() * 10) + 5 }
        );
        await randomDelay(200, 500);
      }
    }
    
    console.log('[Human] 👆 Random hover simulated');
  } catch (error) {
    // Ignore hover errors
  }
}

/**
 * Jalankan semua simulasi perilaku manusia
 * @param {object} page - Puppeteer page object
 */
async function simulateHumanBehavior(page) {
  console.log('[Human] 🎭 Simulating human behavior...');
  
  // Delay awal setelah page load
  await randomDelay(1000, 2000);
  
  // Random mouse movement
  await randomMouseMove(page);
  
  // Scroll halus
  await smoothScroll(page);
  
  // Delay sebelum pengecekan
  await randomDelay(500, 1000);
  
  console.log('[Human] ✅ Human behavior simulation complete');
}

module.exports = {
  randomDelay,
  getRandomUserAgent,
  randomMouseMove,
  smoothScroll,
  randomHover,
  simulateHumanBehavior
};
