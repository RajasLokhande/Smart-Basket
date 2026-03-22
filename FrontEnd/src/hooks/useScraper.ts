import { useState, useCallback } from "react";

// STEP 1: Replace this with your actual Railway/Render URL after you deploy the backend
// Example: "https://pricesync-production.up.railway.app"
const BACKEND_URL = "https://priceesync.netlify.app"; 

export const useScraper = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const fetchPrices = useCallback(async (items: string[], pincode: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("basket_json", JSON.stringify(items));
      formData.append("pincode", pincode);

      // STEP 2: Use the BACKEND_URL variable
      const response = await fetch(`${BACKEND_URL}/compare`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("NETWORK ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadReceipt = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file); 

      // STEP 3: Use the BACKEND_URL variable here too
      const response = await fetch(`${BACKEND_URL}/upload-receipt`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("OCR Server Error:", response.status);
        return [];
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Upload Connection Error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchPrices, uploadReceipt, results, loading };
};