import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { IS_DEMO_MODE } from '../lib/demoBackend';

export default function DepositModal({ isOpen, onClose }) {
  const { fetchUser } = useAuth();
  const [depositData, setDepositData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      request('/api/wallet/deposit-info')
        .then(data => {
          if (data.type === 'static') {
            setDepositData({
              pay_address: data.address,
              pay_currency: data.currency
            });
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setDepositData(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        
        <h2 className="text-xl font-bold mb-6">Депозит</h2>
        
        {error && <div className="mb-4 text-nx-loss text-sm text-center bg-nx-loss/10 p-2 rounded">{error}</div>}

        {loading ? (
          <div className="py-10 text-center text-app-muted/50 animate-pulse">
            Отримання адреси...
          </div>
        ) : !depositData ? (
          <div className="space-y-4 mb-6">
            <p className="text-center text-app-muted/60">Не вдалося завантажити адресу для поповнення.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6 text-center">
            <p className="text-sm text-app-text/80 mb-2">Надішліть будь-яку суму в <b>{depositData.pay_currency.toUpperCase()} (TRC20)</b> на цю адресу:</p>
            <div className="bg-white/5 p-4 rounded-xl border border-app-border/10 text-center">
                <div className="w-32 h-32 bg-white/10 mx-auto rounded-xl mb-3 flex items-center justify-center p-2 relative cursor-pointer"
                     onClick={() => {
                       navigator.clipboard.writeText(depositData.pay_address);
                       setCopied(true);
                       setTimeout(() => setCopied(false), 2000);
                     }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${depositData.pay_address}`} alt="QR Code" className="w-full h-full rounded-lg" />
                  {copied && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl text-nx-lime font-bold text-sm backdrop-blur-sm">Скопійовано!</div>}
                </div>
                <div className="text-xs text-app-muted/60 mb-1">Адреса поповнення (TRC20)</div>
                <div 
                  className="font-mono text-xs break-all text-nx-lime bg-nx-lime/10 p-2 rounded-lg cursor-pointer relative"
                  onClick={() => {
                    navigator.clipboard.writeText(depositData.pay_address);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {depositData.pay_address}
                </div>
                <p className="text-[10px] text-app-text/40 mt-2">Натисніть на QR або адресу, щоб скопіювати</p>
            </div>
            <button
              disabled={faucetLoading}
              onClick={async () => {
                if (IS_DEMO_MODE) {
                  setFaucetLoading(true);
                  try {
                    await request('/api/wallet/demo-faucet', { method: 'POST' });
                    if (fetchUser) await fetchUser();
                    onClose();
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setFaucetLoading(false);
                  }
                } else {
                  onClose();
                }
              }}
              className="w-full bg-nx-lime text-black py-3 rounded-xl font-bold hover:brightness-110 transition-all uppercase disabled:opacity-50"
            >
              {IS_DEMO_MODE
                ? (faucetLoading ? "Нарахування..." : "+100 Demo USDT")
                : "Я оплатив"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
