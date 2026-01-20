#!/usr/bin/env python3
"""
scheduler.py - Local Scheduler untuk Antam Gold Stock Monitor
- Runs every ~1 minute with random variation
- Scrapes dengan scraper_ultrafast.py (~6-10 detik)
- Sends data ke server API
- Server handles Telegram notifications
"""

import os
import sys
import time
import random
import requests
from datetime import datetime
from pathlib import Path

# Load .env from server directory
def load_env():
    env_path = Path(__file__).parent.parent / "server" / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())

load_env()

# =====================================================
# CONFIGURATION
# =====================================================
SERVER_URL = os.environ.get("SERVER_URL", "http://localhost:3000")
CHECKER_SECRET = os.environ.get("CHECKER_SECRET", "")

# Default locations (fallback jika server tidak tersedia)
DEFAULT_LOCATIONS = ["bandung"]

# Interval (dalam detik)
BASE_INTERVAL = 100  # 100 detik (~1.5 menit)
RANDOM_VARIATION = 30  # +/- 30 detik

# Operating hours (jam operasi) - 0-24 untuk disable
OPERATING_START_HOUR = 8   # Disabled for testing
OPERATING_END_HOUR = 20    # Disabled for testing

# =====================================================
def log(msg):
    ts = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    try:
        print(f"[{ts}] {msg}")
    except UnicodeEncodeError:
        # Fallback for Windows console encoding issues
        safe_msg = msg.encode('ascii', 'replace').decode('ascii')
        print(f"[{ts}] {safe_msg}")

def is_within_operating_hours():
    """Check if current time is within operating hours (08:00 - 20:00)"""
    current_hour = datetime.now().hour
    return OPERATING_START_HOUR <= current_hour < OPERATING_END_HOUR

def get_next_operating_time():
    """Calculate seconds until next operating window starts"""
    now = datetime.now()
    if now.hour < OPERATING_START_HOUR:
        # Still before today's operating hours
        next_start = now.replace(hour=OPERATING_START_HOUR, minute=0, second=0, microsecond=0)
    else:
        # Past today's operating hours, wait for tomorrow
        from datetime import timedelta
        tomorrow = now + timedelta(days=1)
        next_start = tomorrow.replace(hour=OPERATING_START_HOUR, minute=0, second=0, microsecond=0)
    
    return int((next_start - now).total_seconds())

