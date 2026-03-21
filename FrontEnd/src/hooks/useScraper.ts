import { useState, useCallback } from "react";

export const useScraper = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Existing function for comparing manual lists
  const fetchPrices = useCallback(async (items: string[], pincode: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("basket_json", JSON.stringify(items));
      formData.append("pincode", pincode);

      const response = await fetch("http://127.0.0.1:8000/compare", {
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

  // New function for OCR scanning
  const uploadReceipt = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file); // Must match 'file: UploadFile' in main.py

      const response = await fetch("http://127.0.0.1:8000/upload-receipt", {
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