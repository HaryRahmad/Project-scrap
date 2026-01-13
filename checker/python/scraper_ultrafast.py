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

# Map locationId (storage_id) to display name
# Now indexed by locationId directly (not city name)
LOCATION_ID_MAP = {
    # Jakarta & Sekitarnya
    "200": "Jakarta - Pulo Gadung",
    "203": "Jakarta - TB Simatupang",
    "205": "Jakarta - Setiabudi One",
    "214": "Jakarta - Puri Indah",
    "215": "Bekasi",
    "216": "Tangerang",
    "217": "Tangerang Selatan",
    "218": "Bogor",
    
    # Jawa Barat
    "201": "Bandung",
    
    # Jawa Tengah
    "212": "Semarang",
    "213": "Yogyakarta",
    
    # Jawa Timur
    "202": "Surabaya - Darmo",
    "220": "Surabaya - Pakuwon",
    
    # Luar Jawa
    "206": "Medan",
    "207": "Makassar",
    "208": "Palembang",
    "209": "Bali",
    "210": "Balikpapan",
}

# Legacy mapping for backward compatibility (city name -> storage_id)
LOCATION_MAP = {
    "jakarta": ("200", "Jakarta"),
    "bekasi": ("215", "Bekasi"),
    "tangerang": ("216", "Tangerang"),
    "tangerangselatan": ("217", "Tangerang Selatan"),
    "bogor": ("218", "Bogor"),
    "bandung": ("201", "Bandung"),
    "semarang": ("212", "Semarang"),
    "yogyakarta": ("213", "Yogyakarta"),
    "surabaya": ("202", "Surabaya"),
    "bali": ("209", "Bali"),
    "medan": ("206", "Medan"),
    "palembang": ("208", "Palembang"),
    "balikpapan": ("210", "Balikpapan"),
    "makassar": ("207", "Makassar"),
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
        # Standard flags
        opts.set_argument('--disable-blink-features=AutomationControlled')
        opts.set_argument('--lang=id-ID')
        opts.set_argument('--no-sandbox')
        opts.set_argument('--disable-dev-shm-usage')
        opts.set_argument('--disable-gpu')
        
        # HIDE BROWSER WINDOW - Position off-screen
        opts.set_argument('--window-position=-2400,-2400')
        opts.set_argument('--window-size=1,1')
        
        # SPEED OPTIMIZATION FLAGS
        opts.set_argument('--disable-extensions')
        opts.set_argument('--disable-plugins')
        opts.set_argument('--disable-sync')
        opts.set_argument('--disable-translate')
        opts.set_argument('--disable-background-networking')
        opts.set_argument('--disable-default-apps')
        opts.set_argument('--disable-hang-monitor')
        opts.set_argument('--disable-popup-blocking')
        opts.set_argument('--disable-prompt-on-repost')
        opts.set_argument('--disable-client-side-phishing-detection')
        opts.set_argument('--disable-component-update')
        opts.set_argument('--no-first-run')
        opts.set_argument('--no-default-browser-check')
        
        opts.set_user_data_path(PROFILE_DIR)
        opts.auto_port()
        
        page = ChromiumPage(opts)
        page.set.window.size(1280, 720)
        page.set.load_mode.eager()
        
        # NOTE: Do NOT block resources for change-location page
        # It needs CSS/JS to work properly
        
        # Go to change-location
        log("Loading change-location...")
        page.get(LOCATION_URL)
        
        # Select AND Submit in ONE JS call (faster!)
        log("Selecting + Submitting...")
        page.run_js(f'''
            // Wait for DOM ready
            function selectAndSubmit() {{
                var select = document.querySelector('select');
                if (select) {{
                    for (var i = 0; i < select.options.length; i++) {{
                        if (select.options[i].text.toLowerCase().includes('{city_name.lower()}')) {{
                            select.selectedIndex = i;
                            select.dispatchEvent(new Event('change'));
                            break;
                        }}
                    }}
                    // Click submit immediately
                    var btn = document.querySelector('.btn-primary');
                    if (btn) btn.click();
                }} else {{
                    // Retry after 100ms
                    setTimeout(selectAndSubmit, 100);
                }}
            }}
            selectAndSubmit();
        ''')
        
        # Wait for navigation after form submit
        # The form redirects to gold page, so wait for that
        time.sleep(2)
        
        # Now we should be on gold page already via redirect
        # Block resources for faster parsing
        log("Blocking resources for gold page...")
        css_blocked = True
        try:
            page.set.blocked_urls([
                '*.css', '*.less', '*.scss',
                '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg', '*.ico',
                '*.woff', '*.woff2', '*.ttf', '*.eot',
                '*google-analytics*', '*googletagmanager*', '*facebook*',
                '*hotjar*', '*clarity*'
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
                # COMPLETELY clear blocked URLs
                page.set.blocked_urls([])
            except: pass
            
            # Hard reload with cache bypass
            try:
                page.refresh(ignore_cache=True)
            except:
                page.get(GOLD_URL)
            
            time.sleep(3)  # Longer wait for full page
            
            # Wait for product container explicitly
            try:
                page.ele('css:.ct-body', timeout=10)
            except: pass
            
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

def scrape_multiple(locations):
    """
    Scrape multiple locations dalam satu browser session
    OPTIMIZED: Hanya ke /change-location sekali, setelah itu gunakan 
    tombol "Ubah Lokasi" di gold page untuk perpindahan lebih cepat
    """
    start_total = time.time()
    results = []
    
    log(f"Starting multi-location scrape: {locations}")
    
    try:
        from DrissionPage import ChromiumPage, ChromiumOptions
    except ImportError:
        return [{"error": "DrissionPage not installed", "blocked": True}]
    
    page = None
    try:
        os.makedirs(PROFILE_DIR, exist_ok=True)
        
        opts = ChromiumOptions()
        opts.set_argument('--disable-blink-features=AutomationControlled')
        opts.set_argument('--lang=id-ID')
        opts.set_argument('--no-sandbox')
        opts.set_argument('--disable-dev-shm-usage')
        opts.set_argument('--disable-gpu')
        
        # HIDE BROWSER WINDOW - Position off-screen
        opts.set_argument('--window-position=-2400,-2400')
        opts.set_argument('--window-size=1,1')
        
        opts.set_argument('--disable-extensions')
        opts.set_argument('--disable-plugins')
        opts.set_argument('--disable-sync')
        opts.set_argument('--disable-translate')
        opts.set_argument('--disable-background-networking')
        opts.set_argument('--no-first-run')
        opts.set_argument('--no-default-browser-check')
        opts.set_user_data_path(PROFILE_DIR)
        opts.auto_port()
        
        page = ChromiumPage(opts)
        # Small window size to reduce RAM usage (browser is hidden anyway)
        page.set.window.size(800, 600)
        page.set.load_mode.eager()
        
        # Block heavy resources for faster loading (except for change-location page)
        # Note: Don't block CSS on change-location as it needs JS/CSS to work
        # We'll set this after first location is done
        
        # Loop through each location (locationId like "200", "201")
        for idx, location in enumerate(locations):
            start_loc = time.time()
            
            # Location can be locationId (like "200") or city name (like "jakarta")
            location_str = str(location)
            
            # Try locationId lookup first, then city name
            if location_str in LOCATION_ID_MAP:
                storage_id = location_str
                display_name = LOCATION_ID_MAP[location_str]
            elif location_str.lower() in LOCATION_MAP:
                storage_id, display_name = LOCATION_MAP[location_str.lower()]
            else:
                log(f"⚠️ Unknown location: {location}, skipping")
                continue
            
            log(f"\n--- {display_name} [{storage_id}] ({idx + 1}/{len(locations)}) ---")
            
            try:
                if idx == 0:
                    # FIRST LOCATION: Use /change-location page
                    log("Loading change-location (first location)...")
                    page.get(LOCATION_URL)
                    
                    # Select dropdown by TEXT matching (using display_name)
                    # Extract first word of display_name for matching (e.g., "Bandung" from "Bandung")
                    search_text = display_name.split(' - ')[0].split()[0].lower()
                    log(f"Selecting '{search_text}'...")
                    page.run_js(f'''
                        function selectAndSubmit() {{
                            var select = document.querySelector('select');
                            if (select) {{
                                for (var i = 0; i < select.options.length; i++) {{
                                    if (select.options[i].text.toLowerCase().includes('{search_text}')) {{
                                        select.selectedIndex = i;
                                        select.dispatchEvent(new Event('change'));
                                        break;
                                    }}
                                }}
                                var btn = document.querySelector('.btn-primary');
                                if (btn) btn.click();
                            }} else {{
                                setTimeout(selectAndSubmit, 100);
                            }}
                        }}
                        selectAndSubmit();
                    ''')
                    time.sleep(1)
                    
                    # Block resources BEFORE loading gold page
                    # Block CSS too for faster loading
                    log("Blocking CSS/images/fonts for speed...")
                    try:
                        page.set.blocked_urls([
                            # Block CSS, images, fonts, analytics
                            '*.css', '*.less', '*.scss', '*.sass',
                            '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg', '*.ico', '*.bmp',
                            '*.woff', '*.woff2', '*.ttf', '*.eot', '*.otf',
                            '*.mp4', '*.webm', '*.mp3', '*.wav',
                            '*google-analytics*', '*googletagmanager*', '*facebook*',
                            '*hotjar*', '*clarity*', '*doubleclick*'
                        ])
                    except: pass
                    
                    # Load gold page (now without CSS/images)
                    log("Loading gold page...")
                    page.get(GOLD_URL)
                else:
                    # SUBSEQUENT LOCATIONS: Go directly to change-location page
                    # (Simpler and more reliable than trying in-page modal)
                    log("Loading change-location...")
                    page.get(LOCATION_URL)
                    
                    # Select location by text matching
                    search_text = display_name.split(' - ')[0].split()[0].lower()
                    log(f"Selecting '{search_text}'...")
                    page.run_js(f'''
                        function selectAndSubmit() {{
                            var select = document.querySelector('select');
                            if (select) {{
                                for (var i = 0; i < select.options.length; i++) {{
                                    if (select.options[i].text.toLowerCase().includes('{search_text}')) {{
                                        select.selectedIndex = i;
                                        select.dispatchEvent(new Event('change'));
                                        break;
                                    }}
                                }}
                                var btn = document.querySelector('.btn-primary');
                                if (btn) btn.click();
                            }} else {{
                                setTimeout(selectAndSubmit, 100);
                            }}
                        }}
                        selectAndSubmit();
                    ''')
                    time.sleep(1)
                    
                    # Load gold page
                    log("Loading gold page...")
                    page.get(GOLD_URL)
                
                # Wait for products container
                try:
                    page.ele('css:.ct-body', timeout=ELEMENT_TIMEOUT)
                except: pass
                
                time.sleep(1)
                products = parse_products(page.html)
                
                # Retry if needed
                if len(products) < 5:
                    time.sleep(1)
                    products = parse_products(page.html)
                
                available = [p for p in products if p.get('hasStock')]
                elapsed = round(time.time() - start_loc, 1)
                
                log(f"Done: {len(products)} products in {elapsed}s")
                
                results.append({
                    "blocked": False,
                    "hasStock": len(available) > 0,
                    "availableProducts": available,
                    "allProducts": products,
                    "totalProducts": len(products),
                    "location": location,
                    "locationId": storage_id,
                    "elapsedSeconds": elapsed,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                log(f"Error for {location}: {e}")
                results.append({
                    "blocked": False,
                    "error": str(e),
                    "location": location,
                    "locationId": storage_id,
                    "timestamp": datetime.now().isoformat()
                })
        
        page.quit()
        
        total_elapsed = round(time.time() - start_total, 1)
        log(f"\n=== TOTAL: {len(results)} locations in {total_elapsed}s ===")
        
        return results
        
    except Exception as e:
        log(f"Error: {e}")
        if page:
            try: page.quit()
            except: pass
        return [{"blocked": False, "error": str(e), "timestamp": datetime.now().isoformat()}]

def main():
    # Check for multiple locations
    locations = []
    single_loc = None
    
    for arg in sys.argv:
        if arg.startswith("--location="):
            single_loc = arg.split("=")[1].lower()
        elif arg.startswith("--locations="):
            # Format: --locations=bandung,jakarta,surabaya
            locs = arg.split("=")[1].lower()
            locations = [l.strip() for l in locs.split(",")]
    
    if locations:
        # Multiple locations
        results = scrape_multiple(locations)
        print(json.dumps(results, indent=2))
    else:
        # Single location
        loc = single_loc or "bandung"
        result = scrape(loc)
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
