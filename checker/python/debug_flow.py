#!/usr/bin/env python3
"""Debug: Check what's happening after location submit"""

import os, time
from datetime import datetime

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def debug():
    from DrissionPage import ChromiumPage, ChromiumOptions
    
    opts = ChromiumOptions()
    opts.set_user_data_path('browser_profile')
    opts.auto_port()
    
    page = ChromiumPage(opts)
    
    log("1. Going to change-location page...")
    page.get("https://www.logammulia.com/id/change-location")
    time.sleep(1)
    
    log(f"   Page title: {page.title}")
    
    select = page.ele('css:select', timeout=3)
    if select:
        opts = select.eles('tag:option')
        log(f"   Found {len(opts)} options")
        
        # Select Bandung
        for opt in opts:
            if 'bandung' in (opt.text or '').lower():
                log(f"2. Selecting: {opt.text}")
                opt.click()
                break
        
        time.sleep(0.5)
        
        # Click button
        btn = page.ele('css:.btn-primary', timeout=2)
        if btn:
            log("3. Clicking Submit...")
            btn.click()
            time.sleep(2)
            
            log(f"   After click - URL: {page.url}")
            log(f"   After click - Title: {page.title}")
    
    log("4. Going to gold page...")
    page.get("https://www.logammulia.com/id/purchase/gold")
    time.sleep(3)
    
    log(f"   Gold page URL: {page.url}")
    log(f"   Gold page Title: {page.title}")
    log(f"   Has 'Emas Batangan': {'Emas Batangan' in page.html}")
    log(f"   Has '.ct-body': {'.ct-body' in page.html or 'ct-body' in page.html}")
    log(f"   Has 'Tidak ada varian': {'Tidak ada varian' in page.html}")
    log(f"   Has modal select: {'<select' in page.html}")
    
    # Check cart table
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(page.html, 'lxml')
    ct_body = soup.select_one('.ct-body')
    if ct_body:
        rows = ct_body.select('.ctr')
        log(f"   .ct-body rows: {len(rows)}")
        for r in rows[:2]:
            log(f"     Row: {r.get_text(strip=True)[:50]}...")
    else:
        log("   .ct-body NOT FOUND!")
    
    page.quit()

if __name__ == "__main__":
    debug()
