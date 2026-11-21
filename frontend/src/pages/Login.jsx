import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { IS_DEMO_MODE } from '../lib/demoBackend';

export default function Login() {
  const [email, setEmail] = useState(IS_DEMO_MODE ? 'demo@nx-sim.local' : '');
  const [password, setPassword] = useState(IS_DEMO_MODE ? 'demo1234' : '');
  const [error, setError] = useState('');
  const { login, token } = useAuth();
  const navigate = useNavigate();

  if (token) {
    return <Navigate to="/app" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDemoEnter = async () => {
    try {
      await login('demo@nx-sim.local', 'demo1234');
      navigate('/app/trade');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nx-blue/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nx-lime/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-nx-darkSurface/80 backdrop-blur-xl border border-nx-darkPanel p-8 rounded-2xl shadow-glow relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-app-border/10 bg-white flex items-center justify-center p-2">
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="NX" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-app-text tracking-tight">Welcome Back</h2>
          <p className="text-app-muted/60 mt-2 text-sm">Enter your credentials to continue trading.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-nx-loss/10 border border-nx-loss/20 text-nx-loss rounded-lg text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-app-muted/60 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-nx-darkPanel border border-app-border/10 text-app-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-nx-lime/50 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-app-muted/60 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-nx-darkPanel border border-app-border/10 text-app-text rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-nx-lime/50 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-nx-lime text-black font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-shadow"
          >
            Sign In
          </motion.button>

          {IS_DEMO_MODE && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleDemoEnter}
              className="w-full bg-white/10 border border-nx-lime/40 text-nx-lime font-bold py-3 px-4 rounded-xl hover:bg-nx-lime/15 transition-colors"
            >
              Try Demo Account
            </motion.button>
          )}
        </form>

        <p className="mt-6 text-center text-app-muted/60 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-nx-lime hover:underline font-medium">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