def get_locations_from_server():
    """Fetch active locations dari server API"""
    try:
        url = f"{SERVER_URL}/api/checker/locations"
        
        headers = {}
        if CHECKER_SECRET:
            headers["Authorization"] = f"Bearer {CHECKER_SECRET}"
        
        resp = requests.get(url, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            locations = data.get("locations", [])
            if locations:
                log(f"📍 Locations from server: {locations}")
                return locations
        
        log(f"⚠️ Server returned {resp.status_code}, using defaults")
        return DEFAULT_LOCATIONS
        
    except requests.exceptions.ConnectionError:
        log(f"⚠️ Cannot connect to server, using defaults")
        return DEFAULT_LOCATIONS
    except Exception as e:
        log(f"⚠️ Error fetching locations: {e}")
        return DEFAULT_LOCATIONS

def run_scraper(location):
    try:
        from scraper_ultrafast import scrape
        result = scrape(location)
        return result
    except Exception as e:
        log(f"❌ Error: {e}")
        return {"error": str(e)}

def run_scraper_batch(locations):
    """Run scraper for multiple locations in one browser session (faster)"""
    try:
        from scraper_ultrafast import scrape_multiple
        results = scrape_multiple(locations)
        return results
    except Exception as e:
        log(f"❌ Batch scrape error: {e}")
        return [{"error": str(e)}]

def send_to_server(location, location_id, stock_data):
    try:
        url = f"{SERVER_URL}/api/stock/update"
        
        payload = {
            "locationId": location_id,
            "locationName": location.capitalize(),
            "stockData": {
                "hasStock": stock_data.get("hasStock", False),
                "availableProducts": stock_data.get("availableProducts", []),
                "allProducts": stock_data.get("allProducts", []),  # Include all products
                "totalProducts": stock_data.get("totalProducts", 0),
                "timestamp": stock_data.get("timestamp"),
                "checkedCount": stock_data.get("totalProducts", 0)  # For client display
            }
        }
        
        if CHECKER_SECRET:
            payload["secret"] = CHECKER_SECRET
        
        resp = requests.post(url, json=payload, timeout=30)
        
        if resp.status_code == 200:
            result = resp.json()
            notified = result.get("data", {}).get("notified", 0)
            log(f"✅ Server: {notified} users notified")
            return True
        else:
            log(f"⚠️ Server: {resp.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        log(f"❌ Cannot connect to {SERVER_URL}")
        return False
    except Exception as e:
        log(f"❌ Server error: {e}")
        return False

def main():
    log("=" * 50)
    log("ANTAM GOLD STOCK MONITOR")
    log("=" * 50)
    log("Locations: Dynamic (from server)")
    log(f"Interval: {BASE_INTERVAL}s ± {RANDOM_VARIATION}s")
    log(f"Operating Hours: {OPERATING_START_HOUR:02d}:00 - {OPERATING_END_HOUR:02d}:00")
    log(f"Server: {SERVER_URL}")
    log("=" * 50)
    
    run_count = 0
    
    while True:
        # Check if within operating hours
        if not is_within_operating_hours():
            wait_seconds = get_next_operating_time()
            wait_hours = wait_seconds // 3600
            wait_minutes = (wait_seconds % 3600) // 60
            log(f"💤 Di luar jam operasi ({OPERATING_START_HOUR:02d}:00 - {OPERATING_END_HOUR:02d}:00)")
            log(f"⏳ Menunggu {wait_hours}j {wait_minutes}m sampai jam {OPERATING_START_HOUR:02d}:00...")
            time.sleep(wait_seconds)
            continue
        
        run_count += 1
        log(f"\n--- Run #{run_count} ---")
        
        # Fetch locations from server setiap run
        locations = get_locations_from_server()
        
        if not locations:
            log("⚠️ No locations to check, skipping...")
        elif len(locations) == 1:
            # Single location - use standard scraper
            location = locations[0]
            result = run_scraper(location)
            
            if result.get("error"):
                log(f"❌ {location}: {result.get('error')}")
            else:
                total = result.get("totalProducts", 0)
                available = len(result.get("availableProducts", []))
                elapsed = result.get("elapsedSeconds", 0)
                
                log(f"📊 {location}: {available}/{total} ({elapsed}s)")
                
                location_id = result.get("locationId", "BDH01")
                send_to_server(location, location_id, result)
                
                if available > 0:
                    log(f"🔔 STOCK TERSEDIA:")
                    for p in result.get("availableProducts", []):
                        log(f"   - {p.get('title')}")
        else:
            # Multiple locations - use batch scraper (more efficient!)
            log(f"🚀 Batch scraping {len(locations)} locations...")
            results = run_scraper_batch(locations)
            
            for result in results:
                if result.get("error"):
                    location = result.get("location", "unknown")
                    log(f"❌ {location}: {result.get('error')}")
                    continue
                
                location = result.get("location", "unknown")
                total = result.get("totalProducts", 0)
                available = len(result.get("availableProducts", []))
                elapsed = result.get("elapsedSeconds", 0)
                
                log(f"📊 {location}: {available}/{total} ({elapsed}s)")
                
                # Send to server
                location_id = result.get("locationId", "BDH01")
                send_to_server(location, location_id, result)
                
                # Jika ada stock, log products
                if available > 0:
                    log(f"🔔 STOCK TERSEDIA:")
                    for p in result.get("availableProducts", []):
                        log(f"   - {p.get('title')}")
        
        # Next interval
        interval = BASE_INTERVAL + random.randint(-RANDOM_VARIATION, RANDOM_VARIATION)
        interval = max(30, interval)
        
        log(f"\n⏳ Next in {interval}s...")
        time.sleep(interval)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("\n\n👋 Stopped")
        sys.exit(0)
