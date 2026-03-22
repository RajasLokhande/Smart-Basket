import { useState, useRef, type KeyboardEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import PriceCard from "./PriceCard";
import { type ScraperResult } from "../hooks/useScraper";

interface HistoryEntry extends ScraperResult {
  query: string;
  id: number;
}

interface CompareViewProps {
  onBack: () => void;
  results: ScraperResult | null;
  isLoading: boolean;
  onSearch: (items: string[], pincode: string) => Promise<void>;
}

const CompareView = ({ onBack, results, isLoading, onSearch }: CompareViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pincode, setPincode] = useState("421202");
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>([]);
  const prevResultsRef = useRef<ScraperResult | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim() || isLoading) return;
    await onSearch([searchTerm], pincode);
  };

  // Sync internal history with new results coming from parent
  if (results && results !== prevResultsRef.current) {
    prevResultsRef.current = results;
    const entry: HistoryEntry = { ...results, query: searchTerm, id: Date.now() };
    if (!searchHistory.find((h) => h.id === entry.id)) {
      setSearchHistory((prev) => [entry, ...prev]);
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // FIXED: Added check to prevent 'TypeError: Cannot convert undefined or null to object'
  const getCheapestPlatform = (comparison: any) => {
    if (!comparison || typeof comparison !== 'object') return "";
    
    let min = Infinity;
    let cheapest = "";
    
    Object.entries(comparison).forEach(([plat, data]: [string, any]) => {
      const t = Number(data.total);
      if (t < min && t > 0) {
        min = t;
        cheapest = plat;
      }
    });
    return cheapest;
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border bg-background/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <div className="relative hidden sm:block">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input 
                type="text" 
                value={pincode} 
                onChange={(e) => setPincode(e.target.value)} 
                className="w-28 pl-8 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" 
                placeholder="PIN" 
              />
            </div>
            
            <div className="flex-1 flex items-center bg-secondary border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
              <Search className="w-4 h-4 text-muted-foreground ml-3 shrink-0" />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onKeyDown={handleKeyDown} 
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none" 
                placeholder="Search for groceries..." 
              />
              <button 
                onClick={handleSearch} 
                disabled={isLoading || !searchTerm.trim()} 
                className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 active:scale-95 transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="popLayout">
          {searchHistory.length === 0 && !isLoading ? (
            <div className="py-32 text-center text-muted-foreground">
              <h2 className="text-xl font-semibold text-foreground mb-2">Search for a product</h2>
              <p className="text-sm">Enter an item to compare prices across platforms.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {isLoading && (
                 <div className="flex flex-col items-center py-10">
                   <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                   <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Scanning Live Prices...</p>
                 </div>
              )}
              
              {searchHistory.map((item) => {
                const cheapest = getCheapestPlatform(item.comparison);
                return (
                  <section key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      <h2 className="font-semibold text-foreground">{item.query}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {item.comparison && Object.entries(item.comparison).map(([plat, data]: [string, any], i) => (
                        <PriceCard 
                          key={plat} 
                          platform={plat} 
                          data={data} 
                          isCheapest={plat === cheapest} 
                          index={i} 
                        />
                      ))}
                    </div>
                  </section>
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