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
    if (items.length > 0) {
      setPhase("compare");
      // Trigger scan automatically for the first item found in the receipt
      fetchPrices([items[0]], "421202");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {phase === "home" ? (
          <motion.div
            key="home"
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