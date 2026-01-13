"""
Lightweight Antam Gold Scraper - HTTP Requests Only
Tidak membutuhkan browser, sangat hemat resource (~10MB RAM)

Usage:
    python scraper_light.py --location=bandung
"""

import os
import sys
import json
import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# URLs
LOCATION_URL = "https://www.logammulia.com/id/change-location"
GOLD_URL = "https://www.logammulia.com/id/gold"

# Location mapping (ID -> city name for display)
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
    timestamp = datetime.now().strftime("%d/%m/%Y, %H.%M.%S")
    print(f"[{timestamp}] {msg}")

def parse_products(html):
    """Parse products dari HTML halaman gold"""
    soup = BeautifulSoup(html, 'html.parser')
    products = []
    
    # Find product containers
    product_elements = soup.select('.ct-body .product-item, .ct-body tr, .product-list .item')
    
    if not product_elements:
        # Try alternative selectors
        product_elements = soup.select('[class*="product"], [class*="item"]')
    
    for el in product_elements:
        try:
            # Try to extract product info
            title_el = el.select_one('.product-title, .title, td:first-child, h3, h4')
            price_el = el.select_one('.price, .product-price, td:nth-child(2)')
            stock_el = el.select_one('.stock, .availability, .btn-buy, .btn-cart, button')
            
            if not title_el:
                continue
                
            title = title_el.get_text(strip=True)
            price = price_el.get_text(strip=True) if price_el else ""
            
            # Check stock availability
            has_stock = False
            if stock_el:
                stock_text = stock_el.get_text(strip=True).lower()
                has_stock = 'beli' in stock_text or 'cart' in stock_text or 'available' in stock_text
            
            # Also check if there's no "habis" or "sold out" indicator
            full_text = el.get_text().lower()
            if 'habis' in full_text or 'sold out' in full_text or 'kosong' in full_text:
                has_stock = False
            
            products.append({
                "title": title,
                "price": price,
                "hasStock": has_stock
            })
        except Exception as e:
            continue
    
    return products

def scrape_light(location="bandung"):
    """
    Scrape menggunakan HTTP requests only (tanpa browser)
    Sangat ringan: ~10MB RAM vs ~500MB untuk browser
    """
    start = time.time()
    
    if location not in LOCATION_MAP:
        location = "bandung"
    
    storage_id, city_name = LOCATION_MAP[location]
    log(f"Starting (light): {location}")
    
    try:
        # Create session untuk maintain cookies
        session = requests.Session()
        
        # Set headers agar terlihat seperti browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        session.headers.update(headers)
        
        # Step 1: Get change-location page untuk dapat CSRF token
        log("Fetching change-location page...")
        loc_response = session.get(LOCATION_URL, timeout=30)
        
        if loc_response.status_code != 200:
            log(f"Failed to get location page: {loc_response.status_code}")
            return {"error": f"HTTP {loc_response.status_code}", "blocked": False}
        
        # Parse untuk cari form token (jika ada)
        soup = BeautifulSoup(loc_response.text, 'html.parser')
        csrf_token = None
        csrf_input = soup.select_one('input[name="_token"], input[name="csrf_token"]')
        if csrf_input:
            csrf_token = csrf_input.get('value')
        
        # Step 2: POST ke change-location untuk set lokasi
        log(f"Setting location to: {city_name} ({storage_id})...")
        
        form_data = {
            'location': storage_id,
            'storage_location_id': storage_id,
        }
        if csrf_token:
            form_data['_token'] = csrf_token
        
        # Try POST first
        post_response = session.post(
            LOCATION_URL, 
            data=form_data,
            headers={'Referer': LOCATION_URL},
            timeout=30,
            allow_redirects=True
        )
        
        # Step 3: Fetch gold page
        log("Fetching gold page...")
        gold_response = session.get(GOLD_URL, timeout=30)
        
        if gold_response.status_code != 200:
            log(f"Failed to get gold page: {gold_response.status_code}")
            return {"error": f"HTTP {gold_response.status_code}", "blocked": False}
        
        # Check for blocking/captcha
        if 'captcha' in gold_response.text.lower() or 'challenge' in gold_response.text.lower():
            log("⚠️ Detected CAPTCHA/Challenge - website may require browser")
            return {"error": "CAPTCHA detected", "blocked": True}
        
        # Step 4: Parse products
        log("Parsing products...")
        products = parse_products(gold_response.text)
        
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
            "method": "http_requests"  # Indicator bahwa ini versi light
        }
        
    except requests.exceptions.Timeout:
        log("❌ Request timeout")
        return {"error": "Timeout", "blocked": False}
    except requests.exceptions.ConnectionError as e:
        log(f"❌ Connection error: {e}")
        return {"error": str(e), "blocked": False}
    except Exception as e:
        log(f"❌ Error: {e}")
        return {"error": str(e), "blocked": False}

def main():
    location = "bandung"
    
    for arg in sys.argv:
        if arg.startswith("--location="):
            location = arg.split("=")[1].lower()
    
    result = scrape_light(location)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
