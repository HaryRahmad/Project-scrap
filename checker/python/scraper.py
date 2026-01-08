#!/usr/bin/env python3
"""
Stock Scraper - Python Playwright Edition

Uses Playwright Python to handle Cloudflare JavaScript challenges automatically.
This runs a real browser to bypass Cloudflare protection.

Usage:
    python scraper.py [--headless] [--debug]
    
Output: JSON result to stdout
"""

import sys
import json
import os
import time
import random
from datetime import datetime
from bs4 import BeautifulSoup

# Configuration
TARGET_URL = "https://www.logammulia.com/id/purchase/gold"
COOKIES_FILE = os.path.join(os.path.dirname(__file__), '..', 'cookies.json')
DEBUG_MODE = "--debug" in sys.argv or os.environ.get("DEBUG_MODE", "false").lower() == "true"
HEADLESS = "--headless" in sys.argv or os.environ.get("HEADLESS", "true").lower() == "true"

def log(message, level="info"):
    """Log to stderr so it doesn't mix with JSON output"""
    if level == "debug" and not DEBUG_MODE:
        return
    timestamp = datetime.now().strftime("%d/%m/%Y, %H.%M.%S")
    prefix = {"error": "❌", "warn": "⚠️", "debug": "🔍"}.get(level, "📋")
    print(f"[{timestamp}] [Python-PW] {prefix} {message}", file=sys.stderr)

def random_delay(min_ms=500, max_ms=1500):
    """Random delay for human-like behavior"""
    time.sleep(random.uniform(min_ms/1000, max_ms/1000))

def load_cookies():
    """Load cookies from JSON file"""
    try:
        if os.path.exists(COOKIES_FILE):
            with open(COOKIES_FILE, 'r') as f:
                cookies = json.load(f)
            log(f"Loaded {len(cookies)} cookies", "debug")
            return cookies
    except Exception as e:
        log(f"Failed to load cookies: {e}", "warn")
    return []

def save_cookies(cookies):
    """Save cookies to JSON file"""
    try:
        with open(COOKIES_FILE, 'w') as f:
            json.dump(cookies, f, indent=2)
        log(f"Saved {len(cookies)} cookies", "debug")
    except Exception as e:
        log(f"Failed to save cookies: {e}", "warn")

def parse_products(html):
    """Parse products from HTML"""
    soup = BeautifulSoup(html, 'lxml')
    products = []
    
    # Find product items
    selectors = ['.product-item', '.product', '[class*="product"]']
    items = []
    
    for sel in selectors:
        found = soup.select(sel)
        if len(found) > len(items):
            items = found
    
    log(f"Found {len(items)} product elements", "debug")
    
    for index, item in enumerate(items):
        # Title
        title = ""
        title_sels = ['.product-name', '.product-title', 'h3', 'h4', '[class*="title"]', 'a[title]']
        for sel in title_sels:
            el = item.select_one(sel)
            if el:
                title = el.get_text(strip=True) or el.get('title', '')
                if title:
                    break
        
        # Price
        price = ""
        price_el = item.select_one('.price, [class*="price"]')
        if price_el and 'Rp' in price_el.get_text():
            price = price_el.get_text(strip=True)
        
        # Stock check
        no_stock = item.select_one('span.no-stock, .no-stock') is not None
        qty_input = item.select_one('input.qty, input[class*="qty"]') is not None
        item_text = item.get_text().lower()
        
        has_stock = False
        if qty_input:
            has_stock = True
        if no_stock or 'belum tersedia' in item_text or 'habis' in item_text:
            has_stock = False
        
        if title and len(title) > 2:
            products.append({
                "title": title,
                "price": price,
                "hasStock": has_stock,
                "index": index
            })
    
    return products

def is_cloudflare_blocked(page):
    """Check if page is blocked by Cloudflare"""
    try:
        title = page.title().lower()
        content = page.content().lower()
        
        indicators = [
            'just a moment',
            'checking your browser',
            'attention required',
            'sorry, you have been blocked',
            'cloudflare',
            'cf-browser-verification'
        ]
        
        return any(ind in title or ind in content for ind in indicators)
    except:
        return True

