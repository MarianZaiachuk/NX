import { useState, useEffect } from "react";
import { X, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getTransactionHistory } from "../lib/api";
import { asMoney } from "../lib/format";

export default function HistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getTransactionHistory()
        .then(data => setHistory(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed": return "text-nx-gain";
      case "pending": return "text-nx-blue";
      case "failed": return "text-nx-loss";
      default: return "text-app-muted";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full sm:max-w-md bg-[#131317] rounded-t-3xl sm:rounded-2xl p-5 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Історія транзакцій</h2>
              <button onClick={onClose} className="p-2 text-app-muted hover:text-app-text hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-[300px] pb-6 space-y-4 pr-1 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-nx-lime"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 text-app-muted">
                  Немає транзакцій
                </div>
              ) : (
                history.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-app-panel border border-app-border/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-nx-gain/10 text-nx-gain' : 'bg-nx-loss/10 text-nx-loss'}`}>
                        {tx.type === 'deposit' ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}
                      </div>
                      <div>
                        <div className="font-semibold">{tx.type === 'deposit' ? 'Депозит' : 'Вивід'}</div>
                        <div className="text-xs text-app-muted/60">{formatDate(tx.created_at)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${tx.type === 'deposit' ? 'text-nx-gain' : 'text-nx-loss'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{asMoney(tx.amount)}
                      </div>
                      <div className={`text-xs ${getStatusColor(tx.status)}`}>{tx.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
