#!/usr/bin/env python3
"""
scraper_ultrafast.py - Ultra-Fast Scraper with Traffic Handling
- Block images/fonts/analytics only, keep CSS
- Retry logic untuk high traffic (up to 3 retries)
- Extended timeout untuk slow response
"""

import sys, os, time, json
from datetime import datetime
from bs4 import BeautifulSoup

PROFILE_DIR = os.path.join(os.path.dirname(__file__), 'browser_profile')
LOCATION_URL = "https://www.logammulia.com/id/change-location"
GOLD_URL = "https://www.logammulia.com/id/purchase/gold"

# Timeout settings
ELEMENT_TIMEOUT = 10  # Timeout untuk wait element (naik dari 5)
MAX_RETRIES = 3       # Max retry jika 0 products

LOCATION_MAP = {
    "bandung": ("BDH01", "Bandung"),
    "jakarta": ("BEL01", "Jakarta"),
    "surabaya": ("SBYB01", "Surabaya"),
    "medan": ("MDN01", "Medan"),
}

def log(msg):
    ts = datetime.now().strftime("%d/%m/%Y, %H.%M.%S")
    print(f"[{ts}] {msg}", file=sys.stderr)

def parse_products(html):
    soup = BeautifulSoup(html, 'lxml')
    products = []
    
    for row in soup.select('.ct-body .ctr'):
        try:
            col = row.select_one('.ctd.item-1 .ngc-text')
            if not col: continue
            
            title = col.get_text(strip=True).split('\n')[0]
            if 'perak' in title.lower() or 'silver' in title.lower():
                continue
            if not any(x in title.lower() for x in ['emas', 'batangan', 'gram']):
                continue
            
            price = row.select_one('.ctd.item-2')
            price = price.get_text(strip=True) if price else ""
            has_stock = not row.select_one('span.no-stock')
            
            products.append({"title": title, "price": price, "hasStock": has_stock})
        except:
            continue
    
    return products

def scrape(location="bandung"):
    start = time.time()
    
    if location not in LOCATION_MAP:
        location = "bandung"
    storage_id, city_name = LOCATION_MAP[location]
    
    log(f"Starting: {location}")
    
    try:
        from DrissionPage import ChromiumPage, ChromiumOptions
    except ImportError:
        return {"error": "DrissionPage not installed", "blocked": True}
    
    page = None
    try:
        os.makedirs(PROFILE_DIR, exist_ok=True)
        
        opts = ChromiumOptions()
        opts.set_argument('--disable-blink-features=AutomationControlled')
        opts.set_argument('--lang=id-ID')
        opts.set_argument('--disable-dev-shm-usage')
        opts.set_argument('--no-sandbox')
        opts.set_argument('--disable-gpu')
        opts.set_user_data_path(PROFILE_DIR)
        opts.auto_port()
        
        page = ChromiumPage(opts)
        page.set.window.size(1280, 720)
        page.set.load_mode.eager()
        
        # Block images, fonts, analytics ONLY - keep CSS
        try:
            page.set.blocked_urls([
                '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg', '*.ico', '*.bmp',
                '*.woff', '*.woff2', '*.ttf', '*.eot', '*.otf',
                '*google-analytics*', '*googletagmanager*', '*facebook*',
                '*hotjar*', '*clarity*', '*doubleclick*'
            ])
        except: pass
        
        # Go to change-location
        log("Loading change-location...")
        page.get(LOCATION_URL)
        
        # Select using JS (with extended timeout for high traffic)
        log("Selecting location...")
        try:
            page.ele('css:select', timeout=ELEMENT_TIMEOUT)  # Wait for select
        except:
            log("⚠️ Select not found, continuing...")
        
        page.run_js(f'''
            var select = document.querySelector('select');
            if (select) {{
                for (var i = 0; i < select.options.length; i++) {{
                    if (select.options[i].text.toLowerCase().includes('{city_name.lower()}')) {{
                        select.selectedIndex = i;
                        select.dispatchEvent(new Event('change'));
                        break;
                    }}
                }}
            }}
        ''')
        
        # Submit
        log("Submitting...")
        page.run_js('''
            var btn = document.querySelector('.btn-primary');
            if (btn) btn.click();
        ''')
        time.sleep(0.3)
        
        # ADD CSS blocking untuk gold page (meringankan load)
        log("Blocking CSS for gold page...")
        css_blocked = True
        try:
            page.set.blocked_urls([
                '*.css', '*.less', '*.scss',  # CSS
                '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg', '*.ico', '*.bmp',
                '*.woff', '*.woff2', '*.ttf', '*.eot', '*.otf',
                '*google-analytics*', '*googletagmanager*', '*facebook*',
                '*hotjar*', '*clarity*', '*doubleclick*'
            ])
        except: 
            css_blocked = False
        
        # Go to gold page
        log("Loading gold page...")
        page.get(GOLD_URL)
        
        # Wait for products with retry logic
        products = []
        for attempt in range(MAX_RETRIES):
            try:
                page.ele('css:.ct-body', timeout=ELEMENT_TIMEOUT)
            except:
                pass
            
            products = parse_products(page.html)
            
            if len(products) >= 5:
                break
            
            if attempt < MAX_RETRIES - 1:
                wait_time = 1 + attempt  # 1s, 2s, 3s
                log(f"⏳ Retry {attempt + 1}/{MAX_RETRIES} in {wait_time}s...")
                time.sleep(wait_time)
        
        # FALLBACK: Jika masih 0 products dan CSS blocked, retry tanpa blocking
        if len(products) < 5 and css_blocked:
            log("⚠️ CSS blocking gagal, retry tanpa blocking...")
            try:
                # Clear blocked URLs
                page.set.blocked_urls([
                    '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg', '*.ico',
                    '*.woff', '*.woff2', '*.ttf', '*.eot',
                    '*google-analytics*', '*googletagmanager*', '*facebook*'
                ])
            except: pass
            
            # Reload page
            page.get(GOLD_URL)
            time.sleep(2)
            products = parse_products(page.html)
        
        available = [p for p in products if p.get('hasStock')]
        elapsed = round(time.time() - start, 1)
        
        log(f"Done: {len(products)} products in {elapsed}s")
        
        page.quit()
        
        return {
            "blocked": False,
            "hasStock": len(available) > 0,
            "availableProducts": available,
            "allProducts": products,
            "totalProducts": len(products),
            "location": location,
            "locationId": storage_id,
            "elapsedSeconds": elapsed,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        log(f"Error: {e}")
        if page:
            try: page.quit()
            except: pass
        return {"blocked": False, "error": str(e), "timestamp": datetime.now().isoformat()}

def main():
    loc = "bandung"
    for arg in sys.argv:
        if arg.startswith("--location="):
            loc = arg.split("=")[1].lower()
    
    result = scrape(loc)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
