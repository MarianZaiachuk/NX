import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, Gift, LogOut, Moon, Search, Sun, Grip, Grid3X3 } from "lucide-react";
import { asMoney } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import SideMenu from "../components/SideMenu.jsx";
import TransferModal from "../components/TransferModal.jsx";
import DepositModal from "../components/DepositModal.jsx";
import WithdrawModal from "../components/WithdrawModal.jsx";

const TARGET_SYMBOLS = {
  "BTCUSDT": { symbol: "BTC", name: "Bitcoin", tone: "orange" },
  "ETHUSDT": { symbol: "ETH", name: "Ethereum", tone: "blue" },
  "TRXUSDT": { symbol: "TRX", name: "TRX/USDT", tone: "red" },
  "ADAUSDT": { symbol: "ADA", name: "Cardano", tone: "indigo" },
  "PAXGUSDT": { symbol: "XAUT", name: "XAUT/USDT", tone: "gold" } 
};

const toneClasses = {
  gold: "bg-[#F5C84C] text-[#111111]",
  orange: "bg-[#F7931A] text-app-text",
  blue: "bg-[#627EEA] text-app-text",
  red: "bg-[#EF476F] text-app-text",
  indigo: "bg-[#2553D9] text-app-text",
};

function StatusBar() {
  return (
    <div className="flex h-11 items-center justify-center text-sm font-semibold mb-2 relative z-10">
      <div className="flex h-8 items-center justify-center gap-2 rounded-full bg-app-bg px-5 text-app-text shadow-lg border border-app-border/5">
        <span className="text-sm font-bold">NX</span>
        <span className="text-xs text-nx-lime font-bold tracking-widest animate-pulse">PRO</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, fetchUser, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("nx:theme") ?? "dark");
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("nx:theme", theme);
  }, [theme]);

  useEffect(() => {
    if (fetchUser) fetchUser();
  }, []);

  const balance = user?.balance || 595.11;
  const pnl = user?.today_profit ? parseFloat(user.today_profit) : 0.00;
  const isPnLPositive = pnl >= 0;
  const userId = user?.uid || "32196215";

  useEffect(() => {
    async function fetchMarkets() {
      try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const data = await response.json();
        
        const filtered = data
          .filter(ticker => Object.keys(TARGET_SYMBOLS).includes(ticker.symbol))
          .map(ticker => {
            const meta = TARGET_SYMBOLS[ticker.symbol];
            return {
              id: ticker.symbol,
              symbol: meta.symbol,
              name: meta.name,
              tone: meta.tone,
              price: parseFloat(ticker.lastPrice),
              change: parseFloat(ticker.priceChangePercent)
            };
          });
        
        const order = ["XAUT", "BTC", "ETH", "TRX", "ADA"];
        filtered.sort((a, b) => order.indexOf(a.symbol) - order.indexOf(b.symbol));
        
        setMarketData(filtered);
      } catch (err) {
        console.error("Failed to fetch market data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarkets();
    
    const interval = setInterval(fetchMarkets, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-4 pb-20 flex flex-col h-full overflow-y-auto overflow-x-hidden hide-scrollbar">
      <StatusBar />

      {/* Top Navbar Row */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-app-panel border border-app-border/5 text-app-text hover:bg-white/10 transition"
        >
          <Grid3X3 size={20} />
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/app/recommend')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-transparent text-nx-lime hover:bg-nx-lime/10 transition"
          >
            <Gift size={22} />
          </button>
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-app-panel border border-app-border/5 text-app-text hover:bg-white/10 transition"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={logout}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-nx-loss/10 border border-nx-loss/20 text-nx-loss hover:bg-nx-loss/20 transition"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-3 bg-app-panel border border-app-border/5 rounded-2xl p-4 text-app-muted/60">
          <Search size={20} className="text-nx-blue" />
          <span className="text-base font-semibold">Пошук торгових пар</span>
        </div>
      </div>

      {/* Balance Section - Raw Text */}
      <section className="mb-10 relative z-10 px-1">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-bold text-app-muted/80">
            Загальний баланс
          </div>
          <div className="text-xs font-bold text-app-muted/60 bg-white/5 px-2 py-1 rounded-md">
            ID: {userId}
          </div>
        </div>
        
        <div className="flex items-baseline gap-2 mb-4">
          <div className="text-5xl font-black text-app-text tracking-tight">
            {asMoney(balance)}
          </div>
          <div className="flex items-center gap-1 text-xl font-bold text-app-muted/60 hover:text-app-text cursor-pointer transition">
            USD <ChevronDown size={16} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="text-app-muted/60">Сьогодні:</span>
          <span className={`px-2 py-0.5 rounded ${isPnLPositive ? "bg-nx-gain/10 text-nx-gain" : "bg-nx-loss/10 text-nx-loss"}`}>
            {isPnLPositive ? "+" : ""}${pnl.toFixed(2)}
          </span>
        </div>

      {/* Deposit/Withdraw Buttons */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button onClick={() => setIsDepositModalOpen(true)} className="flex items-center justify-center gap-2 bg-nx-lime text-black py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(204,255,0,0.15)] hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all active:scale-95">
            <ArrowDownToLine size={18} />
            Депозит
          </button>
          <button onClick={() => setIsWithdrawModalOpen(true)} className="flex items-center justify-center gap-2 bg-app-panel text-app-text border border-app-border/10 py-3.5 rounded-xl font-bold hover:bg-white/5 transition-all active:scale-95">
            <ArrowUpFromLine size={18} />
            Вивід
          </button>
        </div>
      </section>

      {/* Market Data */}
      <section className="relative z-10 px-1">
        <h2 className="text-xl font-bold mb-4">Головні монети</h2>
        
        {loading && marketData.length === 0 ? (
          <div className="text-center py-10 text-app-muted/40 animate-pulse font-medium">
            Завантаження ринків...
          </div>
        ) : (
          <div className="flex flex-col">
            {marketData.map((market) => {
              const positive = market.change >= 0;
              return (
                <div 
                  key={market.id} 
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-4 border-b border-app-border/5 last:border-0 hover:bg-white/[0.02] transition-colors rounded-xl px-2 -mx-2 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-lg ${
                        toneClasses[market.tone]
                      }`}
                    >
                      {market.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-app-text">{market.symbol}</div>
                      <div className="truncate text-sm text-app-muted/60 font-medium">{market.name}</div>
                    </div>
                  </div>
                  
                  <div className="text-right text-base font-bold tracking-tight">
                    ${market.price < 1 ? market.price.toFixed(5) : asMoney(market.price)}
                  </div>
                  
                  <div
                    className={`flex h-9 w-[84px] items-center justify-center rounded-lg text-sm font-bold shadow-lg ml-2 ${
                      positive ? "bg-nx-gain/20 text-nx-gain border border-nx-gain/20" : "bg-nx-loss/20 text-nx-loss border border-nx-loss/20"
                    }`}
                  >
                    {positive ? "+" : ""}{market.change.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onOpenTransferModal={() => setIsTransferModalOpen(true)}
        onShowAlert={(type, msg) => setAlertMsg({ type, msg })}
      />

      <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {alertMsg && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-app-bg/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-app-panel border border-app-border/10 rounded-3xl w-full max-w-xs p-6 text-center shadow-2xl relative"
            >
              <div className={`mx-auto w-16 h-16 rounded-full mb-4 flex items-center justify-center ${alertMsg.type === 'success' ? 'bg-nx-gain/20 text-nx-gain' : 'bg-nx-loss/20 text-nx-loss'}`}>
                {alertMsg.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">{alertMsg.type === 'success' ? 'Успіх!' : 'Помилка'}</h3>
              <p className="text-app-muted/80 text-sm mb-6">{alertMsg.msg}</p>
              <button 
                onClick={() => setAlertMsg(null)}
                className="w-full bg-white/10 hover:bg-white/20 text-app-text font-bold py-3 rounded-xl transition-colors"
              >
                Закрити
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
    </div>
  );
}
