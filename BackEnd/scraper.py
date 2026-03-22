import asyncio
import re
from playwright.async_api import async_playwright

async def scrape_platform(platform, item_name, pincode, browser_context):
    page = await browser_context.new_page()
    TIMEOUT = 60000 
    
    try:
        if platform.lower() == "zepto":
            await page.goto("https://www.zeptonow.com/", wait_until="domcontentloaded", timeout=TIMEOUT)
            try:
                await page.click('button:has-text("Select Location")', timeout=5000)
                await page.fill('input[placeholder*="pincode"]', pincode)
                await page.keyboard.press("Enter")
                await asyncio.sleep(2) 
            except:
                await page.keyboard.press("Escape")
            url = f"https://www.zeptonow.com/search?query={item_name}"
        
        else:
            await page.goto("https://blinkit.com/", wait_until="domcontentloaded", timeout=TIMEOUT)
            try:
                await page.click('button:has-text("Detect my location")', timeout=5000)
            except:
                await page.keyboard.press("Escape")
            url = f"https://blinkit.com/s/?q={item_name}"

        await page.goto(url, wait_until="networkidle", timeout=TIMEOUT)
        
        price_locator = page.get_by_text(re.compile(r"₹"), exact=False).first
        await price_locator.wait_for(state="visible", timeout=TIMEOUT)
        
        await page.mouse.wheel(0, 400)
        await asyncio.sleep(1)

        price_text = await price_locator.inner_text()
        match = re.search(r'₹\s?([1-9]\d*)', price_text)
        final_price = float(match.group(1)) if match else 0.0

        return {
            "platform": platform,
            "price": final_price,
            "delivery_fee": 15,
            "total": final_price + 15
        }

    except Exception as e:
        print(f"Error scraping {platform}: {e}")
        return {"platform": platform, "price": 0, "total": 0}
    finally:
        await page.close()

async def get_full_comparison(items, pincode):
    if isinstance(items, list) and len(items) == 1 and ',' in items[0]:
        items = [i.strip() for i in items[0].split(',')]
    elif isinstance(items, str):
        items = [i.strip() for i in items.split(',')]
    
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(   # ← FIXED HERE
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )

        for current_item in items:
            print(f"--- Processing: {current_item} ---")
            blink_res = await scrape_platform("Blinkit", current_item, pincode, context)
            zepto_res = await scrape_platform("Zepto", current_item, pincode, context)
            
            results.append({"query": current_item, "Blinkit": blink_res, "Zepto": zepto_res})

        await browser.close()
        return results