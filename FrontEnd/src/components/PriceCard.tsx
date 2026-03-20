import { motion } from "framer-motion";

interface PlatformData {
  items: { name: string; price: number | string }[];
  total: number | string;
  delivery_fee?: number | string;
  delivery_charge?: number | string;
  deliveryCharge?: number | string;
  deliveryFee?: number | string;
  handling_fee?: number | string;
  handling_charge?: number | string;
  handlingCharge?: number | string;
  handlingFee?: number | string;
}

interface PriceCardProps {
  platform: string;
  data: PlatformData;
  isCheapest: boolean;
  index: number;
}

const platformColors: Record<string, string> = {
  Blinkit: "142 71% 45%",
  Zepto: "280 67% 55%",
  Instamart: "24 95% 53%",
  BigBasket: "200 80% 50%",
};

const PriceCard = ({ platform, data, isCheapest, index }: PriceCardProps) => {
  const delivery = Number(data.delivery_fee ?? data.delivery_charge ?? data.deliveryCharge ?? data.deliveryFee ?? 0);
  const handling = Number(data.handling_fee ?? data.handling_charge ?? data.handlingCharge ?? data.handlingFee ?? 0);
  const color = platformColors[platform] || "142 71% 45%";

  return (
    <motion.div
      className={`relative rounded-xl border overflow-hidden transition-shadow duration-300 ${
        isCheapest 
          ? "border-primary bg-glow" 
          : "border-border"
      }`}
      style={{
        background: isCheapest
          ? `linear-gradient(135deg, hsl(${color} / 0.08), hsl(var(--card)))`
          : "hsl(var(--card))",
        boxShadow: isCheapest
          ? `0 0 40px hsl(${color} / 0.12), 0 8px 32px hsl(0 0% 0% / 0.3)`
          : "0 4px 24px hsl(0 0% 0% / 0.2)",
      }}
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
    >
      {isCheapest && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `hsl(${color})` }}
        />
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{
                background: `hsl(${color} / 0.15)`,
                color: `hsl(${color})`,
              }}
            >
              {platform.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{platform}</h3>
              {isCheapest && (
                <span className="text-xs font-mono" style={{ color: `hsl(${color})` }}>
                  BEST PRICE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {data.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground truncate mr-3">{item.name}</span>
              <span className="font-mono font-medium text-foreground tabular-nums">₹{item.price}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Charges */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery</span>
            <span className={`font-mono tabular-nums ${delivery === 0 ? "text-primary font-medium" : ""}`}>
              {delivery === 0 ? "FREE" : `₹${delivery}`}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Handling</span>
            <span className="font-mono tabular-nums">₹{handling}</span>
          </div>
        </div>

        {/* Total */}
        <div
          className="flex justify-between items-center p-3 -mx-1 rounded-lg"
          style={{ background: `hsl(${color} / 0.06)` }}
        >
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span
            className="text-xl font-bold font-mono tabular-nums"
            style={{ color: `hsl(${color})` }}
          >
            ₹{data.total}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceCard;
