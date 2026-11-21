import { useState, useEffect } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Receipt, RefreshCcw, Wallet, X, ArrowDownUp } from "lucide-react";
import { getUserState, transferWallet } from "../lib/api";
import { asMoney, numeric } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import TransferModal from "../components/TransferModal";
import HistoryModal from "../components/HistoryModal";
import DepositModal from "../components/DepositModal";
import WithdrawModal from "../components/WithdrawModal";

export default function Assets() {
  const { fetchUser } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [spotBalance, setSpotBalance] = useState(0);
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const loadData = () => {
    getUserState().then(data => {
      setBalance(numeric(data.balance));
      setSpotBalance(numeric(data.spot_balance || 0));
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update loadData when transfer completes so the balances stay synced!
  useEffect(() => {
    if (!isTransferModalOpen) {
      loadData();
    }
  }, [isTransferModalOpen]);

  const actionButton = (icon, label, onClick) => (
    <button className="flex flex-col items-center gap-2 group" onClick={onClick}>
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-app-text group-hover:bg-white/10 transition-colors border border-app-border/5">
        {icon}
      </div>
      <span className="text-xs font-semibold text-app-muted/60">{label}</span>
    </button>
  );

  return (
    <div className="py-4 flex flex-col h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Wallet className="text-nx-lime" /> Активи
      </h1>

      <div className="mb-8">
        <div className="text-sm font-semibold text-app-muted/60 mb-1">Загальний баланс (Funds)</div>
        <div className="text-4xl font-black">{asMoney(balance)} <span className="text-xl text-app-muted/40">USD</span></div>
      </div>

      <div className="flex justify-between px-2 mb-8">
        {actionButton(<ArrowDownToLine size={20} />, "Депозит", () => setIsDepositModalOpen(true))}
        {actionButton(<ArrowUpFromLine size={20} />, "Вивід", () => setIsWithdrawModalOpen(true))}
        {actionButton(<RefreshCcw size={20} />, "Обмін", () => setIsTransferModalOpen(true))}
        {actionButton(<Receipt size={20} />, "Рахунок", () => setIsHistoryModalOpen(true))}
      </div>

      <div className="space-y-3">
        {[
          { name: "Funds", amount: balance, color: "bg-nx-lime" },
          { name: "Spot", amount: spotBalance, color: "bg-nx-blue" },
          { name: "Futures", amount: 0, color: "bg-nx-gain" },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-app-panel border border-app-border/5">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="font-semibold">{item.name}</span>
            </div>
            <span className="font-bold">{asMoney(item.amount)}</span>
          </div>
        ))}
      </div>

      <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} />
      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
    </div>
  );
}
