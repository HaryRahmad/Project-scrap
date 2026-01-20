#!/usr/bin/env python3
"""
scheduler_ultralight.py - Minimal Memory Scheduler
"""

import os
import sys
import time
import random
import requests
import signal
import gc
from datetime import datetime, timedelta
from pathlib import Path

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

SERVER_URL = os.environ.get("SERVER_URL", "http://localhost:3000")
CHECKER_SECRET = os.environ.get("CHECKER_SECRET", "")
DEFAULT_LOCATIONS = ["bandung"]

BASE_INTERVAL = 100
RANDOM_VARIATION = 30
OPERATING_START_HOUR = 8
OPERATING_END_HOUR = 20

shutdown_requested = False

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    try:
        print(f"[{ts}] {msg}", flush=True)
    except:
        print(f"[{ts}] {msg.encode('ascii','ignore').decode()}", flush=True)

def signal_handler(signum, frame):
    global shutdown_requested
    log("Shutdown...")
    shutdown_requested = True

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def is_within_operating_hours():
    current_hour = datetime.now().hour
    return OPERATING_START_HOUR <= current_hour < OPERATING_END_HOUR

def get_next_operating_time():
    now = datetime.now()
    if now.hour < OPERATING_START_HOUR:
        next_start = now.replace(hour=OPERATING_START_HOUR, minute=0, second=0, microsecond=0)
    else:
        tomorrow = now + timedelta(days=1)
        next_start = tomorrow.replace(hour=OPERATING_START_HOUR, minute=0, second=0, microsecond=0)
    return int((next_start - now).total_seconds())

def get_locations_from_server():
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
                return locations
        
        return DEFAULT_LOCATIONS
    except:
        return DEFAULT_LOCATIONS

def send_to_server(location, location_id, stock_data):
    try:
        url = f"{SERVER_URL}/api/stock/update"
        
        payload = {
            "locationId": location_id,
            "locationName": location.capitalize(),
            "stockData": {
                "hasStock": stock_data.get("hasStock", False),
                "availableProducts": stock_data.get("availableProducts", []),
                "allProducts": stock_data.get("allProducts", []),
                "totalProducts": stock_data.get("totalProducts", 0),
                "timestamp": stock_data.get("timestamp"),
                "checkedCount": stock_data.get("totalProducts", 0)
            }
        }
        
        if CHECKER_SECRET:
            payload["secret"] = CHECKER_SECRET
        
        resp = requests.post(url, json=payload, timeout=30)
        
        if resp.status_code == 200:
            result = resp.json()
            notified = result.get("data", {}).get("notified", 0)
            log(f"✓ {notified} notified")
            return True
        return False
    except:
        return False

def main():
    log("="*50)
    log("ANTAM MONITOR - Ultra Light")
    log(f"Server: {SERVER_URL}")
    log(f"Interval: {BASE_INTERVAL}s ± {RANDOM_VARIATION}s")
    log("="*50)
    
    run_count = 0
    
    while not shutdown_requested:
        if not is_within_operating_hours():
            wait_seconds = get_next_operating_time()
            wait_hours = wait_seconds // 3600
            wait_minutes = (wait_seconds % 3600) // 60
            log(f"Outside hours, wait {wait_hours}h {wait_minutes}m")
            
            for _ in range(min(wait_seconds, 60)):
                if shutdown_requested:
                    break
                time.sleep(1)
            continue
        
        run_count += 1
        log(f"\n--- Run #{run_count} ---")
        
        locations = get_locations_from_server()
        
        if not locations:
            log("No locations")
        else:
            log(f"Scraping {len(locations)} locations...")
            
            try:
                from scraper_ultralight import scrape_multiple
                results = scrape_multiple(locations)
                
                for result in results:
                    if shutdown_requested:
                        break
                    
                    if result.get("error"):
                        log(f"✗ {result.get('location')}: {result.get('error')}")
                    else:
                        total = result.get("totalProducts", 0)
                        available = len(result.get("availableProducts", []))
                        elapsed = result.get("elapsedSeconds", 0)
                        location = result.get("location", "unknown")
                        location_id = result.get("locationId", "")
                        
                        log(f"📊 {location} [{location_id}]: {available}/{total} ({elapsed}s)")
                        
                        send_to_server(location, location_id, result)
                        
                        if available > 0:
                            log(f"📢 STOCK available!")
                            for p in result.get("availableProducts", [])[:3]:
                                log(f"   {p.get('title')}")
                
                gc.collect()
                
            except Exception as e:
                log(f"Scraper error: {e}")
                gc.collect()
        
        interval = BASE_INTERVAL + random.randint(-RANDOM_VARIATION, RANDOM_VARIATION)
        interval = max(30, interval)
        
        log(f"\n⏳ Next in {interval}s")
        
        for _ in range(interval):
            if shutdown_requested:
                break
            time.sleep(1)
    
    log("Bye!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"Fatal: {e}")
        sys.exit(1)
