import asyncio
import re
from playwright.async_api import async_playwright

async def scrape_platform(platform, item_name, pincode, browser_context):
    page = await browser_context.new_page()
    # Increased timeout to 30s to handle sequential matching
    TIMEOUT = 60000 
    
    try:
        # --- LOCATION & NAVIGATION ---
        if platform.lower() == "zepto":
            await page.goto("https://www.zeptonow.com/", wait_until="domcontentloaded")
            try:
                await page.click('button:has-text("Select Location")', timeout=5000)
                await page.fill('input[placeholder*="pincode"]', pincode)
                await page.keyboard.press("Enter")
                await asyncio.sleep(2) 
            except:
                await page.keyboard.press("Escape")
            url = f"https://www.zeptonow.com/search?query={item_name}"
            name_selector = '[data-testid="product-card-name"]'
        
        else: # Blinkit
            await page.goto("https://blinkit.com/", wait_until="domcontentloaded")
            try:
                await page.click('button:has-text("Detect my location")', timeout=5000)
            except:
                await page.keyboard.press("Escape")
            url = f"https://blinkit.com/s/?q={item_name}"
            name_selector = 'div[style*="webkit-line-clamp"]'

        # --- DATA EXTRACTION ---
        await page.goto(url, wait_until="networkidle", timeout=TIMEOUT)
        
        # 1. Extract the specific Name displayed on the page
        product_name = item_name
        try:
            await page.wait_for_selector(name_selector, timeout=10000)
            product_name = await page.locator(name_selector).first.inner_text()
        except:
            pass

        # 2. Extract Price using your established logic
        price_locator = page.get_by_text(re.compile(r"₹"), exact=False).first
        await price_locator.wait_for(state="visible", timeout=15000)
        
        await page.mouse.wheel(0, 400)
        await asyncio.sleep(1)

        price_text = await price_locator.inner_text()
        match = re.search(r'₹\s?([1-9]\d*)', price_text)
        final_price = float(match.group(1)) if match else 0.0

        print(f"✅ {platform}: Found '{product_name}' at ₹{final_price}")
        
        return {
            "platform": platform,
            "name": product_name,
            "price": final_price,
            "delivery_fee": 15 if platform == "Blinkit" else 5,
            "total": final_price + (15 if platform == "Blinkit" else 5)
        }

    except Exception as e:
        print(f"❌ {platform} FAILED: {str(e)}")
        return {"platform": platform, "name": item_name, "price": 0, "total": 0}
    finally:
        await page.close()

async def get_full_comparison(items, pincode):
    if not items: return []
    initial_query = items[0]
    results = []

    async with async_playwright() as p:
        # Headless=False to ensure you can monitor the matching
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )

        # STEP 1: Search Blinkit first to find a specific product
        blink_res = await scrape_platform("Blinkit", initial_query, pincode, context)
        if blink_res and blink_res["price"] > 0:
            results.append(blink_res)
            
            # STEP 2: Use the exact Blinkit name for Zepto search
            print(f"--- [MATCHING] Searching Zepto for exact title: {blink_res['name']} ---")
            zepto_res = await scrape_platform("Zepto", blink_res["name"], pincode, context)
            if zepto_res:
                results.append(zepto_res)
        else:
            # Fallback if Blinkit fails
            zepto_res = await scrape_platform("Zepto", initial_query, pincode, context)
            if zepto_res:
                results.append(zepto_res)

        await browser.close()
        return results