import { useState, useCallback } from "react";

interface ScraperItem {
  name: string;
  price: number | string;
}

interface PlatformData {
  items: ScraperItem[];
  total: number | string;
  delivery_fee?: number | string;
  delivery_charge?: number | string;
  handling_fee?: number | string;
  handling_charge?: number | string;
}

export interface ScraperResult {
  comparison: Record<string, PlatformData>;
  query?: string;
  id?: number;
}

// Demo data for when backend is unavailable
const generateDemoData = (query: string): ScraperResult => {
  const platforms: Record<string, PlatformData> = {
    Blinkit: {
      items: [{ name: query, price: Math.floor(Math.random() * 80) + 30 }],
      total: 0,
      delivery_fee: Math.random() > 0.5 ? 0 : 25,
      handling_fee: Math.floor(Math.random() * 10) + 2,
    },
    Zepto: {
      items: [{ name: query, price: Math.floor(Math.random() * 80) + 28 }],
      total: 0,
      delivery_fee: Math.random() > 0.4 ? 0 : 20,
      handling_fee: Math.floor(Math.random() * 8) + 3,
    },
    Instamart: {
      items: [{ name: query, price: Math.floor(Math.random() * 80) + 32 }],
      total: 0,
      delivery_fee: Math.random() > 0.6 ? 0 : 30,
      handling_fee: Math.floor(Math.random() * 12) + 1,
    },
    BigBasket: {
      items: [{ name: query, price: Math.floor(Math.random() * 80) + 25 }],
      total: 0,
      delivery_fee: Math.random() > 0.3 ? 0 : 40,
      handling_fee: Math.floor(Math.random() * 6) + 4,
    },
  };

  // Calculate totals
  Object.values(platforms).forEach((p) => {
    const itemTotal = p.items.reduce((sum, item) => sum + Number(item.price), 0);
    const del = Number(p.delivery_fee ?? 0);
    const hand = Number(p.handling_fee ?? 0);
    p.total = itemTotal + del + hand;
  });

  return { comparison: platforms };
};

export const useScraper = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScraperResult | null>(null);

  const fetchPrices = useCallback(async (items: string[], pincode: string) => {
    if (!pincode) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("basket_json", JSON.stringify(items));
      formData.append("pincode", pincode);

      const response = await fetch("http://127.0.0.1:8000/compare", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Connection lost");
      const data = await response.json();
      setResults(data);
    } catch {
      // Fallback to demo data
      await new Promise((r) => setTimeout(r, 1200));
      setResults(generateDemoData(items[0] || "Milk"));
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchPrices, results, loading };
};
