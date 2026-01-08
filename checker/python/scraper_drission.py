#!/usr/bin/env python3
"""
Stock Scraper - DrissionPage Edition

Uses DrissionPage which connects to Chrome via DevTools Protocol.
This has better anti-detection than Playwright/Selenium because it uses
the actual Chrome browser without automation markers.

Usage:
    python scraper_drission.py [--debug]
    
Output: JSON result to stdout
"""

import sys
import json
import os
import time
import random
from datetime import datetime

# Configuration
TARGET_URL = "https://www.logammulia.com/id/purchase/gold"
COOKIES_FILE = os.path.join(os.path.dirname(__file__), '..', 'cookies.json')
DEBUG_MODE = "--debug" in sys.argv or os.environ.get("DEBUG_MODE", "false").lower() == "true"

def log(message, level="info"):
    """Log to stderr so it doesn't mix with JSON output"""
    if level == "debug" and not DEBUG_MODE:
        return
    timestamp = datetime.now().strftime("%d/%m/%Y, %H.%M.%S")
    prefix = {"error": "❌", "warn": "⚠️", "debug": "🔍"}.get(level, "📋")
    print(f"[{timestamp}] [DrissionPage] {prefix} {message}", file=sys.stderr)

def random_delay(min_ms=500, max_ms=1500):
    """Random delay for human-like behavior"""
    time.sleep(random.uniform(min_ms/1000, max_ms/1000))

def save_cookies(page):
    """Save cookies to JSON file"""
    try:
        cookies = page.cookies(as_dict=False)
        if cookies:
            # Convert to standard format
            cookie_list = []
            for c in cookies:
                cookie_list.append({
                    'name': c.get('name'),
                    'value': c.get('value'),
                    'domain': c.get('domain', '.logammulia.com'),
                    'path': c.get('path', '/'),
                    'expires': c.get('expires', -1),
                    'httpOnly': c.get('httpOnly', False),
                    'secure': c.get('secure', False),
                })
            with open(COOKIES_FILE, 'w') as f:
                json.dump(cookie_list, f, indent=2)
            log(f"Saved {len(cookie_list)} cookies", "debug")
    except Exception as e:
        log(f"Failed to save cookies: {e}", "warn")

def load_cookies(page):
    """Load cookies from JSON file"""
    try:
        if os.path.exists(COOKIES_FILE):
            with open(COOKIES_FILE, 'r') as f:
                cookies = json.load(f)
            for c in cookies:
                try:
                    page.set.cookies(c)
                except:
                    pass
            log(f"Loaded {len(cookies)} cookies", "debug")
    except Exception as e:
        log(f"Failed to load cookies: {e}", "warn")

def parse_products(page):
    """Parse products from page"""
    products = []
    
    try:
        # Find product items
        items = page.eles('css:.product-item') or page.eles('css:.product') or page.eles('css:[class*="product"]')
        
        log(f"Found {len(items)} product elements", "debug")
        
        for index, item in enumerate(items):
            try:
                # Title
                title = ""
                title_el = item.ele('css:.product-name') or item.ele('css:.product-title') or item.ele('css:h3') or item.ele('css:h4')
                if title_el:
                    title = title_el.text.strip()
                
                # Price
                price = ""
                price_el = item.ele('css:.price') or item.ele('css:[class*="price"]')
                if price_el and 'Rp' in price_el.text:
                    price = price_el.text.strip()
                
                # Stock check
                no_stock = item.ele('css:span.no-stock') or item.ele('css:.no-stock')
                qty_input = item.ele('css:input.qty') or item.ele('css:input[class*="qty"]')
                item_text = item.text.lower() if item.text else ""
                
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
            except Exception as e:
                log(f"Error parsing product {index}: {e}", "debug")
                continue
                
    except Exception as e:
        log(f"Error finding products: {e}", "warn")
    
    return products

def is_cloudflare_blocked(page):
    """Check if page is blocked by Cloudflare"""
    try:
        title = page.title.lower() if page.title else ""
        html = page.html.lower() if page.html else ""
        
        indicators = [
            'just a moment',
            'checking your browser',
            'attention required',
            'sorry, you have been blocked',
            'cloudflare',
            'cf-browser-verification'
        ]
        
        return any(ind in title or ind in html for ind in indicators)
    except:
        return True

def wait_for_cloudflare(page, timeout=90):
    """Wait for Cloudflare challenge to pass"""
    log("Waiting for Cloudflare challenge (auto-solve)...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        if not is_cloudflare_blocked(page):
            log("✅ Cloudflare passed!")
            return True
        
        # Human-like behavior
        try:
            # Move mouse randomly
            page.actions.move(
                random.randint(200, 600),
                random.randint(200, 500),
                duration=random.uniform(0.3, 0.8)
            )
        except:
            pass
        
        time.sleep(3)
        log(f"Still waiting... ({int(time.time() - start_time)}s)", "debug")
    
    log("Cloudflare timeout", "warn")
    return False

def scrape():
    """Main scrape function using DrissionPage"""
    try:
        from DrissionPage import ChromiumPage, ChromiumOptions
    except ImportError:
        return {
            "error": "DrissionPage not installed. Run: pip install DrissionPage",
            "blocked": False,
            "hasStock": False,
            "availableProducts": [],
            "timestamp": datetime.now().isoformat()
        }
    
    log("Starting Chrome via DrissionPage (DevTools Protocol)...")
    
    try:
        # Configure Chrome options
        options = ChromiumOptions()
        options.set_argument('--disable-blink-features=AutomationControlled')
        options.set_argument('--no-sandbox')
        options.set_argument('--disable-dev-shm-usage')
        options.set_argument('--lang=id-ID')
        
        # Use system Chrome if available
        options.auto_port()
        
        # Create page
        page = ChromiumPage(options)
        
        # Set viewport
        page.set.window.size(1366, 768)
        
        # Load saved cookies
        load_cookies(page)
        
        # Navigate to target
        log(f"Navigating to {TARGET_URL}...")
        page.get(TARGET_URL)
        
        random_delay(2000, 3000)
        
        # Wait for Cloudflare if needed
        if is_cloudflare_blocked(page):
            passed = wait_for_cloudflare(page, timeout=90)
            if not passed:
                log("Still blocked by Cloudflare", "error")
                if DEBUG_MODE:
                    page.get_screenshot(f"./debug_blocked_{int(time.time())}.png")
                page.quit()
                return {"blocked": True, "timestamp": datetime.now().isoformat()}
        
        # Save new cookies
        save_cookies(page)
        
        # Wait for page to fully load
        random_delay(2000, 4000)
        
        # Parse products
        products = parse_products(page)
        available_products = [p for p in products if p.get('hasStock')]
        
        log(f"Total: {len(products)}, Available: {len(available_products)}")
        
        if DEBUG_MODE:
            page.get_screenshot(f"./debug_page_{int(time.time())}.png")
        
        page.quit()
        
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
        import traceback
        log(traceback.format_exc(), "debug")
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
