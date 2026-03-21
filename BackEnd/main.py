import sys, asyncio, json, uvicorn, io
from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from scraper import get_full_comparison
import PIL.Image
import pytesseract  # Requires: pip install pytesseract pillow
from PIL import Image

# ADD THIS LINE HERE:
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/compare")
async def compare_prices(basket_json: str = Form(...), pincode: str = Form(...)):
    try:
        try:
            items = json.loads(basket_json)
        except:
            items = [basket_json]

        print(f"\n[SCANNING LIST]: {items}")
        raw_data = await get_full_comparison(items, pincode)
        
        comparison_summary = {}
        for entry in raw_data:
            for plat in ["Blinkit", "Zepto"]:
                res = entry[plat]
                if res["price"] > 0:
                    if plat not in comparison_summary:
                        comparison_summary[plat] = {
                            "subtotal": 0,
                            "delivery_fee": 15,
                            "total": 0,
                            "items": []
                        }
                    
                    comparison_summary[plat]["items"].append({
                        "product": entry["query"],
                        "price": res["price"]
                    })
                    comparison_summary[plat]["subtotal"] += res["price"]
                    comparison_summary[plat]["total"] += res["total"]

        return {
            "comparison": comparison_summary,
            "recommendation": "Calculated"
        }
    except Exception as e:
        print(f"[SERVER ERROR]: {e}")
        return {"error": str(e)}

@app.post("/upload-receipt")
async def upload_receipt(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = PIL.Image.open(io.BytesIO(contents))
        text = pytesseract.image_to_string(image)
        
        # Improved parsing: Filter out common receipt noise
        noise_keywords = ["TOTAL", "TAX", "GST", "CASH", "DATE", "INV", "NO", "PRICE"]
        lines = [
            line.strip() for line in text.split('\n') 
            if len(line.strip()) > 3 
            and not any(k in line.upper() for k in noise_keywords)
        ]
        
        print(f"[OCR SUCCESS]: {lines}")
        return {"items": lines}
    except Exception as e:
        print(f"[OCR ERROR]: {e}")
        return {"error": str(e), "items": []}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, loop="asyncio")