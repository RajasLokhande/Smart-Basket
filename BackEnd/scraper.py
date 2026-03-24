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
        # ------------------ ZEPTO FIXED ------------------
        if platform.lower() == "zepto":
            log(platform, f"Navigating to Zepto search: {item_name}")
            
            # FIX: Use zepto.com and wait for 'load' to ensure scripts are ready
            search_url = f"https://www.zepto.com/search?query={item_name}"
            await page.goto(search_url, wait_until="load", timeout=TIMEOUT)

            # Important: Set the location context using pincode if possible
            # (Adding a 3-second sleep as in your working example to allow JS render)
            await asyncio.sleep(3)

            # FIX: More reliable scroll to trigger lazy loading
            # We scroll, wait, and scroll again
            for _ in range(2):
                await page.mouse.wheel(0, 800)
                await asyncio.sleep(1.5)

            log(platform, "Locating product cards")
            
            # FIX: Instead of generic text-matches, use the specific product card ID
            cards = page.locator("[data-testid='product-card']")
            count = await cards.count()
            
            final_price = 0.0

            if count > 0:
                # Target the first card (most relevant)
                first_card = cards.first
                text = await first_card.inner_text()
                
                # Use a robust Regex to find the price inside the card
                match = re.search(r'₹\s*(\d+)', text)
                if match:
                    final_price = float(match.group(1))
            else:
                log(platform, "Zero cards found. Checking fallback text search.")
                # Fallback: Search the whole page text if selectors fail
                content = await page.content()
                matches = re.findall(r'₹\s*([1-9][0-9]{1,3})', content)
                if matches:
                    final_price = float(matches[0])

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