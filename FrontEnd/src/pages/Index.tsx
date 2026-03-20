import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroSection from "../components/HeroSection";
import CompareView from "../components/CompareView";

const Index = () => {
  const [phase, setPhase] = useState<"home" | "compare">("home");

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
              loading={false}
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
            <CompareView onBack={() => setPhase("home")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
