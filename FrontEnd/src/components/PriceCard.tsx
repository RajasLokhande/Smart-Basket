import { motion } from "framer-motion";

interface PriceCardProps {
  platform: string;
  data: any;
  isCheapest: boolean;
}

const PriceCard = ({ platform, data, isCheapest }: PriceCardProps) => {
  // Check multiple keys to handle backend variations
  const delivery = data.delivery_fee ?? data.deliveryCharge ?? 0;
  const handling = data.handling_fee ?? data.handlingCharge ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-8 rounded-[2.5rem] border-2 backdrop-blur-3xl transition-all duration-500 ${
        isCheapest 
          ? "border-green-500 bg-green-500/10 shadow-[0_0_40px_rgba(34,197,94,0.2)]" 
          : "border-white/10 bg-black/80 shadow-2xl"
      }`}
    >
      <h3 className={`text-5xl font-black uppercase mb-8 italic tracking-tighter drop-shadow-lg ${
        isCheapest ? "text-green-400" : "text-white"
      }`}>
        {platform}
      </h3>

      <div className="space-y-6">
        <div className="space-y-3">
          {data.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-zinc-300 font-black uppercase text-xs">{item.name}</span>
              <span className="text-white font-black text-lg">₹{item.price}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 space-y-3 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Logistics</span>
            <span className={`font-black text-lg ${Number(delivery) === 0 ? "text-green-400" : "text-white"}`}>
              {Number(delivery) === 0 ? "FREE" : `₹${delivery}`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Handling</span>
            <span className="text-white font-black text-lg">₹{handling}</span>
          </div>
        </div>

        <div className="pt-6 mt-2 flex justify-between items-end border-t-4 border-white/10">
          <span className="text-xs font-black uppercase text-green-500 tracking-widest mb-1">Payable</span>
          <span className={`text-7xl font-black leading-none drop-shadow-2xl ${
            isCheapest ? "text-green-400" : "text-white"
          }`}>
            ₹{data.total}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceCard;