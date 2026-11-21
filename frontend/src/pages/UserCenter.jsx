import { useState } from "react";
import { ChevronLeft, Copy, Headphones, X, Eye, EyeOff, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { bindPhone, changePassword, changeFundPassword } from "../lib/api";

export default function UserCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "Особисті дані");

  const getKycStatusText = (status) => {
    if (status === "Verified") return <span className="text-nx-gain">Підтверджено</span>;
    if (status === "Pending") return <span className="text-yellow-500">На перевірці</span>;
    if (status === "Rejected") return <span className="text-nx-loss">Відхилено</span>;
    return <span className="text-nx-loss">Не підтверджено</span>;
  };

  const [modalType, setModalType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form states
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [oldFundPassword, setOldFundPassword] = useState("");
  const [newFundPassword, setNewFundPassword] = useState("");
  
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showOldFund, setShowOldFund] = useState(false);
  const [showNewFund, setShowNewFund] = useState(false);

  const inviteLink = `${window.location.origin}/register?ref=${user?.referral_code || ""}`;
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const closeModal = () => {
    setModalType(null);
    setError("");
    setSuccess("");
    setPhone("");
    setOldPassword("");
    setNewPassword("");
    setOldFundPassword("");
    setNewFundPassword("");
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await bindPhone(phone);
      await fetchUser();
      setSuccess("Телефон успішно прив'язано!");
      setTimeout(closeModal, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess("Пароль успішно змінено!");
      setTimeout(closeModal, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFundPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await changeFundPassword(oldFundPassword, newFundPassword);
      setSuccess("Пін-код успішно змінено!");
      setTimeout(closeModal, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative z-10 w-full min-h-screen bg-[#0E0E12] text-app-text">
      {/* Header */}
      <div className="safe-top flex h-14 items-center justify-between px-4 mt-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-center absolute left-0 right-0 pointer-events-none">Центр користувачів</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-white/5 transition-colors">
          <Headphones size={22} className="text-app-text/80" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center mt-4 mb-6">
        <div className="w-24 h-24 rounded-full bg-nx-lime/10 overflow-hidden flex items-center justify-center border-2 border-nx-lime/20 mb-3 shadow-[0_0_20px_rgba(204,255,0,0.1)]">
          <User size={48} className="text-nx-lime" />
        </div>
        <h2 className="text-xl font-bold">{user?.display_name || "Користувач"}</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-app-border/10 px-2">
        {["Особисті дані", "Налаштування безпеки"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-3 text-center text-sm font-semibold relative transition-colors ${activeTab === tab ? "text-app-text" : "text-app-text/40 hover:text-app-text/60"}`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-white rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-20">
        {activeTab === "Особисті дані" && (
          <div className="space-y-6">
            <ListItem label="Повне ім'я" value={user?.display_name || "Marian-Oleksii"} />
            <ListItem 
              label="UID" 
              value={user?.uid || "--------"} 
              isCopyable 
              onCopy={() => handleCopy(user?.uid || "")} 
            />
            <ListItem 
              label="Реферальний код" 
              value={user?.referral_code || "Немає"} 
              isCopyable 
              onCopy={() => handleCopy(user?.referral_code || "")} 
            />
            <ListItem 
              label="Посилання на запрошення" 
              value={inviteLink}
              isCopyable 
              onCopy={() => handleCopy(inviteLink)} 
              truncate
            />
            <ListItem 
              label="Номер телефону" 
              value={user?.phone || "Перейти до прив'язки"} 
              showArrow={!user?.phone} 
              onClick={() => !user?.phone && setModalType('phone')}
            />
            <ListItem label="Електронна пошта" value={user?.email || "Не вказано"} />
            <ListItem 
              label="Початкова верифікація" 
              value={getKycStatusText(user?.status)} 
              showArrow 
              onClick={() => navigate("/kyc")}
            />
          </div>
        )}

        {activeTab === "Налаштування безпеки" && (
          <div className="space-y-6">
            <ListItem label="Змінити пароль для входу" value="******" showArrow onClick={() => setModalType('password')} />
            <ListItem label="Змінити пін-код для коштів" value="******" showArrow onClick={() => setModalType('fundPassword')} />
            <ListItem 
              label="Підтвердження телефону" 
              value={user?.phone ? <span className="text-nx-gain">Прив'язано</span> : <span className="text-nx-loss">Не прив'язано</span>} 
              showArrow={!user?.phone} 
              onClick={() => !user?.phone && setModalType('phone')}
            />
            <ListItem label="Підтвердження email" value={<span className="text-nx-gain">Прив'язано</span>} />
          </div>
        )}

      </div>

      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full sm:max-w-md bg-[#131317] rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-app-text/60 hover:text-app-text hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold mb-6 text-center">
                {modalType === 'phone' && "Прив'язка телефону"}
                {modalType === 'password' && "Зміна пароля"}
                {modalType === 'fundPassword' && "Зміна пін-коду"}
              </h2>

              <form 
                onSubmit={
                  modalType === 'phone' ? handlePhoneSubmit :
                  modalType === 'password' ? handlePasswordSubmit :
                  handleFundPasswordSubmit
                } 
                className="flex flex-col gap-4"
              >
                {modalType === 'phone' && (
                  <div>
                    <label className="block text-sm font-medium text-app-muted/60 mb-1">Номер телефону</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+380..." 
                      className="w-full bg-[#1A1A24] border border-app-border/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-nx-lime/50 transition-colors"
                      required
                    />
                  </div>
                )}

                {modalType === 'password' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-medium text-app-muted/60 mb-1">Старий пароль</label>
                      <input 
                        type={showOldPass ? "text" : "password"} 
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full bg-[#1A1A24] border border-app-border/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-nx-lime/50 transition-colors"
                        required
                      />
                      <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-4 top-[38px] text-app-text/40 hover:text-app-text transition-colors">
                        {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-app-muted/60 mb-1">Новий пароль</label>
                      <input 
                        type={showNewPass ? "text" : "password"} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#1A1A24] border border-app-border/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-nx-lime/50 transition-colors"
                        required
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-[38px] text-app-text/40 hover:text-app-text transition-colors">
                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </>
                )}

                {modalType === 'fundPassword' && (
                  <>
                    <div className="relative">
                      <label className="block text-sm font-medium text-app-muted/60 mb-1">Старий пін-код</label>
                      <input 
                        type={showOldFund ? "text" : "password"} 
                        value={oldFundPassword}
                        onChange={(e) => setOldFundPassword(e.target.value)}
                        maxLength={6}
                        className="w-full bg-[#1A1A24] border border-app-border/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-nx-lime/50 transition-colors tracking-widest text-lg font-mono"
                        required
                      />
                      <button type="button" onClick={() => setShowOldFund(!showOldFund)} className="absolute right-4 top-[38px] text-app-text/40 hover:text-app-text transition-colors">
                        {showOldFund ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-app-muted/60 mb-1">Новий пін-код (6 цифр)</label>
                      <input 
                        type={showNewFund ? "text" : "password"} 
                        value={newFundPassword}
                        onChange={(e) => setNewFundPassword(e.target.value)}
                        maxLength={6}
                        className="w-full bg-[#1A1A24] border border-app-border/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-nx-lime/50 transition-colors tracking-widest text-lg font-mono"
                        required
                      />
                      <button type="button" onClick={() => setShowNewFund(!showNewFund)} className="absolute right-4 top-[38px] text-app-text/40 hover:text-app-text transition-colors">
                        {showNewFund ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </>
                )}

                {error && <div className="p-3 rounded-lg bg-nx-loss/10 border border-nx-loss/20 text-nx-loss text-sm">{error}</div>}
                {success && <div className="p-3 rounded-lg bg-nx-gain/10 border border-nx-gain/20 text-nx-gain text-sm">{success}</div>}
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="mt-2 w-full py-3.5 rounded-xl bg-nx-lime text-black font-bold text-[15px] hover:bg-opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.15)]"
                >
                  {loading ? "Зачекайте..." : "Підтвердити"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ListItem({ label, value, showArrow, isCopyable, onCopy, truncate, onClick }) {
  return (
    <div 
      className={`flex items-center justify-between ${onClick ? 'cursor-pointer active:opacity-70 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <span className="text-sm font-medium text-app-text/90">{label}</span>
      <div className="flex items-center gap-2 max-w-[50%]">
        <div className={`text-sm text-app-text/70 ${truncate ? "truncate block" : ""}`}>
          {value}
        </div>
        {isCopyable && (
          <button onClick={onCopy} className="text-app-text/40 hover:text-app-text transition-colors shrink-0">
            <Copy size={14} />
          </button>
        )}
        {showArrow && (
          <ChevronLeft size={16} className="text-app-text/40 rotate-180 shrink-0" />
        )}
      </div>
    </div>
  );
}
