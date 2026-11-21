import { useState, useEffect } from "react";
import { X, ArrowDownUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { asMoney, numeric } from "../lib/format";
import { transferWallet, getUserState } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function TransferModal({ isOpen, onClose }) {
  const { fetchUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [spotBalance, setSpotBalance] = useState(0);

  const [transferFrom, setTransferFrom] = useState("Funds");
  const [transferTo, setTransferTo] = useState("Spot");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferError, setTransferError] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getUserState().then(data => {
        setBalance(numeric(data.balance));
        setSpotBalance(numeric(data.spot_balance || 0));
      }).catch(console.error);
    }
  }, [isOpen]);

  const handleSwapDirection = () => {
    setTransferFrom(transferTo);
    setTransferTo(transferFrom);
    setTransferAmount("");
    setTransferError("");
  };

  const handleMaxAmount = () => {
    const max = transferFrom === "Funds" ? balance : spotBalance;
    setTransferAmount(max.toString());
  };

  const handleTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferError("Некоректна сума");
      return;
    }
    const max = transferFrom === "Funds" ? balance : spotBalance;
    if (amt > max) {
      setTransferError("Недостатньо коштів");
      return;
    }

    setIsTransferring(true);
    setTransferError("");
    try {
      await transferWallet(amt, transferFrom, transferTo);
      // Update local balances so the UI doesn't lag if they leave it open
      const data = await getUserState();
      setBalance(numeric(data.balance));
      setSpotBalance(numeric(data.spot_balance || 0));
      if (fetchUser) await fetchUser(); // update global context
      onClose();
      setTransferAmount("");
    } catch (err) {
      setTransferError(err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-bg/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-app-panel border border-app-border/10 rounded-3xl w-full max-w-sm p-5 relative shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 text-app-muted hover:text-app-text"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold mb-6">Переказ між гаманцями</h2>
            
            <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 mb-4 border border-app-border/5 relative">
              <div className="flex-1">
                <div className="text-xs text-app-muted/60 mb-1">З гаманця</div>
                <div className="font-bold text-lg">{transferFrom}</div>
              </div>
              
              <button 
                onClick={handleSwapDirection}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-app-panel p-2 rounded-full border border-app-border/10 shadow-lg hover:bg-white/5"
              >
                <ArrowDownUp size={16} className="text-nx-lime" />
              </button>

              <div className="flex-1 text-right">
                <div className="text-xs text-app-muted/60 mb-1">На гаманець</div>
                <div className="font-bold text-lg">{transferTo}</div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-app-border/5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-app-muted/60">Сума переказу</span>
                <span className="text-app-muted/60">Доступно: {asMoney(transferFrom === "Funds" ? balance : spotBalance)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={transferAmount}
                  onChange={(e) => { setTransferAmount(e.target.value); setTransferError(""); }}
                  placeholder="0.00"
                  className="bg-transparent text-app-text text-2xl font-bold w-full outline-none placeholder:text-app-text/20"
                />
                <button 
                  onClick={handleMaxAmount}
                  className="text-xs font-bold bg-nx-lime/20 text-nx-lime px-2 py-1 rounded uppercase"
                >
                  Max
                </button>
              </div>
              {transferError && <div className="text-nx-loss text-xs font-semibold mt-2">{transferError}</div>}
            </div>

            <button 
              onClick={handleTransfer}
              disabled={isTransferring || !transferAmount}
              className="w-full bg-nx-lime text-black py-4 rounded-xl font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTransferring ? "Переказ..." : "Підтвердити переказ"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
