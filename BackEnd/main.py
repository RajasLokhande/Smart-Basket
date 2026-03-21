import sys, asyncio, json, uvicorn
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from scraper import get_full_comparison

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
        
        # --- REVERTED TO PREVIOUS CARD STRUCTURE ---
        comparison_summary = {}
        for entry in raw_data:
            for plat in ["Blinkit", "Zepto"]:
                res = entry[plat]
                if res["price"] > 0:
                    # Grouping by platform to restore the dual-card UI
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

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, loop="asyncio")