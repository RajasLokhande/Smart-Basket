import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ShoppingCart, Zap, TrendingDown, Shield, ChevronDown, BarChart3, Globe, Camera } from "lucide-react";
import heroCart from "@/assets/hero-cart.png";

interface HeroSectionProps {
  onEnter: () => void;
  onUpload: (file: File) => void; // Added for OCR
  loading: boolean;
}

const features = [
  { icon: Zap, label: "Instant Scan", desc: "Prices fetched in real-time from every platform" },
  { icon: TrendingDown, label: "Best Deals", desc: "Automatically highlights the cheapest option" },
  { icon: Shield, label: "All Platforms", desc: "Blinkit, Zepto, Instamart, BigBasket" },
];

const HeroSection = ({ onEnter, onUpload, loading }: HeroSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden camera input

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 30 });

  // === SEQUENTIAL SECTION TRANSITIONS ===
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 0.92]);
  const heroY = useTransform(smoothProgress, [0, 0.15], [0, -80]);
  const heroBlur = useTransform(smoothProgress, [0, 0.15], [0, 8]);

  const featuresOpacity = useTransform(smoothProgress, [0.2, 0.3, 0.4, 0.5], [0, 1, 1, 0]);
  const featuresY = useTransform(smoothProgress, [0.2, 0.3], [60, 0]);

  const statsOpacity = useTransform(smoothProgress, [0.55, 0.65, 0.68, 0.7], [0, 1, 1, 0]);
  const statsY = useTransform(smoothProgress, [0.55, 0.65], [50, 0]);

  const ctaOpacity = useTransform(smoothProgress, [0.75, 0.85, 1], [0, 1, 1]);
  const ctaScale = useTransform(smoothProgress, [0.75, 0.85, 1], [0.9, 1, 1]);

  // === PARABOLIC CART MOTION ===
  const cartX = useTransform(smoothProgress, [0, 1], ["25vw", "5vw"]);
  const cartY = useTransform(smoothProgress, [0, 0.5, 1], ["25vh", "-40vh", "-15vh"]);
  const cartScale = useTransform(smoothProgress, [0, 0.5, 1], [0.9, 1.4, 0.8]);
  const cartRotate = useTransform(smoothProgress, [0, 0.5, 1], [0, 15, -5]);
  const cartOpacity = useTransform(smoothProgress, [0, 0.1, 0.7, 0.75], [1, 1, 1, 0]);

  const glowX = useTransform(smoothProgress, [0, 0.5, 1], ["50%", "30%", "70%"]);
  const glowScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.5, 0.8]);
  const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.05], [1, 0]);

  // OCR Logic
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div ref={containerRef} className="relative" style={{ height: "500vh" }}>
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[150px] pointer-events-none"
          style={{ left: glowX, scale: glowScale }}
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan" />
        </div>

        {/* Viewport 1: Hero */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-10"
          style={{
            opacity: heroOpacity,
            scale: heroScale,
            y: heroY,
            filter: useTransform(heroBlur, (v) => `blur(${v}px)`),
          }}
        >
          <div className="flex flex-col items-center gap-6 px-6 max-w-3xl text-center">
            <motion.div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-glow bg-primary/5 font-mono text-xs text-primary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              PRICE COMPARISON ENGINE
            </motion.div>
            <motion.h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-glow" style={{ color: "hsl(var(--foreground))" }} initial={{ opacity: 0, y: 20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              {loading ? "INITIALIZING..." : "PRICESYNC"}
            </motion.h1>
            <motion.p className="text-lg text-muted-foreground max-w-md leading-relaxed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}>
              Compare grocery prices across every delivery platform. One search, every deal.
            </motion.p>
          </div>
        </motion.div>

        {/* Viewport 2-3: Features */}
        <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6" style={{ opacity: featuresOpacity, y: featuresY }}>
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-primary mb-4">
                <BarChart3 className="w-3.5 h-3.5" /> HOW IT WORKS
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>Every price, one glance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f, i) => (
                 <motion.div key={f.label} className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-3" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><f.icon className="w-5 h-5 text-primary" /></div>
                  <h3 className="font-semibold text-foreground text-lg">{f.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Viewport 3-4: Platforms */}
        <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6" style={{ opacity: statsOpacity, y: statsY }}>
          <div className="max-w-3xl w-full text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-primary mb-4">
              <Globe className="w-3.5 h-3.5" /> PLATFORMS
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-10" style={{ color: "hsl(var(--foreground))" }}>All your stores, compared</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Blinkit", color: "142 71% 45%", tagline: "10-min delivery" },
                { name: "Zepto", color: "280 67% 55%", tagline: "Lightning fast" },
                { name: "Instamart", color: "24 95% 53%", tagline: "By Swiggy" },
                { name: "BigBasket", color: "200 80% 50%", tagline: "Trusted grocer" },
              ].map((p) => (
                <motion.div key={p.name} className="p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm text-center space-y-2">
                  <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center font-bold text-lg" style={{ background: `hsl(${p.color} / 0.12)`, color: `hsl(${p.color})` }}>{p.name.charAt(0)}</div>
                  <div className="font-semibold text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.tagline}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Viewport 5: Final CTA */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-30 px-6"
          style={{ opacity: ctaOpacity, scale: ctaScale }}
        >
          <div className="text-center space-y-6 max-w-lg">
            <ShoppingCart className="w-12 h-12 text-primary mx-auto" strokeWidth={1.2} />
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              Ready to save?
            </h2>
            <p className="text-muted-foreground">
              Stop overpaying. Compare prices across all platforms in seconds.
            </p>

            {!loading && (
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <motion.button
                  onClick={onEnter}
                  className="group relative px-10 py-5 bg-primary text-primary-foreground font-semibold text-lg rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_60px_hsl(var(--glow)/0.35)] active:scale-[0.97]"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start Comparing
                    <Zap className="w-5 h-5" />
                  </span>
                </motion.button>

                {/* HIDDEN INPUT FOR CAMERA/FILE */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                />

                {/* NEW SCAN RECEIPT BUTTON */}
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-10 py-5 bg-card/50 backdrop-blur-md text-foreground border border-border font-semibold text-lg rounded-xl transition-all duration-300 hover:bg-card/80 active:scale-[0.97]"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="flex items-center gap-3">
                    Scan Receipt
                    <Camera className="w-5 h-5" />
                  </span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Floating Cart */}
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" style={{ x: cartX, y: cartY, scale: cartScale, rotate: cartRotate, opacity: cartOpacity }}>
          <img src={heroCart} alt="PRICESYNC" className="w-48 sm:w-64 md:w-80 drop-shadow-[0_0_60px_hsl(var(--glow)/0.3)]" />
        </motion.div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2" style={{ opacity: scrollIndicatorOpacity }}>
          <span className="text-xs font-mono text-muted-foreground">SCROLL</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce" />
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;