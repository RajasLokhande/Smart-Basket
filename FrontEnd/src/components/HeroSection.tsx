import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ShoppingCart, Zap, TrendingDown, Shield, ChevronDown, BarChart3, Globe } from "lucide-react";
import heroCart from "@/assets/hero-cart.png";

interface HeroSectionProps {
  onEnter: () => void;
  loading: boolean;
}

const features = [
  { icon: Zap, label: "Instant Scan", desc: "Prices fetched in real-time from every platform" },
  { icon: TrendingDown, label: "Best Deals", desc: "Automatically highlights the cheapest option" },
  { icon: Shield, label: "All Platforms", desc: "Blinkit, Zepto, Instamart, BigBasket" },
];

const stats = [
  { value: "4+", label: "Platforms" },
  { value: "< 2s", label: "Scan Time" },
  { value: "₹100+", label: "Avg. Saved" },
];

const HeroSection = ({ onEnter, loading }: HeroSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Smooth spring for scroll values
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 30 });

  // Hero content transforms (first viewport)
  const heroOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.25], [1, 0.92]);
  const heroY = useTransform(smoothProgress, [0, 0.25], [0, -80]);
  const heroBlur = useTransform(smoothProgress, [0, 0.2], [0, 8]);

  // Cart image transforms — floats up and rotates
  const cartY = useTransform(smoothProgress, [0, 0.5], [0, -300]);
  const cartScale = useTransform(smoothProgress, [0, 0.3, 0.6], [1, 1.4, 0.6]);
  const cartRotate = useTransform(smoothProgress, [0, 0.5], [0, 15]);
  const cartOpacity = useTransform(smoothProgress, [0, 0.15, 0.4, 0.55], [1, 1, 1, 0]);

  // Features section
  const featuresOpacity = useTransform(smoothProgress, [0.2, 0.35, 0.6, 0.72], [0, 1, 1, 0]);
  const featuresY = useTransform(smoothProgress, [0.2, 0.35], [60, 0]);

  // Stats section
  const statsOpacity = useTransform(smoothProgress, [0.45, 0.58, 0.78, 0.88], [0, 1, 1, 0]);
  const statsY = useTransform(smoothProgress, [0.45, 0.58], [50, 0]);

  // Final CTA — ensure it's fully visible well before scroll ends
  const ctaOpacity = useTransform(smoothProgress, [0.65, 0.78, 1], [0, 1, 1]);
  const ctaScale = useTransform(smoothProgress, [0.65, 0.78, 1], [0.9, 1, 1]);

  // Background glow that shifts on scroll
  const glowX = useTransform(smoothProgress, [0, 0.5, 1], ["50%", "30%", "70%"]);
  const glowScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.5, 0.8]);

  // Scroll indicator opacity
  const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.05], [1, 0]);

  return (
    <div ref={containerRef} className="relative" style={{ height: "500vh" }}>
      {/* Fixed viewport container */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Animated glow */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[150px] pointer-events-none"
          style={{ left: glowX, scale: glowScale }}
        />

        {/* Scanline */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan" />
        </div>

        {/* === HERO CONTENT (Viewport 1) === */}
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
            {/* Badge */}
            <motion.div
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-glow bg-primary/5 font-mono text-xs text-primary"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              PRICE COMPARISON ENGINE
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-glow"
              style={{ color: "hsl(var(--foreground))" }}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {loading ? "INITIALIZING..." : "SMART BASKET"}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg text-muted-foreground max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              Compare grocery prices across every delivery platform.
              One search, every deal.
            </motion.p>

            {/* Stats row */}
            <motion.div
              className="flex gap-8 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold font-mono text-primary tabular-nums">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* === FLOATING CART IMAGE === */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          style={{
            y: cartY,
            scale: cartScale,
            rotate: cartRotate,
            opacity: cartOpacity,
          }}
        >
          <img
            src={heroCart}
            alt="Smart Basket"
            className="w-48 sm:w-64 md:w-80 drop-shadow-[0_0_60px_hsl(var(--glow)/0.3)]"
          />
        </motion.div>

        {/* === FEATURES SECTION (Viewport 2-3) === */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
          style={{ opacity: featuresOpacity, y: featuresY }}
        >
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-primary mb-4">
                <BarChart3 className="w-3.5 h-3.5" />
                HOW IT WORKS
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                Every price, one glance
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{f.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* === PLATFORMS SECTION (Viewport 3-4) === */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
          style={{ opacity: statsOpacity, y: statsY }}
        >
          <div className="max-w-3xl w-full text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-primary mb-4">
              <Globe className="w-3.5 h-3.5" />
              PLATFORMS
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-10" style={{ color: "hsl(var(--foreground))" }}>
              All your stores, compared
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Blinkit", color: "142 71% 45%", tagline: "10-min delivery" },
                { name: "Zepto", color: "280 67% 55%", tagline: "Lightning fast" },
                { name: "Instamart", color: "24 95% 53%", tagline: "By Swiggy" },
                { name: "BigBasket", color: "200 80% 50%", tagline: "Trusted grocer" },
              ].map((p, i) => (
                <motion.div
                  key={p.name}
                  className="p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm text-center space-y-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center font-bold text-lg"
                    style={{
                      background: `hsl(${p.color} / 0.12)`,
                      color: `hsl(${p.color})`,
                    }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <div className="font-semibold text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.tagline}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* === FINAL CTA (Viewport 5) === */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
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
              <motion.button
                onClick={onEnter}
                className="group relative px-12 py-5 bg-primary text-primary-foreground font-semibold text-lg rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_60px_hsl(var(--glow)/0.35)] active:scale-[0.97]"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Comparing
                  <Zap className="w-5 h-5" />
                </span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
          style={{ opacity: scrollIndicatorOpacity }}
        >
          <span className="text-xs font-mono text-muted-foreground">SCROLL</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce" />
        </motion.div>

        {/* Top/bottom gradient */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-[5] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-[5] pointer-events-none" />
      </div>
    </div>
  );
};

export default HeroSection;
