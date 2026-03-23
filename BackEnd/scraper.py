import asyncio
import re
from playwright.async_api import async_playwright
import pytesseract
import os
import subprocess
import shutil

# OCR path
if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
else:
    pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"


# ---------- FORCE INSTALL PLAYWRIGHT ----------
def ensure_playwright():
    try:
        subprocess.run(
            ["python", "-m", "playwright", "install", "chromium"],
            check=True
        )
        print("[PLAYWRIGHT] Chromium ensured", flush=True)
    except Exception as e:
        print("[PLAYWRIGHT ERROR]", e, flush=True)


# ---------- FORCE INSTALL TESSERACT ----------
def ensure_tesseract():
    if shutil.which("tesseract") is None:
        print("[OCR] Installing tesseract...", flush=True)
        try:
            subprocess.run(
                "apt-get update && apt-get install -y tesseract-ocr",
                shell=True,
                check=True
            )
            print("[OCR] Tesseract installed", flush=True)
        except Exception as e:
            print("[OCR ERROR] install failed:", e, flush=True)
    else:
        print("[OCR] Tesseract already present", flush=True)


def log(platform, msg):
    print(f"[{platform}] {msg}", flush=True)


async def scrape_platform(platform, item_name, pincode, browser_context):
    log(platform, "Creating new page")
    page = await browser_context.new_page()
    TIMEOUT = 30000
    
    try:
       # ------------------ ZEPTO FIXED (WITH PINCODE INJECTION) ------------------
        if platform.lower() == "zepto":
            log(platform, f"Setting location to {pincode}...")
            
            # 1. Navigate to home first to trigger the location modal
            await page.goto("https://www.zepto.com/", wait_until="domcontentloaded")
            
            try:
                # Target the 'Select Location' or 'Deliver to' button
                loc_trigger = page.locator("button:has-text('Select Location'), button:has-text('Deliver to')").first
                await loc_trigger.wait_for(state="visible", timeout=5000)
                await loc_trigger.click()

                # Find the pincode/address input field
                # Zepto uses various placeholders like "Search for area", "pincode", etc.
                pincode_input = page.locator("input[placeholder*='area'], input[placeholder*='Pincode']").first
                await pincode_input.wait_for(state="visible", timeout=5000)
                await pincode_input.fill(pincode)
                
                # Wait for the specific address suggestion to appear and click the first one
                # Usually, typing a pincode triggers a dropdown; we select the top result.
                await asyncio.sleep(1.5)
                await page.keyboard.press("ArrowDown")
                await page.keyboard.press("Enter")
                
                # Give the site a moment to update the local session
                await asyncio.sleep(2)
                log(platform, f"Location set to {pincode}")
            except Exception as e:
                log(platform, f"Location setup skipped (likely already set): {e}")

            # 2. Proceed to the actual search URL
            search_url = f"https://www.zepto.com/search?query={item_name}"
            log(platform, f"Searching: {item_name}")
            await page.goto(search_url, wait_until="load", timeout=TIMEOUT)

            # 3. Wait for product cards to render
            try:
                await page.wait_for_selector("[data-testid='product-card']", timeout=15000)
            except:
                log(platform, "Product grid not detected. Forcing scroll trigger.")

            # Scroll to trigger 'Intersection Observer' for dynamic content
            for _ in range(3):
                await page.mouse.wheel(0, 600)
                await asyncio.sleep(1)

            log(platform, "Finding product cards")
            cards = page.locator("[data-testid='product-card']")
            count = await cards.count()

            final_price = 0.0
            if count > 0:
                card = cards.first
                text = await card.inner_text()
                match = re.search(r'₹\s*(\d+)', text)
                if match:
                    final_price = float(match.group(1))
            else:
                log(platform, f"Zero cards found. {item_name} may be unavailable in {pincode}.")

            log(platform, f"Parsed price: {final_price}")

        # ------------------ BLINKIT (UNCHANGED) ------------------
        else:
            log(platform, f"Navigating to Blinkit search: {item_name}")
            await page.goto(
                f"https://blinkit.com/s/?q={item_name}",
                wait_until="domcontentloaded",
                timeout=TIMEOUT
            )

            await asyncio.sleep(2)

            for _ in range(3):
                await page.mouse.wheel(0, 1200)
                await asyncio.sleep(1)

            await asyncio.sleep(2)

            log(platform, "Waiting for prices to render")
            await page.wait_for_function(
                """() => document.body.innerText.includes("₹")""",
                timeout=15000
            )

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

    # FORCE INSTALLS
    ensure_playwright()
    ensure_tesseract()

    if isinstance(items, list) and len(items) == 1 and ',' in items[0]:
        items = [i.strip() for i in items[0].split(',')]
    elif isinstance(items, str):
        items = [i.strip() for i in items.split(',')]

    print(f"[SCANNING LIST]: {items}", flush=True)

    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )

        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        )

        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        for current_item in items:
            print(f"\n[MAIN] Processing: {current_item}", flush=True)

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