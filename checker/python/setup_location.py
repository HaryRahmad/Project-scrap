#!/usr/bin/env python3
"""Setup location once in browser profile"""
import os, time
from datetime import datetime

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def setup_location(location="bandung"):
    from DrissionPage import ChromiumPage, ChromiumOptions
    
    PROFILE_DIR = os.path.join(os.path.dirname(__file__), 'browser_profile')
    LOCATION_URL = "https://www.logammulia.com/id/change-location"
    
    LOCATION_MAP = {
        "bandung": "Bandung",
        "jakarta": "Jakarta",
        "surabaya": "Surabaya",
        "medan": "Medan",
    }
    city_name = LOCATION_MAP.get(location, "Bandung")
    
    os.makedirs(PROFILE_DIR, exist_ok=True)
    
    opts = ChromiumOptions()
    opts.set_argument('--disable-blink-features=AutomationControlled')
    opts.set_user_data_path(PROFILE_DIR)
    opts.auto_port()
    
    page = ChromiumPage(opts)
    page.set.window.size(1280, 720)
    
    log("Loading change-location page...")
    page.get(LOCATION_URL)
    time.sleep(2)
    
    log("Selecting location...")
    select = page.ele('css:select', timeout=5)
    if select:
        for opt in select.eles('tag:option'):
            if city_name.lower() in (opt.text or '').lower():
                log(f"Found: {opt.text}")
                opt.click()
                break
        
        time.sleep(1)
        
        btn = page.ele('css:.btn-primary', timeout=2)
        if btn:
            log("Clicking submit...")
            btn.click()
            time.sleep(2)
    
    log("Location set! Browser profile saved.")
    page.quit()

if __name__ == "__main__":
    setup_location("bandung")
    print("Done! Now run scraper_ultrafast.py")
