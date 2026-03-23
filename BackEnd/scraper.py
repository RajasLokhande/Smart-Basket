import asyncio
import re
from playwright.async_api import async_playwright
import pytesseract

pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"


def log(platform, msg):
    print(f"[{platform}] {msg}", flush=True)


async def scrape_platform(platform, item_name, pincode, browser_context):
    log(platform, "Creating new page")
    page = await browser_context.new_page()
    TIMEOUT = 20000
    
    try:
        if platform.lower() == "zepto":

            log(platform, f"Navigating to search page: {item_name}")
            await page.goto(
                f"https://www.zeptonow.com/search?query={item_name}",
                wait_until="domcontentloaded",
                timeout=TIMEOUT
            )

            await asyncio.sleep(3)
            await page.mouse.wheel(0, 800)
            await asyncio.sleep(2)

            log(platform, "Locating price elements")
            elements = page.locator(":text-matches('₹\\\\s*[0-9]+', 'i')")

            count = await elements.count()
            final_price = 0.0

            for i in range(count):
                text = await elements.nth(i).inner_text()
                match = re.search(r'₹\s*([0-9]+)', text)
                if match:
                    price = float(match.group(1))
                    if 10 <= price <= 5000:
                        final_price = price
                        break

            log(platform, f"Parsed price: {final_price}")

        else:
            log(platform, f"Navigating to Blinkit search: {item_name}")
            await page.goto(
                f"https://blinkit.com/s/?q={item_name}",
                wait_until="domcontentloaded",
                timeout=TIMEOUT
            )

            await asyncio.sleep(2)
            await page.mouse.wheel(0, 1000)
            await asyncio.sleep(2)

            log(platform, "Locating price elements")
            elements = page.locator(":text-matches('₹\\\\s*[0-9]+', 'i')")

            count = await elements.count()
            final_price = 0.0

            for i in range(count):
                text = await elements.nth(i).inner_text()
                match = re.search(r'₹\s*([0-9]+)', text)
                if match:
                    price = float(match.group(1))
                    if 10 <= price <= 5000:
                        final_price = price
                        break

            log(platform, f"Parsed price: {final_price}")

        return {
            "platform": platform,
            "price": final_price,
            "delivery_fee": 15,
            "total": final_price + 15
        }

    except Exception as e:
        log(platform, f"ERROR: {e}")
        return {"platform": platform, "price": 0, "total": 0}

    finally:
        log(platform, "Closing page")
        await page.close()


async def get_full_comparison(items, pincode):
    if isinstance(items, list) and len(items) == 1 and ',' in items[0]:
        items = [i.strip() for i in items[0].split(',')]
    elif isinstance(items, str):
        items = [i.strip() for i in items.split(',')]
    
    results = []

    async with async_playwright() as p:
        print("[MAIN] Launching browser", flush=True)
        browser = await p.webkit.launch(headless=True)

        print("[MAIN] Creating context", flush=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        )

        for current_item in items:
            print(f"\n[MAIN] Processing: {current_item}", flush=True)

            blink_res, zepto_res = await asyncio.gather(
                scrape_platform("Blinkit", current_item, pincode, context),
                scrape_platform("Zepto", current_item, pincode, context)
            )

            print("[MAIN] Results received", flush=True)

            results.append({
                "query": current_item,
                "Blinkit": blink_res,
                "Zepto": zepto_res
            })

        print("[MAIN] Closing context", flush=True)
        await context.close()

        print("[MAIN] Closing browser", flush=True)
        await browser.close()

        return results