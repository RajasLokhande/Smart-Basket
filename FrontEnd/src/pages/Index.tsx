import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroSection from "../components/HeroSection";
import CompareView from "../components/CompareView";
import { useScraper } from "../hooks/useScraper";

const Index = () => {
  const [phase, setPhase] = useState<"home" | "compare">("home");
  const { fetchPrices, uploadReceipt, results, loading } = useScraper();

  const handleImageUpload = async (file: File) => {
    const items = await uploadReceipt(file);
    
    if (items && items.length > 0) {
      // 1. Move to the comparison view first
      setPhase("compare");
      
      // 2. Filter out very short strings (like single characters/icons) 
      // and send the whole list to the scraper instead of just items[0]
      const validItems = items.filter((item: string) => item.trim().length > 2);
      
      if (validItems.length > 0) {
        // Automatically trigger search for the full list found on the receipt
        fetchPrices(validItems, "421202");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "home" ? (
          <motion.div
            key="home"
            className="relative w-full"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
            transition={{ duration: 0.4 }}
          >
            <HeroSection
              onEnter={() => setPhase("compare")}
              onUpload={handleImageUpload}
              loading={loading}
            />
          </motion.div>
        ) : (
          <motion.div
            key="compare"
            className="relative w-full"
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <CompareView 
              onBack={() => setPhase("home")} 
              results={results}
              isLoading={loading}
              onSearch={fetchPrices}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;