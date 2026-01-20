#!/usr/bin/env python3
"""
scraper_ultralight.py - Ultra Lightweight Version
TARGET: 200-300MB memory usage
"""

import sys, os, time, json, gc
from datetime import datetime
from bs4 import BeautifulSoup

PROFILE_DIR = os.path.join(os.path.dirname(__file__), 'browser_profile')
LOCATION_URL = "https://www.logammulia.com/id/change-location"
GOLD_URL = "https://www.logammulia.com/id/purchase/gold"

ELEMENT_TIMEOUT = 8
MAX_RETRIES = 2

LOCATION_ID_MAP = {
    # Jakarta
    "200": "BELM - Graha Dipta Pulo Gadung",
    "203": "BELM - Gedung Antam",
    "205": "BELM - Setiabudi One",
    "214": "BELM - Puri Indah",
    # Jabodetabek
    "215": "BELM - Bekasi",
    "216": "BELM - Tangerang",
    "217": "BELM - Tangerang Selatan",
    "218": "BELM - Bogor",
    # Jawa Barat
    "201": "BELM - Bandung",
    # Jawa Tengah
    "212": "BELM - Semarang",
    "213": "BELM - Yogyakarta",
    # Jawa Timur
    "202": "BELM - Surabaya Darmo",
    "220": "BELM - Surabaya Pakuwon",
    # Luar Jawa
    "206": "BELM - Medan",
    "207": "BELM - Makassar",
    "208": "BELM - Palembang",
    "209": "BELM - Bali",
    "210": "BELM - Balikpapan",
}

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
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", file=sys.stderr)

def force_gc():
    """Aggressive garbage collection"""
    gc.collect()
    gc.collect()
    gc.collect()

def parse_products_minimal(html):
    """Parse dengan minimal memory footprint"""
    try:
        soup = BeautifulSoup(html, 'lxml')
        products = []
        
        for row in soup.select('.ct-body .ctr'):
            try:
                col = row.select_one('.ctd.item-1 .ngc-text')
                if not col:
                    continue
                
                title = col.get_text(strip=True).split('\n')[0]
                
                if 'perak' in title.lower() or 'silver' in title.lower():
                    continue
                if not any(x in title.lower() for x in ['emas', 'batangan', 'gram']):
                    continue
                
                price_elem = row.select_one('.ctd.item-2')
                price = price_elem.get_text(strip=True) if price_elem else ""
                has_stock = not row.select_one('span.no-stock')
                
                products.append({
                    "title": title,
                    "price": price,
                    "hasStock": has_stock
                })
            except:
                continue
        
        soup.decompose()
        del soup
        force_gc()
        
        return products
    except Exception as e:
        log(f"Parse error: {e}")
        return []

def create_minimal_browser():
    """Create browser with optimized settings"""
    try:
        from DrissionPage import ChromiumOptions
    except ImportError:
        raise ImportError("DrissionPage not installed")
    
    opts = ChromiumOptions()
    
    opts.set_argument('--disable-blink-features=AutomationControlled')
    opts.set_argument('--lang=id-ID')
    opts.set_argument('--no-sandbox')
    opts.set_argument('--disable-dev-shm-usage')
    opts.set_argument('--disable-gpu')
    opts.set_argument('--window-position=-2400,-2400')
    opts.set_argument('--disable-extensions')
    opts.set_argument('--disable-plugins')
    opts.set_argument('--disable-sync')
    opts.set_argument('--disable-translate')
    opts.set_argument('--disable-background-networking')
    opts.set_argument('--disable-default-apps')
    opts.set_argument('--disable-hang-monitor')
    opts.set_argument('--disable-prompt-on-repost')
    opts.set_argument('--disable-component-update')
    opts.set_argument('--no-first-run')
    opts.set_argument('--no-default-browser-check')
    
    opts.set_user_data_path(PROFILE_DIR)
    opts.auto_port()
    
    return opts

