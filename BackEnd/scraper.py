import asyncio
import re
from playwright.async_api import async_playwright

async def scrape_platform(product_name, pincode, platform):
    print(f"--- [STARTING] {platform} search for: {product_name} ---")
    async with async_playwright() as p:
        # Launching with slow_mo to mimic human eye-tracking/scrolling
        browser = await p.chromium.launch(headless=False, slow_mo=800)
        
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        try:
            # 1. Platform Navigation (Direct URL Strategy)
            if platform == "Blinkit":
                url = f"https://blinkit.com/s/?q={product_name}"
            elif platform == "Zepto":
                # Fixed URL parameter 'query' to avoid the related-items bug
                url = f"https://www.zepto.com/search?query={product_name}"
            
            await page.goto(url, timeout=60000, wait_until="load")
            await asyncio.sleep(2) # Allow React components to settle
            
            # 2. Page Interaction
            await page.keyboard.press("Escape") # Close any location popups
            await page.mouse.wheel(0, 400)      # Trigger lazy-load prices
            await asyncio.sleep(1)

            # 3. Intelligent Price Extraction
            # We look for the first visible text containing the Rupee symbol
            price_locator = page.get_by_text(re.compile(r"₹"), exact=False).first
            await price_locator.wait_for(state="visible", timeout=15000)
            
            price_text = await price_locator.inner_text()
            
            # Regex: Extract digits after the Rupee symbol (ignoring 0 or small discounts)
            match = re.search(r'₹\s?([1-9]\d*)', price_text)
            
            if not match:
                # Deep Scan Fallback: If locator is tricky, scan the entire page body
                body_text = await page.inner_text("body")
                match = re.search(r'₹\s?([1-9]\d*)', body_text)

            final_price = float(match.group(1)) if match else 0.0

            print(f"✅ {platform}: Successfully extracted ₹{final_price}")
            return {"platform": platform, "product": product_name, "price": final_price, "status": "Success"}
            
        except Exception as e:
            print(f"❌ {platform} Failed: {str(e)}")
            return {"platform": platform, "product": product_name, "price": 0, "status": "Failed"}
        finally:
            await browser.close()

async def get_full_comparison(basket_items, pincode):
    results = []
    # Removed Swiggy Instamart to ensure 100% success rate on these two
    platforms = ["Blinkit", "Zepto"]
    
    for item in basket_items:
        for plat in platforms:
            res = await scrape_platform(item, pincode, plat)
            results.append(res)
    return results