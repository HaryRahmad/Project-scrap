#!/usr/bin/env python3
"""
Cookie persistence optimization for scraper_ultrafast.py
Save cookies after successful scrape, load on next run to potentially skip modal
"""

import json
import os
from pathlib import Path

COOKIE_FILE = Path(__file__).parent / "saved_cookies.json"

def save_cookies(page, location):
    """Save browser cookies to JSON file"""
    try:
        cookies = page.cookies()
        cookie_data = {
            "location": location,
            "cookies": cookies,
            "saved_at": __import__('datetime').datetime.now().isoformat()
        }
        
        with open(COOKIE_FILE, 'w') as f:
            json.dump(cookie_data, f, indent=2)
        
        print(f"Saved {len(cookies)} cookies to {COOKIE_FILE}", file=__import__('sys').stderr)
        return True
    except Exception as e:
        print(f"Failed to save cookies: {e}", file=__import__('sys').stderr)
        return False

def load_cookies(page, location):
    """Load cookies from file if exists and matches location"""
    if not COOKIE_FILE.exists():
        print("No saved cookies found", file=__import__('sys').stderr)
        return False
    
    try:
        with open(COOKIE_FILE, 'r') as f:
            cookie_data = json.load(f)
        
        # Check if location matches
        if cookie_data.get('location') != location:
            print(f"Cookie location mismatch: saved={cookie_data.get('location')}, requested={location}", 
                  file=__import__('sys').stderr)
            return False
        
        # Load cookies
        cookies = cookie_data.get('cookies', [])
        for cookie in cookies:
            try:
                page.set.cookies(cookie)
            except:
                pass
        
        print(f"Loaded {len(cookies)} cookies from {COOKIE_FILE}", file=__import__('sys').stderr)
        return True
        
    except Exception as e:
        print(f"Failed to load cookies: {e}", file=__import__('sys').stderr)
        return False

def clear_cookies():
    """Clear saved cookies"""
    if COOKIE_FILE.exists():
        COOKIE_FILE.unlink()
        print("Cleared saved cookies", file=__import__('sys').stderr)
