import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, Navigate, useSearchParams } from 'react-router-dom';
import { Mail, Key, User, Shield, Lock, Send, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fundPassword, setFundPassword] = useState('');
  
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showFundPassword, setShowFundPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, sendCode, token } = useAuth();
  const navigate = useNavigate();

  if (token) {
    return <Navigate to="/app" />;
  }

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendCode(email);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }
    
    if (!/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&_]{8,}$/.test(password)) {
      setError("Пароль має містити щонайменше 8 символів, 1 велику літеру та 1 цифру");
      return;
    }

    if (fundPassword.length < 6 || !/^\d+$/.test(fundPassword)) {
      setError("Пароль фінансування має складатися щонайменше з 6 цифр");
      return;
    }
    
    setLoading(true);
    try {
      await register(displayName, email, password, fundPassword, code, referralCode);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-nx-lime/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-nx-blue/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-nx-darkSurface/80 backdrop-blur-xl border border-nx-darkPanel p-8 rounded-2xl shadow-glow relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-app-border/10 bg-white flex items-center justify-center p-2">
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="NX" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-app-text tracking-tight">Створити акаунт</h2>
          <p className="text-app-muted/60 mt-2 text-sm">
            {step === 1 ? "Введіть email для отримання коду" : "Заповніть дані для реєстрації"}
          </p>
        </div>

        {error && <div className="mb-6 p-3 bg-nx-loss/10 border border-nx-loss/20 text-nx-loss rounded-lg text-sm text-center">{error}</div>}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendCode} 
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-app-muted/60 mb-1">Email адреса</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted/50" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-nx-darkPanel border border-app-border/10 text-app-text rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-nx-lime/50 transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-nx-blue text-app-text font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(56,130,246,0.3)] hover:shadow-[0_0_30px_rgba(56,130,246,0.5)] transition-shadow disabled:opacity-70"
              >
                {loading ? "Відправка..." : "Отримати код"}
                {!loading && <Send size={18} />}
              </motion.button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleRegister} 
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-app-muted/60 mb-1">Код з Email</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted/50" size={20} />
                  <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-nx-darkPanel border border-app-border/10 text-app-text rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-nx-lime/50 transition-all tracking-widest font-mono"
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-muted/60 mb-1">Ім'я користувача</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted/50" size={20} />
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-nx-darkPanel border border-app-border/10 text-app-text rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-nx-lime/50 transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-muted/60 mb-1">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted/50" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-nx-darkPanel border border-app-border/10 text-app-text rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-nx-lime/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted/50 hover:text-app-text"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-app-muted/50 mt-1">Мінімум 8 символів, 1 велика літера, 1 цифра</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-muted/60 mb-1">Повторіть пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted/50" size={20} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-nx-darkPanel border border-app-border/10 text-app-text rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-nx-lime/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted/50 hover:text-app-text"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-muted/60 mb-1">Пароль фінансування (від 6 цифр)</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted/50" size={20} />
                  <input 
                    type={showFundPassword ? "text" : "password"} 
                    value={fundPassword}
                    onChange={(e) => setFundPassword(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-nx-darkPanel border border-app-border/10 text-app-text rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-nx-lime/50 transition-all font-mono tracking-widest"
                    placeholder="••••••"
                    maxLength={12}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowFundPassword(!showFundPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted/50 hover:text-app-text"
                  >
                    {showFundPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-app-muted/50 mt-1">Потрібен для підтвердження виведення коштів</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-muted/60 mb-1">Реферальний код (Опціонально)</label>
                <input 
                  type="text" 
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full bg-nx-darkPanel border border-app-border/10 text-app-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-nx-lime/50 transition-all"
                  placeholder="Наприклад: 12345678"
                />
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-nx-lime text-black font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-shadow disabled:opacity-70 mt-4"
              >
                {loading ? "Створення..." : "Завершити реєстрацію"}
              </motion.button>
              
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-app-muted/50 hover:text-app-text transition-colors mt-2"
              >
                Назад до email
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-app-muted/60 text-sm">
          Вже маєте акаунт?{' '}
          <Link to="/" className="text-nx-blue hover:underline font-medium">Увійти</Link>
        </p>
      </motion.div>
    </div>
  );
}
