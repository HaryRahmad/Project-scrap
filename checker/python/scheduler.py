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
    env_path = Path(__file__).parent.parent.parent / "server" / ".env"
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
BASE_INTERVAL = 120  # 2 menit
RANDOM_VARIATION = 30  # +/- 30 detik

# =====================================================

def log(msg):
    ts = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    print(f"[{ts}] {msg}")

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

def send_to_server(location, location_id, stock_data):
    try:
        url = f"{SERVER_URL}/api/stock/update"
        
        payload = {
            "locationId": location_id,
            "locationName": location.capitalize(),
            "stockData": {
                "hasStock": stock_data.get("hasStock", False),
                "availableProducts": stock_data.get("availableProducts", []),
                "totalProducts": stock_data.get("totalProducts", 0),
                "timestamp": stock_data.get("timestamp")
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
    log(f"Server: {SERVER_URL}")
    log("=" * 50)
    
    run_count = 0
    
    while True:
        run_count += 1
        log(f"\n--- Run #{run_count} ---")
        
        # Fetch locations from server setiap run
        locations = get_locations_from_server()
        
        if not locations:
            log("⚠️ No locations to check, skipping...")
        else:
            for location in locations:
                result = run_scraper(location)
                
                if result.get("error"):
                    log(f"❌ {location}: {result.get('error')}")
                    continue
                
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
