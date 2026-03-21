import { useState, useCallback } from "react";

export const useScraper = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const fetchPrices = useCallback(async (items: string[], pincode: string) => {
    console.log("Attempting to call backend with:", { items, pincode });
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("basket_json", JSON.stringify(items));
      formData.append("pincode", pincode);

      const response = await fetch("http://127.0.0.1:8000/compare", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend returned error:", errorData);
        throw new Error("Server error");
      }

      const data = await response.json();
      console.log("Backend Success:", data);
      setResults(data);
    } catch (error) {
      console.error("NETWORK ERROR: Is your Python server running on port 8000?", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadReceipt = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:8000/upload-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Upload Error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchPrices, uploadReceipt, results, loading };
};