#!/usr/bin/env python3
"""
memory_monitor.py - Monitor memory usage saat scraping
Usage: python memory_monitor.py --location=bandung
"""

import sys
import time
import psutil
from datetime import datetime

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")

def get_memory_mb():
    process = psutil.Process()
    return process.memory_info().rss / 1024 / 1024

def monitor_scraper():
    """Run scraper dan monitor memory usage"""
    
    location = "bandung"
    for arg in sys.argv:
        if arg.startswith("--location="):
            location = arg.split("=")[1]
    
    log("="*60)
    log("MEMORY MONITOR - Antam Scraper")
    log(f"Location: {location}")
    log("="*60)
    
    baseline = get_memory_mb()
    log(f"Baseline memory: {baseline:.1f} MB")
    
    log("\nStarting scraper...")
    
    try:
        from scraper_ultralight import scrape
        
        pre_scrape = get_memory_mb()
        log(f"Pre-scrape memory: {pre_scrape:.1f} MB (+{pre_scrape - baseline:.1f})")
        
        max_memory = pre_scrape
        memory_samples = []
        
        start = time.time()
        result = scrape(location)
        elapsed = time.time() - start
        
        for i in range(5):
            mem = get_memory_mb()
            memory_samples.append(mem)
            max_memory = max(max_memory, mem)
            time.sleep(0.2)
        
        time.sleep(1)
        post_scrape = get_memory_mb()
        
        log("\n" + "="*60)
        log("RESULTS")
        log("="*60)
        
        if result.get("error"):
            log(f"❌ Error: {result.get('error')}")
        else:
            total = result.get("totalProducts", 0)
            available = len(result.get("availableProducts", []))
            log(f"✅ Scrape successful: {available}/{total} products")
            log(f"⏱️  Scrape time: {elapsed:.1f}s")
        
        log(f"\n📊 MEMORY USAGE:")
        log(f"  Baseline:    {baseline:.1f} MB")
        log(f"  Pre-scrape:  {pre_scrape:.1f} MB (+{pre_scrape - baseline:.1f})")
        log(f"  Peak:        {max_memory:.1f} MB (+{max_memory - baseline:.1f})")
        log(f"  Post-scrape: {post_scrape:.1f} MB (+{post_scrape - baseline:.1f})")
        log(f"  Average:     {sum(memory_samples)/len(memory_samples):.1f} MB")
        
        if max_memory < 300:
            status = "🟢 EXCELLENT"
        elif max_memory < 400:
            status = "🟡 GOOD"
        elif max_memory < 500:
            status = "🟠 OK"
        else:
            status = "🔴 HIGH"
        
        log(f"\n{status} - Peak memory: {max_memory:.1f} MB")
        
        log(f"\n🎯 TARGET: 200-300 MB")
        if max_memory <= 300:
            log(f"✅ WITHIN TARGET! ({max_memory:.1f} MB)")
        else:
            log(f"⚠️  OVER TARGET by {max_memory - 300:.1f} MB")
        
    except ImportError:
        log("❌ scraper_ultralight.py not found")
        sys.exit(1)
    except Exception as e:
        log(f"❌ Error: {e}")
        sys.exit(1)

def main():
    monitor_scraper()

if __name__ == "__main__":
    main()
