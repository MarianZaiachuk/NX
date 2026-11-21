import { Clock, Eye, MessageCircle, Share2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NEWS_FEED = [
  {
    id: 1,
    title: "AI Predicts BTC Surge to New All-Time High",
    description: "Our proprietary AI models have detected bullish divergence patterns across multiple timeframes, suggesting a potential breakout above $75k.",
    timeAgo: "5m ago",
    views: "1.2k",
    comments: 42,
    tag: "AI Analysis",
    tone: "text-nx-lime bg-nx-lime/10",
  },
  {
    id: 2,
    title: "Ethereum Dencun Upgrade Impact",
    description: "Layer 2 transaction fees drop significantly as the latest network upgrade takes effect, spurring a massive increase in on-chain activity.",
    timeAgo: "1h ago",
    views: "4.5k",
    comments: 128,
    tag: "Network",
    tone: "text-nx-blue bg-nx-blue/10",
  },
  {
    id: 3,
    title: "Gold (XAUT) Stability Amidst Crypto Volatility",
    description: "Investors are flocking back to tokenized gold assets to hedge against the recent market swings in major altcoins.",
    timeAgo: "3h ago",
    views: "890",
    comments: 15,
    tag: "Markets",
    tone: "text-[#F5C84C] bg-[#F5C84C]/10",
  },
  {
    id: 4,
    title: "Top 5 DeFi Protocols to Watch This Month",
    description: "A deep dive into the most promising decentralized finance platforms offering sustainable yields in the current market environment.",
    timeAgo: "5h ago",
    views: "3.1k",
    comments: 84,
    tag: "DeFi",
    tone: "text-[#EF476F] bg-[#EF476F]/10",
  }
];

export default function Discovery() {
  return (
    <div className="py-4 pb-20 flex flex-col h-full overflow-y-auto hide-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Відкрити</h1>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-app-text hover:bg-white/10 transition-colors">
          <Sparkles size={20} className="text-nx-lime" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {NEWS_FEED.map((news, index) => (
          <motion.div 
            key={news.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl bg-app-panel border border-app-border/5 p-5 shadow-lg overflow-hidden relative cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${news.tone}`}>
                {news.tag}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-app-muted/60">
                <Clock size={12} />
                {news.timeAgo}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-app-text mb-2 leading-tight relative z-10">
              {news.title}
            </h3>
            
            <p className="text-sm text-app-muted/70 mb-4 line-clamp-2 leading-relaxed relative z-10">
              {news.description}
            </p>
            
            <div className="flex items-center justify-between pt-3 border-t border-app-border/5 relative z-10 text-app-muted/50">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-app-text transition-colors">
                  <Eye size={14} />
                  {news.views}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-app-text transition-colors">
                  <MessageCircle size={14} />
                  {news.comments}
                </button>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-app-text transition-colors">
                <Share2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