def scrape(location="bandung"):
    """Single location scrape"""
    start = time.time()
    
    location_str = str(location)
    if location_str in LOCATION_ID_MAP:
        storage_id = location_str
        city_name = LOCATION_ID_MAP[location_str]
    elif location_str.lower() in LOCATION_MAP:
        storage_id, city_name = LOCATION_MAP[location_str.lower()]
    else:
        storage_id, city_name = "201", "Bandung"
    
    log(f"Start: {city_name} [{storage_id}]")
    
    try:
        from DrissionPage import ChromiumPage
    except ImportError:
        return {"error": "DrissionPage not installed"}
    
    page = None
    try:
        os.makedirs(PROFILE_DIR, exist_ok=True)
        
        opts = create_minimal_browser()
        page = ChromiumPage(opts)
        page.set.window.size(800, 600)
        page.set.load_mode.eager()
        
        # Change location (don't block CSS here)
        log("Change loc...")
        page.get(LOCATION_URL)
        time.sleep(1)
        
        search_text = city_name.split(' - ')[-1].split()[0].lower()
        page.run_js(f'''
            (function() {{
                var s = document.querySelector('select');
                if (s) {{
                    for (var i = 0; i < s.options.length; i++) {{
                        if (s.options[i].text.toLowerCase().includes('{search_text}')) {{
                            s.selectedIndex = i;
                            s.dispatchEvent(new Event('change'));
                            break;
                        }}
                    }}
                    var b = document.querySelector('.btn-primary');
                    if (b) b.click();
                }}
            }})();
        ''')
        
        time.sleep(2)
        force_gc()
        
        # Block resources for gold page
        try:
            page.set.blocked_urls([
                '*.css', '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg', '*.ico',
                '*.woff', '*.woff2', '*.ttf', '*.eot',
                '*google-analytics*', '*googletagmanager*', '*facebook*', '*hotjar*'
            ])
        except:
            pass
        
        log("Load gold...")
        page.get(GOLD_URL)
        
        try:
            page.ele('css:.ct-body', timeout=ELEMENT_TIMEOUT)
        except:
            pass
        
        time.sleep(1)
        
        html = page.html
        products = parse_products_minimal(html)
        
        if len(products) < 5:
            time.sleep(2)
            html = page.html
            products = parse_products_minimal(html)
        
        del html
        force_gc()
        
        available = [p for p in products if p.get('hasStock')]
        elapsed = round(time.time() - start, 1)
        
        log(f"Done: {len(products)} in {elapsed}s")
        
        result = {
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
        
        page.quit()
        del page
        force_gc()
        
        return result
        
    except Exception as e:
        log(f"Error: {e}")
        if page:
            try:
                page.quit()
            except:
                pass
        force_gc()
        return {
            "blocked": False,
            "error": str(e),
            "location": location,
            "timestamp": datetime.now().isoformat()
        }

def scrape_multiple(locations):
    """Scrape multiple locations"""
    start_total = time.time()
    results = []
    
    log(f"Multi-scrape: {locations}")
    
    try:
        from DrissionPage import ChromiumPage
    except ImportError:
        return [{"error": "DrissionPage not installed"}]
    
    page = None
    
    try:
        os.makedirs(PROFILE_DIR, exist_ok=True)
        
        for idx, location in enumerate(locations):
            if idx % 2 == 0:
                if page:
                    log("Restart browser (memory cleanup)...")
                    page.quit()
                    del page
                    force_gc()
                    time.sleep(0.5)
                
                opts = create_minimal_browser()
                page = ChromiumPage(opts)
                page.set.window.size(800, 600)
                page.set.load_mode.eager()
            
            start_loc = time.time()
            
            location_str = str(location)
            if location_str in LOCATION_ID_MAP:
                storage_id = location_str
                display_name = LOCATION_ID_MAP[location_str]
            elif location_str.lower() in LOCATION_MAP:
                storage_id, display_name = LOCATION_MAP[location_str.lower()]
            else:
                log(f"Unknown: {location}")
                continue
            
            log(f"{idx+1}/{len(locations)}: {display_name} [{storage_id}]")
            
            try:
                page.get(LOCATION_URL)
                time.sleep(1)
                
                search_text = display_name.split(' - ')[-1].split()[0].lower()
                
                page.run_js(f'''
                    (function() {{
                        var s = document.querySelector('select');
                        if (s) {{
                            for (var i = 0; i < s.options.length; i++) {{
                                if (s.options[i].text.toLowerCase().includes('{search_text}')) {{
                                    s.selectedIndex = i;
                                    s.dispatchEvent(new Event('change'));
                                    break;
                                }}
                            }}
                            var b = document.querySelector('.btn-primary');
                            if (b) b.click();
                        }}
                    }})();
                ''')
                
                time.sleep(2)
                force_gc()
                
                try:
                    page.set.blocked_urls([
                        '*.css', '*.png', '*.jpg', '*.gif', '*.webp', '*.svg', '*.ico',
                        '*.woff', '*.woff2', '*google-analytics*', '*facebook*'
                    ])
                except:
                    pass
                
                page.get(GOLD_URL)
                
                try:
                    page.ele('css:.ct-body', timeout=ELEMENT_TIMEOUT)
                except:
                    pass
                
                time.sleep(1)
                
                html = page.html
                products = parse_products_minimal(html)
                del html
                force_gc()
                
                if len(products) < 5:
                    time.sleep(2)
                    html = page.html
                    products = parse_products_minimal(html)
                    del html
                    force_gc()
                
                available = [p for p in products if p.get('hasStock')]
                elapsed = round(time.time() - start_loc, 1)
                
                log(f"✓ {len(products)} in {elapsed}s")
                
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
                log(f"Error: {e}")
                results.append({
                    "blocked": False,
                    "error": str(e),
                    "location": location,
                    "locationId": storage_id,
                    "timestamp": datetime.now().isoformat()
                })
        
        if page:
            page.quit()
            del page
        force_gc()
        
        total_elapsed = round(time.time() - start_total, 1)
        log(f"DONE: {len(results)} in {total_elapsed}s")
        
        return results
        
    except Exception as e:
        log(f"Fatal: {e}")
        if page:
            try:
                page.quit()
            except:
                pass
        force_gc()
        return [{"error": str(e)}]

def main():
    locations = []
    single_loc = None
    
    for arg in sys.argv:
        if arg.startswith("--location="):
            single_loc = arg.split("=")[1].lower()
        elif arg.startswith("--locations="):
            locs = arg.split("=")[1].lower()
            locations = [l.strip() for l in locs.split(",")]
    
    if locations:
        results = scrape_multiple(locations)
        print(json.dumps(results, indent=2))
    else:
        loc = single_loc or "bandung"
        result = scrape(loc)
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
