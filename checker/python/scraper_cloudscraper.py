#!/usr/bin/env python3
"""
scraper_cloudscraper.py - Ultra-Light Scraper with Cloudflare Bypass
Uses cloudscraper library - ~50MB RAM vs ~400MB for browser
"""

import sys
import os
import json
import time
from datetime import datetime
from bs4 import BeautifulSoup

try:
    import cloudscraper
except ImportError:
    print("Installing cloudscraper...")
    os.system("pip install cloudscraper")
    import cloudscraper

LOCATION_URL = "https://www.logammulia.com/id/change-location"
GOLD_URL = "https://www.logammulia.com/id/purchase/gold"

LOCATION_MAP = {
    "jakarta": ("200", "Jakarta"),
    "bandung": ("201", "Bandung"),
    "surabaya": ("202", "Surabaya"),
    "medan": ("206", "Medan"),
    "makassar": ("207", "Makassar"),
    "palembang": ("208", "Palembang"),
    "bali": ("209", "Bali"),
    "balikpapan": ("210", "Balikpapan"),
    "semarang": ("212", "Semarang"),
    "yogyakarta": ("213", "Yogyakarta"),
    "bekasi": ("215", "Bekasi"),
    "tangerang": ("216", "Tangerang"),
    "tangerangselatan": ("217", "Tangerang Selatan"),
    "bogor": ("218", "Bogor"),
}

def log(msg):
    ts = datetime.now().strftime("%d/%m/%Y, %H.%M.%S")
    print(f"[{ts}] {msg}", file=sys.stderr)

def parse_products(html):
    """Parse products dari HTML halaman gold"""
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
            
            price = row.select_one('.ctd.item-2')
            price = price.get_text(strip=True) if price else ""
            has_stock = not row.select_one('span.no-stock')
            
            products.append({"title": title, "price": price, "hasStock": has_stock})
        except:
            continue
    
    return products

def scrape(location="bandung"):
    """Scrape using cloudscraper - bypasses Cloudflare protection"""
    start = time.time()
    
    if location not in LOCATION_MAP:
        location = "bandung"
    storage_id, city_name = LOCATION_MAP[location]
    
    log(f"Starting (cloudscraper): {location}")
    
    try:
        # Create cloudscraper session
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'mobile': False
            }
        )
        
        # Step 1: Get change-location page
        log("Fetching change-location...")
        loc_resp = scraper.get(LOCATION_URL, timeout=30)
        
        if loc_resp.status_code != 200:
            log(f"Failed: HTTP {loc_resp.status_code}")
            return {"error": f"HTTP {loc_resp.status_code}", "blocked": True}
        
        # Check for Cloudflare block
        if 'challenge' in loc_resp.text.lower() or 'captcha' in loc_resp.text.lower():
            log("⚠️ Cloudflare challenge detected")
            return {"error": "Cloudflare blocked", "blocked": True}
        
        # Parse CSRF token if exists
        soup = BeautifulSoup(loc_resp.text, 'lxml')
        csrf_token = None
        csrf_input = soup.select_one('input[name="_token"]')
        if csrf_input:
            csrf_token = csrf_input.get('value')
        
        # Step 2: POST to set location
        log(f"Setting location: {city_name}...")
        form_data = {
            'location': storage_id,
            'storage_location_id': storage_id,
        }
        if csrf_token:
            form_data['_token'] = csrf_token
        
        post_resp = scraper.post(
            LOCATION_URL,
            data=form_data,
            headers={'Referer': LOCATION_URL},
            timeout=30,
            allow_redirects=True
        )
        
        # Step 3: Get gold page
        log("Fetching gold page...")
        gold_resp = scraper.get(GOLD_URL, timeout=30)
        
        if gold_resp.status_code != 200:
            log(f"Failed gold page: HTTP {gold_resp.status_code}")
            return {"error": f"HTTP {gold_resp.status_code}", "blocked": False}
        
        # Debug: save HTML untuk analisis
        with open("debug_gold_page.html", "w", encoding="utf-8") as f:
            f.write(gold_resp.text)
        log("Saved debug_gold_page.html")
        
        # Step 4: Parse products
        products = parse_products(gold_resp.text)
        available = [p for p in products if p.get('hasStock')]
        elapsed = round(time.time() - start, 1)
        
        log(f"Done: {len(products)} products in {elapsed}s")
        
        return {
            "blocked": False,
            "hasStock": len(available) > 0,
            "availableProducts": available,
            "allProducts": products,
            "totalProducts": len(products),
            "location": location,
            "locationId": storage_id,
            "elapsedSeconds": elapsed,
            "timestamp": datetime.now().isoformat(),
            "method": "cloudscraper"
        }
        
    except Exception as e:
        log(f"Error: {e}")
        return {"error": str(e), "blocked": False, "timestamp": datetime.now().isoformat()}

def main():
    location = "bandung"
    for arg in sys.argv:
        if arg.startswith("--location="):
            location = arg.split("=")[1].lower()
    
    result = scrape(location)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
