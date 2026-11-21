import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  ChevronDown,
  Gift,
  LogOut,
  Lock,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import PriceChart from "./PriceChart.jsx";
import { delegateTrade, getTradeStatus, getUserState, getGlobalSession } from "../lib/api.js";
import { asMoney, formatDuration, numeric } from "../lib/format.js";
import { clearActiveTrade, readActiveTrade, saveActiveTrade } from "../lib/tradeStorage.js";
import { useAuth } from "../context/AuthContext.jsx";

const TRADE_DURATION_MS = 1 * 60 * 1000;

const MARKETS = [
  { symbol: "XAUT", name: "XAUT/USDT", price: "$4221.62", change: 0.73, tone: "gold" },
  { symbol: "BTC", name: "Bitcoin", price: "$64436.1", change: 0.97, tone: "orange" },
  { symbol: "ETH", name: "Ethereum", price: "$1674.34", change: -0.08, tone: "blue" },
  { symbol: "TRX", name: "TRX/USDT", price: "$0.31726", change: 0.4, tone: "red" },
  { symbol: "ADA", name: "Cardano", price: "$0.171", change: -1.18, tone: "indigo" },
];

const toneClasses = {
  gold: "bg-[#F5C84C] text-[#111111]",
  orange: "bg-[#F7931A] text-app-text",
  blue: "bg-[#627EEA] text-app-text",
  red: "bg-[#EF476F] text-app-text",
  indigo: "bg-[#2553D9] text-app-text",
};

function StatusBar() {
  return (
    <div className="safe-top flex h-11 items-center justify-between px-6 text-sm font-semibold">
      <span>12:02</span>
      <div className="flex h-8 min-w-32 items-center justify-between rounded-full bg-app-bg px-5 text-app-text dark:bg-app-bg shadow-lg">
        <span className="text-sm">NX</span>
        <span className="text-xs text-nx-lime animate-pulse">PRO</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="h-3 w-1 rounded-full bg-current" />
        <span className="h-4 w-1 rounded-full bg-current" />
        <span className="h-5 w-1 rounded-full bg-current" />
      </div>
    </div>
  );
}

