import sys
import asyncio
import json
import uvicorn
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from scraper import get_full_comparison

# Windows loop policy fix
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/compare")
async def compare_prices(basket_json: str = Form(...), pincode: str = Form(...)):
    try:
        items = json.loads(basket_json)
        print(f"\n[SCAN] Starting Sequential Search for: {items}")
        
        raw_results = await get_full_comparison(items, pincode)
        
        comparison_summary = {}
        for res in raw_results:
            if res["price"] > 0:
                # Displaying the exact name detected by the scraper
                comparison_summary[res["platform"]] = {
                    "items": [{"product": res["name"], "price": res["price"]}],
                    "subtotal": res["price"],
                    "delivery_fee": res.get("delivery_fee", 0),
                    "total": res["total"]
                }

        valid_totals = {k: v["total"] for k, v in comparison_summary.items()}
        recommendation = min(valid_totals, key=valid_totals.get) if valid_totals else "No data"

        return {
            "comparison": comparison_summary,
            "recommendation": recommendation
        }
    except Exception as e:
        print(f"[ERROR]: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, loop="asyncio")