def wait_for_cloudflare(page, timeout=60):
    """Wait for Cloudflare challenge to pass"""
    log("Waiting for Cloudflare challenge...", "debug")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        if not is_cloudflare_blocked(page):
            log("✅ Cloudflare passed!")
            return True
        
        # Random mouse movement to appear human
        try:
            page.mouse.move(
                random.randint(100, 500),
                random.randint(100, 400)
            )
        except:
            pass
        
        time.sleep(2)
    
    log("Cloudflare timeout", "warn")
    return False

def scrape():
    """Main scrape function using Playwright"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {
            "error": "playwright not installed. Run: pip install playwright && python -m playwright install chromium",
            "blocked": False,
            "hasStock": False,
            "availableProducts": [],
            "timestamp": datetime.now().isoformat()
        }
    
    log(f"Starting Playwright browser (headless={HEADLESS})...")
    
    try:
        with sync_playwright() as p:
            # Launch browser with anti-detection settings
            browser = p.chromium.launch(
                headless=HEADLESS,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                ]
            )
            
            # Create context with realistic browser fingerprint
            context = browser.new_context(
                viewport={'width': 1366, 'height': 768},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                locale='id-ID',
                timezone_id='Asia/Jakarta',
            )
            
            # Load saved cookies
            saved_cookies = load_cookies()
            if saved_cookies:
                log(f"Injecting {len(saved_cookies)} saved cookies...")
                try:
                    # Convert cookie format for Playwright
                    pw_cookies = []
                    for c in saved_cookies:
                        cookie = {
                            'name': c.get('name'),
                            'value': c.get('value'),
                            'domain': c.get('domain', '.logammulia.com'),
                            'path': c.get('path', '/'),
                        }
                        if c.get('expires') and c.get('expires') > 0:
                            cookie['expires'] = c.get('expires')
                        pw_cookies.append(cookie)
                    context.add_cookies(pw_cookies)
                except Exception as e:
                    log(f"Cookie injection failed: {e}", "warn")
            
            # Anti-detection script
            page = context.new_page()
            page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                window.chrome = { runtime: {} };
            """)
            
            # Navigate to target
            log(f"Navigating to {TARGET_URL}...")
            page.goto(TARGET_URL, wait_until='domcontentloaded', timeout=60000)
            
            random_delay(1000, 2000)
            
            # Wait for Cloudflare if needed
            if is_cloudflare_blocked(page):
                passed = wait_for_cloudflare(page, timeout=60)
                if not passed:
                    log("Still blocked by Cloudflare", "error")
                    if DEBUG_MODE:
                        page.screenshot(path=f"./debug_blocked_{int(time.time())}.png")
                    browser.close()
                    return {"blocked": True, "timestamp": datetime.now().isoformat()}
            
            # Save new cookies for future use
            new_cookies = context.cookies()
            if new_cookies:
                save_cookies(new_cookies)
            
            # Wait for page to fully load
            random_delay(2000, 3000)
            
            # Get page content
            html = page.content()
            log(f"Page loaded, {len(html)} chars", "debug")
            
            # Parse products
            products = parse_products(html)
            available_products = [p for p in products if p.get('hasStock')]
            
            log(f"Total: {len(products)}, Available: {len(available_products)}")
            
            if DEBUG_MODE:
                page.screenshot(path=f"./debug_page_{int(time.time())}.png")
            
            browser.close()
            
            return {
                "blocked": False,
                "hasStock": len(available_products) > 0,
                "availableProducts": available_products,
                "allProducts": products,
                "totalProducts": len(products),
                "timestamp": datetime.now().isoformat()
            }
            
    except Exception as e:
        log(f"Error: {e}", "error")
        return {
            "blocked": False,
            "hasStock": False,
            "error": str(e),
            "availableProducts": [],
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    result = scrape()
    # Output JSON to stdout
    print(json.dumps(result, indent=2))
