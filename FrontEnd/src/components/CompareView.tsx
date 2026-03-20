import { useState, useRef, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import PriceCard from "./PriceCard";
import { useScraper, type ScraperResult } from "../hooks/useScraper";

interface CompareViewProps {
  onBack: () => void;
}

interface HistoryEntry extends ScraperResult {
  query: string;
  id: number;
}

const CompareView = ({ onBack }: CompareViewProps) => {
  const { fetchPrices, results, loading } = useScraper();
  const [searchTerm, setSearchTerm] = useState("");
  const [pincode, setPincode] = useState("421202");
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevResultsRef = useRef<ScraperResult | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim() || loading) return;
    await fetchPrices([searchTerm], pincode);
  };

  // Track results changes
  if (results && results !== prevResultsRef.current) {
    prevResultsRef.current = results;
    const entry: HistoryEntry = {
      ...results,
      query: searchTerm,
      id: Date.now(),
    };
    // Avoid duplicates by checking id
    if (!searchHistory.find((h) => h.id === entry.id)) {
      setSearchHistory((prev) => [entry, ...prev]);
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const getCheapestPlatform = (comparison: Record<string, { total: number | string }>) => {
    let min = Infinity;
    let cheapest = "";
    Object.entries(comparison).forEach(([plat, data]) => {
      const t = Number(data.total);
      if (t < min) {
        min = t;
        cheapest = plat;
      }
    });
    return cheapest;
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Top bar */}
      <motion.header
        className="sticky top-0 z-50 backdrop-blur-xl border-b border-border bg-background/80"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="text-lg font-bold text-primary font-mono tracking-tight hidden sm:block">
            SMART BASKET
          </h1>

          <div className="flex-1 flex items-center gap-2">
            {/* Pincode */}
            <div className="relative hidden sm:block">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-28 pl-8 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                placeholder="PIN"
              />
            </div>

            {/* Search */}
            <div className="flex-1 flex items-center bg-secondary border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
              <Search className="w-4 h-4 text-muted-foreground ml-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder="Search for groceries..."
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Scan"
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="popLayout">
          {searchHistory.length === 0 && !loading ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-32 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Search for a product</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Enter a grocery item above to compare prices across Blinkit, Zepto, Instamart and more.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-10">
              {loading && searchHistory.length === 0 && (
                <motion.div
                  className="flex flex-col items-center py-32"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground font-mono">SCANNING PLATFORMS...</p>
                </motion.div>
              )}

              {searchHistory.map((item) => {
                const cheapest = getCheapestPlatform(item.comparison);
                return (
                  <motion.section
                    key={item.id}
                    initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-1 h-6 rounded-full bg-primary" />
                      <h2 className="font-semibold text-foreground">{item.query}</h2>
                      <span className="text-xs font-mono text-muted-foreground">PIN: {pincode}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(item.comparison).map(([plat, data], i) => (
                        <PriceCard
                          key={plat}
                          platform={plat}
                          data={data}
                          isCheapest={plat === cheapest}
                          index={i}
                        />
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CompareView;
