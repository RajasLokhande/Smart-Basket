import asyncio
import re
from playwright.async_api import async_playwright

async def scrape_platform(platform, item_name, pincode):
    async with async_playwright() as p:
        print(f"--- [{platform.upper()}] Starting Scrape ---")
        # Launching with slow_mo and headless=False to ensure visibility
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        try:
            # --- LOCATION SETUP PHASE ---
            if platform.lower() == "zepto":
                await page.goto("https://www.zeptonow.com/", wait_until="domcontentloaded")
                try:
                    # Click the 'Select Location' button from your screenshot
                    print(f"--- [ZEPTO] Handling Location Popup ---")
                    await page.click('button:has-text("Select Location")', timeout=5000)
                    await page.fill('input[placeholder*="pincode"]', pincode)
                    await page.keyboard.press("Enter")
                    await asyncio.sleep(2) 
                except:
                    await page.keyboard.press("Escape")

                # Navigate to search after location is set
                url = f"https://www.zeptonow.com/search?query={item_name}"
            
            else: # Blinkit
                await page.goto("https://blinkit.com/", wait_until="domcontentloaded")
                try:
                    await page.click('button:has-text("Detect my location")', timeout=5000)
                except:
                    await page.keyboard.press("Escape")
                
                url = f"https://blinkit.com/s/?q={item_name}"

            # --- DATA EXTRACTION PHASE ---
            print(f"--- [{platform.upper()}] Navigating to Results: {url} ---")
            await page.goto(url, wait_until="networkidle", timeout=15000)
            
            # Use Intelligent Price Extraction (looking for the ₹ symbol)
            # This bypasses the data-testid issues
            price_locator = page.get_by_text(re.compile(r"₹"), exact=False).first
            await price_locator.wait_for(state="visible", timeout=15000)
            
            # Scroll to trigger lazy-loading of price text
            await page.mouse.wheel(0, 400)
            await asyncio.sleep(1)

            price_text = await price_locator.inner_text()
            print(f"--- [{platform.upper()}] Raw Text: {price_text} ---")

            # Extract digits after Rupee symbol
            match = re.search(r'₹\s?([1-9]\d*)', price_text)
            final_price = float(match.group(1)) if match else 0.0

            if final_price == 0:
                # Fallback: Scan the whole page for any ₹ followed by a number
                content = await page.content()
                match = re.search(r'₹\s?([1-9]\d*)', content)
                final_price = float(match.group(1)) if match else 0.0

            print(f"--- [{platform.upper()}] Success: ₹{final_price} ---")
            return {
                "platform": platform,
                "name": item_name,
                "price": final_price,
                "delivery_fee": 15 if platform == "Blinkit" else 5,
                "total": final_price + (15 if platform == "Blinkit" else 5)
            }

        except Exception as e:
            print(f"--- [{platform.upper()}] FAILED: {str(e)} ---")
            return {"platform": platform, "name": item_name, "price": 0, "total": 0}
        finally:
            await browser.close()

async def get_full_comparison(items, pincode):
    if not items: return []
    target_item = items[0]
    # Running in sequence so you can watch the terminal logs for each
    results = []
    results.append(await scrape_platform("Blinkit", target_item, pincode))
    results.append(await scrape_platform("Zepto", target_item, pincode))
    return results