import asyncio
import re
from playwright.async_api import async_playwright
import pytesseract

pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"


async def scrape_platform(platform, item_name, pincode, browser_context):
    page = await browser_context.new_page()   # ✅ FIX: always new page
    TIMEOUT = 20000
    
    try:
        if platform.lower() == "zepto":

            # ✅ Direct search (no location popup)
            await page.goto(
                f"https://www.zeptonow.com/search?query={item_name}",
                wait_until="domcontentloaded",
                timeout=TIMEOUT
            )

            # wait for product cards
            await page.wait_for_selector("div[data-testid]", timeout=TIMEOUT)

            price_locator = page.locator("text=/₹\\s*[0-9]+/").first
            await price_locator.wait_for(timeout=TIMEOUT)

            price_text = await price_locator.inner_text()
            match = re.search(r'₹\s*([0-9]+)', price_text)
            final_price = float(match.group(1)) if match else 0.0

        else:
            # 🔵 BLINKIT
            await page.goto(
                f"https://blinkit.com/s/?q={item_name}",
                wait_until="domcontentloaded",
                timeout=TIMEOUT
            )

            await page.wait_for_selector("text=₹", timeout=TIMEOUT)

            price_locator = page.locator("text=/₹\\s*[0-9]+/").first
            price_text = await price_locator.inner_text()

            match = re.search(r'₹\s*([0-9]+)', price_text)
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
        browser = await p.webkit.launch(headless=True)

        context = await browser.new_context(   # ✅ moved outside loop (speed++)
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        )

        for current_item in items:
            print(f"--- Processing: {current_item} ---")

            blink_res, zepto_res = await asyncio.gather(
                scrape_platform("Blinkit", current_item, pincode, context),
                scrape_platform("Zepto", current_item, pincode, context)
            )

            results.append({
                "query": current_item,
                "Blinkit": blink_res,
                "Zepto": zepto_res
            })

        await context.close()
        await browser.close()
        return results