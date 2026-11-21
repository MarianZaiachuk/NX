import { useEffect, useState } from "react";
import { Gift, Sparkles } from "lucide-react";
import { getReferralStats } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Recommend() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleStartPromo = () => {
    const inviteLink = `${window.location.origin}/register?ref=${user?.referral_code || "32196215"}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    getReferralStats().then(setStats).catch(console.error);
  }, []);

  const getLevelData = (level) => {
    if (!stats) return [];
    if (level === 1) return stats.level_1 || [];
    if (level === 2) return stats.level_2 || [];
    if (level === 3) return stats.level_3 || [];
    return [];
  };

  const currentLevelData = getLevelData(activeTab);

  return (
    <div className="flex flex-col h-full bg-transparent text-app-text overflow-y-auto pb-40 relative hide-scrollbar -mx-5 px-5">
      {/* Header section */}
      <div className="px-5 pt-6 pb-8 relative overflow-hidden shrink-0">
        <h1 className="text-2xl font-bold mb-2 pr-20 leading-tight">Запросіть друзів —<br/>заробляйте разом</h1>
        <p className="text-sm text-app-text/70 max-w-[200px] mb-4">Поповніть зараз і миттєво отримайте комісію</p>
        
        {stats?.agent_level > 0 && (
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-nx-lime/20 to-transparent border border-nx-lime/30 text-nx-lime px-4 py-2 rounded-xl backdrop-blur-sm">
            <Sparkles size={18} className="animate-pulse" />
            <span className="text-sm font-bold tracking-wide">АГЕНТ {stats.agent_level} РІВНЯ</span>
          </div>
        )}
        
        {/* Gift Icon Graphic */}
        <div className="absolute right-4 top-4 opacity-90 pointer-events-none flex items-center justify-center">
          <Gift size={64} strokeWidth={1} className="text-app-text relative z-10" />
          <Sparkles size={32} strokeWidth={1} className="text-nx-lime absolute -top-2 -right-2 z-0" />
          <Sparkles size={20} strokeWidth={1} className="text-app-text absolute bottom-0 -left-4 z-0" />
        </div>
      </div>

      {/* Summary section */}
      <div className="px-5 mb-8 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col items-center text-center">
            <div className="text-[13px] text-app-text/70 mb-2">Мої реферали (усього)</div>
            <div className="text-xl font-bold text-nx-gain">{stats?.total_referrals || 0}</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-[13px] text-app-text/70 mb-2">Загальна сума поповнень</div>
            <div className="text-xl font-bold text-nx-gain">{stats?.total_deposit_sum || "0.00"}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center border-b border-app-border/10 pb-6">
          <div>
            <div className="text-[12px] text-app-text/70 mb-2 leading-tight">Кількість рефералів<br/>1 рівня</div>
            <div className="text-lg font-bold">{stats?.level_1?.length || 0}</div>
          </div>
          <div>
            <div className="text-[12px] text-app-text/70 mb-2 leading-tight">Кількість рефералів<br/>2 рівня</div>
            <div className="text-lg font-bold">{stats?.level_2?.length || 0}</div>
          </div>
          <div>
            <div className="text-[12px] text-app-text/70 mb-2 leading-tight">Кількість рефералів<br/>3 рівня</div>
            <div className="text-lg font-bold">{stats?.level_3?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="px-5 flex-1 shrink-0">
        <h2 className="text-xl font-bold mb-6">Мої реферали</h2>
        
        {/* Tabs */}
        <div className="flex gap-6 border-b border-app-border/10 mb-4">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() => setActiveTab(level)}
              className={`pb-2 text-[15px] font-medium relative transition-colors ${activeTab === level ? "text-app-text" : "text-app-text/40"}`}
            >
              {level} рівень
              {activeTab === level && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Table Area */}
        <div className="bg-[#1c1c1e] rounded-[18px] p-5 min-h-[220px]">
          <div className="grid grid-cols-3 gap-2 text-[13px] text-app-text/70 mb-5">
            <div>Ім'я<br/>користувача</div>
            <div className="text-center">Загальна<br/>кількість</div>
            <div className="text-right">Загальна сума<br/>поповнень</div>
          </div>

          {currentLevelData.length > 0 ? (
            <div className="space-y-4">
              {currentLevelData.map((user, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 text-[14px] items-center">
                  <div className="text-app-text/90 truncate pr-2">{user.email_masked}</div>
                  <div className="text-center text-app-text/90">{user.total_referrals}</div>
                  <div className="text-right text-app-text/90">{user.total_deposit}</div>
                </div>
              ))}
              <div className="text-center text-[13px] text-app-text/40 pt-4 pb-1">Більше немає</div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-[14px] text-app-text/40">
              Рефералів немає
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom button */}
      <div 
        className="fixed left-0 right-0 px-5 flex justify-center z-20 pointer-events-none"
        style={{ bottom: 'calc(90px + env(safe-area-inset-bottom))' }}
      >
        <div className="w-full max-w-[430px] pointer-events-auto">
          <button 
            onClick={handleStartPromo}
            className="w-full py-4 bg-white text-black font-bold text-[16px] rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
          >
            {copied ? "Посилання скопійовано!" : "Розпочати промо зараз"}
          </button>
        </div>
      </div>
    </div>
  );
}
