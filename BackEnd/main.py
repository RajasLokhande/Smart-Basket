import os
import json
import io
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import pytesseract
from scraper import get_full_comparison

# Ensure this path is correct for your local machine
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = FastAPI()

# Standardized CORS for Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/compare")
async def compare_basket(basket_json: str = Form(...), pincode: str = Form(...)):
    try:
        items = json.loads(basket_json)
        raw_results = await get_full_comparison(items, pincode)
        
        comparison_summary = {}
        
        for res in raw_results:
            plat = res.get('platform', 'Unknown')
            if plat not in comparison_summary:
                # Standardizing key to 'delivery_fee' to match Frontend Interface
                comparison_summary[plat] = {"items": [], "subtotal": 0, "delivery_fee": 25}
            
            if res.get('price', 0) > 0:
                # Mapping scraper 'product' to frontend 'product'
                comparison_summary[plat]["items"].append({
                    "product": res.get("product"),
                    "price": res.get("price")
                })
                comparison_summary[plat]["subtotal"] += res["price"]

        # Finalize totals
        for plat in comparison_summary:
            sub = comparison_summary[plat]["subtotal"]
            if sub > 0:
                comparison_summary[plat]["total"] = sub + comparison_summary[plat]["delivery_fee"]
            else:
                comparison_summary[plat]["total"] = 0

        # Calculate recommendation
        valid_plats = [p for p in comparison_summary if comparison_summary[p]["total"] > 0]
        cheapest = min(valid_plats, key=lambda x: comparison_summary[x]["total"]) if valid_plats else "None"

        return {
            "pincode": pincode, 
            "comparison": comparison_summary, 
            "recommendation": cheapest
        }
        
    except Exception as e:
        print(f"Error during comparison: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)