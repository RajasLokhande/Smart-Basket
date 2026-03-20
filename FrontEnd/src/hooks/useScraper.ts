import { useState, useCallback } from "react";

interface ScraperItem {
  name: string;
  price: number | string;
}

interface PlatformData {
  items: ScraperItem[];
  total: number | string;
  delivery_fee?: number | string;
  handling_fee?: number | string;
}

export interface ScraperResult {
  comparison: Record<string, PlatformData>;
  query?: string;
  id?: number;
}

export const useScraper = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScraperResult | null>(null);

  // NEW: Function to handle image upload to the backend
  const uploadReceipt = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file); // Key must match 'file' in FastAPI endpoint

      const response = await fetch("http://127.0.0.1:8000/upload-receipt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      
      return data.items as string[]; // Returns list of strings found in the image
    } catch (error) {
      console.error("OCR Error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

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
    } catch (error) {
      console.error("Scraper Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchPrices, uploadReceipt, results, loading };
};