function ChangePill({ value }) {
  const positive = value >= 0;
  return (
    <span
      className={`flex h-10 min-w-24 items-center justify-center rounded-lg px-3 text-base font-semibold text-app-text shadow-lg ${
        positive ? "bg-nx-gain shadow-nx-gain/20" : "bg-nx-loss shadow-nx-loss/20"
      }`}
    >
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}

function MarketRow({ market }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, x: 5 }}
      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-lg ${
            toneClasses[market.tone]
          }`}
        >
          {market.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-bold">{market.symbol}</div>
          <div className="truncate text-sm text-app-muted/60">{market.name}</div>
        </div>
      </div>
      <div className="text-right text-base font-semibold">{market.price}</div>
      <ChangePill value={market.change} />
    </motion.div>
  );
}

export default function TradingTerminal() {
  const { user, logout, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("nx:theme") ?? "dark");
  
  const [balance, setBalance] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [activeTrade, setActiveTrade] = useState(null);
  const [latestTrade, setLatestTrade] = useState(null);
  const [globalSession, setGlobalSession] = useState(null);
  const [remainingMs, setRemainingMs] = useState(TRADE_DURATION_MS);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [completionRequestedFor, setCompletionRequestedFor] = useState(null);
  const [error, setError] = useState("");
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("nx:theme", theme);
  }, [theme]);

  const normalizedActiveTrade = useMemo(() => {
    if (!activeTrade) {
      return null;
    }
    return {
      ...activeTrade,
      trade_id: activeTrade.trade_id ?? activeTrade.tradeId,
      unlock_time: activeTrade.unlock_time ?? activeTrade.unlockTime,
    };
  }, [activeTrade]);

  const refreshStatus = useCallback(
    async (tradeId = normalizedActiveTrade?.trade_id) => {
      if (!tradeId) {
        return;
      }
      setChecking(true);
      setError("");
      try {
        const data = await getTradeStatus(tradeId);
        setBalance(numeric(data.balance));
        setLatestTrade(data.trade);
        if (data.trade.status === "COMPLETED") {
          clearActiveTrade();
          setActiveTrade(null);
        } else {
          setActiveTrade(data.trade);
          saveActiveTrade(data.trade);
        }
        if (fetchUser) fetchUser();
      } catch (caught) {
        setError(caught.message);
      } finally {
        setChecking(false);
      }
    },
    [normalizedActiveTrade?.trade_id],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const stored = readActiveTrade();
      if (stored && !cancelled) {
        setActiveTrade({
          trade_id: stored.tradeId,
          unlock_time: stored.unlockTime,
          status: "IN_PROGRESS",
          stake_amount: "0.00",
          payout_amount: "0.00",
          profit_amount: "0.00",
        });
      }

      try {
        const [userData, sessionData] = await Promise.all([
          getUserState(),
          getGlobalSession()
        ]);
        
        if (cancelled) {
          return;
        }
        
        setGlobalSession(sessionData);
        setDisplayName(userData.display_name);
        setBalance(numeric(userData.balance));
        setLatestTrade(userData.latest_trade);
        
        if (userData.active_trade?.status === "IN_PROGRESS") {
          setActiveTrade(userData.active_trade);
          saveActiveTrade(userData.active_trade);
        } else {
          clearActiveTrade();
          setActiveTrade(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught.message);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let intervalId;
    if (!normalizedActiveTrade) {
      if (globalSession) {
        const start = Date.parse(globalSession.session_start);
        const end = Date.parse(globalSession.session_end);
        const update = () => {
          const now = Date.now();
          if (globalSession.is_active) {
            setRemainingMs(Math.max(0, end - now));
          } else {
            setRemainingMs(Math.max(0, start - now));
          }
        };
        update();
        intervalId = window.setInterval(update, 1000);
      }
      return () => {
        if (intervalId) window.clearInterval(intervalId);
      };
    }

    const update = () => {
      const unlockTime = Date.parse(normalizedActiveTrade.unlock_time);
      setRemainingMs(Math.max(0, unlockTime - Date.now()));
    };

    update();
    intervalId = window.setInterval(update, 1000);
    return () => window.clearInterval(intervalId);
  }, [normalizedActiveTrade?.trade_id, normalizedActiveTrade?.unlock_time, globalSession]);

  useEffect(() => {
    if (!normalizedActiveTrade || remainingMs > 0) {
      return;
    }
    if (completionRequestedFor === normalizedActiveTrade.trade_id) {
      return;
    }
    setCompletionRequestedFor(normalizedActiveTrade.trade_id);
    refreshStatus(normalizedActiveTrade.trade_id);
  }, [completionRequestedFor, normalizedActiveTrade, refreshStatus, remainingMs]);

  async function handleDelegate() {
    setSubmitting(true);
    setError("");
    setCompletionRequestedFor(null);
    try {
      const data = await delegateTrade();
      setBalance(numeric(data.balance));
      setActiveTrade(data.trade);
      setLatestTrade(data.trade);
      saveActiveTrade(data.trade);
      if (fetchUser) fetchUser();
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  }

  const shouldShowTimer = useMemo(() => {
    if (!globalSession || globalSession.is_active || Boolean(activeTrade)) return false;
    return true;
  }, [globalSession, activeTrade]);

  const isTomorrow = useMemo(() => {
    if (!globalSession) return false;
    const nextSessionDate = new Date(globalSession.session_start);
    const now = new Date();
    // Compare dates to see if the session is tomorrow
    return nextSessionDate.getDate() !== now.getDate();
  }, [globalSession]);

  const pnl = latestTrade?.status === "COMPLETED" ? numeric(latestTrade.profit_amount) : 0;

  const hasTradedThisSession = useMemo(() => {
    if (!latestTrade || !globalSession?.is_active) return false;
    const tradeTime = new Date(latestTrade.created_at).getTime();
    const sessionStart = new Date(globalSession.session_start).getTime();
    return tradeTime >= sessionStart;
  }, [latestTrade, globalSession]);

  return (
    <div className="flex-1 flex flex-col py-4 overflow-y-auto overflow-x-hidden relative">


      <section className="mb-6 relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">BTC/USDT <span className="text-xs bg-nx-blue/20 text-nx-blue px-2 py-1 rounded-md">Spot</span></h1>
            <div className="mt-1 text-sm text-app-muted/60 font-medium">{displayName}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-app-text">{currentPrice ? currentPrice.toFixed(2) : "•••"}</div>
            <div className="text-sm font-bold text-nx-gain">Active</div>
          </div>
        </div>
        <div className="mb-4 flex justify-between overflow-hidden text-sm font-bold text-app-muted/40 bg-app-panel rounded-xl p-1 border border-app-border/5">
          {['15Хв', '1Год', '4Год', '1Ден'].map((time, i) => (
            <button key={time} className={`flex-1 py-1.5 rounded-lg text-center transition-colors ${i === 3 ? 'bg-white/10 text-app-text shadow-sm' : 'hover:bg-white/5 hover:text-app-text/80'}`}>{time}</button>
          ))}
        </div>
        <div className="rounded-2xl overflow-hidden border border-app-border/5 shadow-inner bg-app-panel/50">
          <PriceChart theme={theme} symbol="BTCUSDT" interval="1m" onPriceUpdate={setCurrentPrice} />
        </div>
      </section>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 rounded-xl border border-nx-loss/40 bg-nx-loss/10 p-4 text-sm font-medium text-nx-loss shadow-lg flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-nx-loss animate-ping shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mt-8 relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Головні монети</h2>
        </div>
        <div className="grid grid-cols-[1fr_auto] pb-3 text-xs uppercase tracking-wider font-bold text-app-muted/40 border-b border-app-border/5">
          <span>Назва</span>
          <span className="pr-1">Ціна / Зміна</span>
        </div>
        <div className="pt-2">
          {MARKETS.map((market) => (
            <MarketRow key={market.symbol} market={market} />
          ))}
        </div>
      </section>

      <section className="mt-8 relative z-10">
        {shouldShowTimer && (
          <div className="mb-4 text-center text-sm font-bold text-app-muted/60 bg-app-panel py-2 rounded-xl border border-app-border/5">
            Очікування наступної сесії {isTomorrow ? '(завтра)' : ''}: <span className="text-nx-blue">{formatDuration(remainingMs)}</span>
          </div>
        )}
        {(globalSession?.is_locked && !user?.has_signals_access) && !Boolean(activeTrade) ? (
          <div className="flex w-full flex-col items-center justify-center rounded-2xl px-5 py-6 bg-app-panel shadow-lg border border-app-border/10">
            <Lock size={32} className="text-nx-loss mb-3" />
            <h3 className="text-lg font-bold text-app-text mb-1">🔒 VIP Signal at 20:00 is Locked</h3>
            <p className="text-sm text-app-muted/60 text-center mb-5 max-w-[280px]">
              Invite at least 1 friend to permanently unlock the 20:00 trading session!
            </p>
            <button
              onClick={() => navigate('/app/recommend')}
              className="px-6 py-2.5 rounded-xl font-bold bg-nx-lime text-black shadow-[0_0_20px_rgba(204,255,0,0.15)] hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all active:scale-95"
            >
              Get Invite Link
            </button>
          </div>
        ) : (
          <>
            {Boolean(activeTrade) && (
              <div className="mb-2 text-center text-sm font-bold text-nx-blue animate-pulse">
                Залишилось часу: {formatDuration(remainingMs)}
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={Boolean(activeTrade) ? () => refreshStatus() : handleDelegate}
              disabled={submitting || checking || (!Boolean(activeTrade) && !globalSession?.is_active) || (Boolean(activeTrade) && remainingMs > 0) || hasTradedThisSession}
              className={`flex h-16 w-full flex-col items-center justify-center rounded-2xl px-5 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-app-border/10 ${
                Boolean(activeTrade) || hasTradedThisSession ? 'bg-app-panel text-app-text hover:bg-white/5' : 'bg-gradient-to-br from-[#E2FF46] to-[#A3CC00] text-black shadow-[0_0_30px_rgba(204,255,0,0.2)] hover:shadow-[0_0_40px_rgba(204,255,0,0.4)]'
              }`}
            >
              <span className="text-lg font-black tracking-wide uppercase flex items-center gap-2">
                {Boolean(activeTrade) ? <RefreshCw size={20} className={checking || remainingMs > 0 ? 'animate-spin' : ''} /> : (hasTradedThisSession ? <Zap size={22} className="text-nx-gain" /> : <Zap size={22} />)}
                {submitting
                  ? "Створення..."
                  : checking
                    ? "Оновлення..."
                    : Boolean(activeTrade)
                      ? (remainingMs > 0 ? "В процесі..." : "Перевірити статус")
                      : hasTradedThisSession
                        ? "Сигнал успішно використано"
                        : (!globalSession?.is_active ? "Сесія закрита" : "Делегувати торгівлю ШІ")}
              </span>
              {!Boolean(activeTrade) && globalSession?.is_active && (
                <span className="text-[11px] font-bold opacity-70 uppercase tracking-widest mt-0.5">Сума інвестиції: 2% балансу</span>
              )}
            </motion.button>
          </>
        )}
      </section>

    </div>
  );
}
