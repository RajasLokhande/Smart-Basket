import asyncio
import re
from playwright.async_api import async_playwright

async def scrape_platform(platform, item_name, pincode):
    async with async_playwright() as p:
        # Launching with 'Stealth' flags to bypass bot detection
        browser = await p.chromium.launch(headless=True, args=[
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox'
        ])
        
        # Create a context with a real-looking browser identity
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()
        
        try:
            if platform.lower() == "blinkit":
                url = f"https://blinkit.com/s/?q={item_name}"
                # Use your 15s timeout
                await page.goto(url, wait_until="networkidle", timeout=15000)
                # Flexible selector: looks for any div/span containing the Rupee symbol
                selector = 'div:has-text("₹"), span:has-text("₹"), .shadow-sm span'
            
            else: # Zepto
                url = f"https://www.zeptonow.com/search?query={item_name}"
                await page.goto(url, wait_until="networkidle", timeout=15000)
                selector = '[data-testid="product-card-price"], h4:has-text("₹")'

            # Wait for the price to actually appear
            await page.wait_for_selector(selector, timeout=15000)
            
            # Extract and clean the price
            price_text = await page.locator(selector).first.inner_text()
            price_value = int(re.sub(r'\D', '', price_text))

            return {
                "platform": platform,
                "name": item_name,
                "price": price_value,
                "delivery_fee": 15 if platform == "Blinkit" else 0,
                "handling_fee": 9 if platform == "Blinkit" else 4,
                "total": price_value + (24 if platform == "Blinkit" else 4)
            }

        except Exception as e:
            print(f"{platform} Error: Timeout or Blocked")
            return {"platform": platform, "name": item_name, "price": 0, "total": 0}
        finally:
            await browser.close()

async def get_full_comparison(items, pincode):
    target_item = items[0]
    # Running both in parallel
    results = await asyncio.gather(
        scrape_platform("Blinkit", target_item, pincode),
        scrape_platform("Zepto", target_item, pincode)
    )
    return results