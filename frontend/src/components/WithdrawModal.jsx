import { useState } from 'react';
import { motion } from 'framer-motion';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { asMoney } from '../lib/format';

export default function WithdrawModal({ isOpen, onClose }) {
  const { user, fetchUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [fundPassword, setFundPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleWithdraw = async () => {
    setError('');
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount < 10) {
      setError('Мінімальна сума виводу 10 USDT');
      return;
    }
    if (!walletAddress) {
      setError('Введіть адресу гаманця');
      return;
    }
    if (!fundPassword) {
      setError('Введіть пароль фінансування');
      return;
    }

    setLoading(true);
    try {
      await request('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ 
          amount: withdrawAmount,
          wallet_address: walletAddress,
          fund_password: fundPassword
        })
      });
      setSuccess(true);
      fetchUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const withdrawAmountNum = parseFloat(amount) || 0;
  const totalDeposit = parseFloat(user?.total_deposit) || 0;
  const totalProfit = parseFloat(user?.today_profit) || 0;

  const feePercentage = (totalDeposit > 0 && totalProfit < totalDeposit) ? 0.20 : 0.05;
  const feeAmount = withdrawAmountNum * feePercentage;
  const receiveAmount = Math.max(0, withdrawAmountNum - feeAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-bg/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-app-panel border border-app-border/10 rounded-3xl w-full max-w-sm p-5 relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-app-muted hover:text-app-text">
          <span className="text-xl leading-none">&times;</span>
        </button>
        
        <h2 className="text-xl font-bold mb-6">Вивід коштів</h2>
        
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-nx-gain/20 text-nx-gain rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Заявка створена!</h3>
            <p className="text-sm text-app-text/60 mb-6">Ваша заявка на виведення передана на перевірку адміністратору.</p>
            <button 
              onClick={onClose} 
              className="w-full bg-white/10 hover:bg-white/20 text-app-text font-bold py-3 rounded-xl transition-colors"
            >
              Закрити
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {error && <div className="text-nx-loss text-sm text-center bg-nx-loss/10 p-2 rounded">{error}</div>}
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-app-muted/60 mb-1 block">Монета</label>
                <div className="w-full bg-app-bg border border-app-border/10 rounded-xl p-3 text-app-text font-bold">
                  USDT
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-app-muted/60 mb-1 block">Мережа</label>
                <div className="w-full bg-app-bg border border-app-border/10 rounded-xl p-3 text-app-text font-bold">
                  TRC20
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-app-muted/60 mb-1 block">Адреса гаманця отримувача</label>
              <input 
                type="text" 
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full bg-app-bg border border-app-border/10 rounded-xl p-3 outline-none text-app-text placeholder:text-app-text/20" 
                placeholder="Введіть адресу" 
              />
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-app-muted/60">Сума виводу</span>
                <span className="text-app-muted/60">Доступно: {asMoney(user?.spot_balance || 0)}</span>
              </div>
              <div className="flex items-center gap-2 bg-app-bg border border-app-border/10 rounded-xl p-2 px-3">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent w-full outline-none font-bold text-lg placeholder:text-app-text/20 text-app-text" 
                  placeholder="0.00" 
                />
                <button 
                  onClick={() => setAmount(user?.spot_balance || 0)}
                  className="text-xs text-nx-lime font-bold px-2 py-1 bg-nx-lime/10 rounded"
                >
                  MAX
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-app-muted/60 mb-1 block">Пароль фінансування</label>
              <input 
                type="password" 
                value={fundPassword}
                onChange={(e) => setFundPassword(e.target.value)}
                className="w-full bg-app-bg border border-app-border/10 rounded-xl p-3 outline-none text-app-text placeholder:text-app-text/20 font-mono tracking-widest" 
                placeholder="••••••" 
              />
            </div>
            
            <div className="bg-app-bg/50 border border-app-border/10 rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-app-muted/60">Комісія ({feePercentage * 100}%)</span>
                <span className="text-app-text font-bold">{asMoney(feeAmount)} USDT</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-app-border/5">
                <span className="text-app-muted">До отримання</span>
                <span className="text-nx-lime font-bold">{asMoney(receiveAmount)} USDT</span>
              </div>
              {feePercentage === 0.20 && (
                <div className="text-[10px] text-nx-loss mt-2 text-center">
                  Комісія 20%, оскільки ваш прибуток з сигналів ({asMoney(totalProfit)}) менший за сумарний депозит ({asMoney(totalDeposit)}).
                </div>
              )}
            </div>
            
            <button 
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full bg-nx-lime text-black py-3 rounded-xl font-bold hover:brightness-110 transition-all uppercase disabled:opacity-50 mt-2"
            >
              {loading ? "Обробка..." : "Підтвердити вивід"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
