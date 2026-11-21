import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, Copy, Globe, Wallet, Zap, ArrowRightLeft, 
  FileText, CalendarDays, Megaphone, ShieldCheck, UserCheck, Info, User
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function SideMenu({ isOpen, onClose, onOpenTransferModal, onShowAlert }) {
  const { user, logout, fetchUser } = useAuth();
  const navigate = useNavigate();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "tween", duration: 0.3 }}
          className="fixed inset-y-0 inset-x-0 mx-auto w-full max-w-[430px] z-[100] bg-app-bg text-app-text overflow-y-auto overscroll-none"
        >
          {/* Header */}
          <div className="flex items-center p-5 pt-12">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/5">
              <ChevronLeft size={28} />
            </button>
          </div>

          {/* User Profile */}
          <div className="px-5 mb-8">
            <div 
              onClick={() => { onClose(); navigate("/user-center"); }}
              className="flex items-center gap-4 bg-app-panel border border-app-border/5 p-4 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-nx-lime/10 overflow-hidden flex items-center justify-center shrink-0 border border-nx-lime/20">
                 <User size={28} className="text-nx-lime" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-app-text truncate">{user?.display_name || "Користувач"}</div>
                <div 
                  className="flex items-center gap-2 text-sm text-app-muted/60 mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>UID: {user?.uid || "32196215"}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user?.uid || "32196215");
                      if (onShowAlert) onShowAlert('success', 'UID скопійовано!');
                    }}
                    className="hover:text-app-text transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <ChevronRight size={20} className="text-app-muted/60" />
            </div>
          </div>

          {/* Sections */}
          <div className="px-5 space-y-8 pb-32">
            {/* Звичайні функції */}
            <div>
              <h3 className="text-base font-bold text-app-text mb-4">Звичайні функції</h3>
              <div className="grid grid-cols-4 gap-4">
                <MenuItem icon={Globe} label="Українська" />
                <MenuItem 
                  icon={Wallet} 
                  label="Управління активами" 
                  onClick={() => {
                    onClose();
                    navigate("/app/assets");
                  }} 
                />
                <MenuItem 
                  icon={Zap} 
                  label="Миттєвий обмін" 
                  onClick={async () => {
                    onClose();
                    const spot = parseFloat(user?.spot_balance || 0);
                    if (spot <= 0) {
                      if (onShowAlert) onShowAlert('error', "На Spot балансі немає коштів для обміну!");
                      return;
                    }
                    try {
                      const { transferWallet } = await import("../lib/api");
                      await transferWallet(spot, "Spot", "Funds");
                      if (fetchUser) await fetchUser();
                      if (onShowAlert) onShowAlert('success', "Успішно перенесено всі кошти з Spot в Funds!");
                    } catch (err) {
                      if (onShowAlert) onShowAlert('error', "Помилка: " + err.message);
                    }
                  }}
                />
                <MenuItem 
                  icon={ArrowRightLeft} 
                  label="Гаманець для торгівлі..." 
                  onClick={() => {
                    onClose();
                    if (onOpenTransferModal) onOpenTransferModal();
                  }}
                />
              </div>
            </div>

            {/* Ринок */}
            <div>
              <h3 className="text-base font-bold text-app-text mb-4">Ринок</h3>
              <div className="grid grid-cols-4 gap-4">
                <MenuItem 
                  icon={FileText} 
                  label="Вічний контракт" 
                  onClick={() => {
                    onClose();
                    navigate("/app/trade");
                  }} 
                />
                <MenuItem 
                  icon={CalendarDays} 
                  label="Ф'ючерсний контракт" 
                  onClick={() => {
                    onClose();
                    navigate("/app/trade");
                  }} 
                />
              </div>
            </div>

            {/* Інше */}
            <div>
              <h3 className="text-base font-bold text-app-text mb-4">Інше</h3>
              <div className="grid grid-cols-4 gap-4">
                <MenuItem 
                  icon={Megaphone} 
                  label="Оголошення" 
                  onClick={() => {
                    onClose();
                    navigate("/app/discovery");
                  }} 
                />
                <MenuItem 
                  icon={ShieldCheck} 
                  label="Центр безпеки" 
                  onClick={() => {
                    onClose();
                    navigate("/user-center", { state: { tab: "Налаштування безпеки" } });
                  }} 
                />
                <MenuItem 
                  icon={UserCheck} 
                  label="KYC" 
                  onClick={() => {
                    onClose();
                    navigate("/kyc");
                  }} 
                />
              </div>
            </div>

            {/* Про нас */}
            <button className="w-full flex items-center justify-between p-4 bg-app-panel border border-app-border/5 rounded-2xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Info size={20} className="text-app-muted/80" />
                <span className="font-bold text-app-text">Про нас</span>
              </div>
              <ChevronRight size={20} className="text-app-muted/60" />
            </button>

            {/* Вийти */}
            <button 
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-4 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors mt-8 shadow-lg"
            >
              Вийти
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-app-muted/80 group-hover:bg-white/5 group-hover:text-app-text transition-all">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <span className="text-[11px] font-medium text-center leading-tight text-app-muted/80 group-hover:text-app-text transition-colors">
        {label}
      </span>
    </button>
  );
}
