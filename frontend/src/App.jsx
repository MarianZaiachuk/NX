import { BrowserRouter, HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IS_DEMO_MODE, resetDemoState } from './lib/demoBackend';
import Login from './pages/Login';
import Register from './pages/Register';
import TradingTerminal from './components/TradingTerminal';

import Layout from './components/Layout';
import Home from './pages/Home';
import Discovery from './pages/Discovery';
import Recommend from './pages/Recommend';
import Assets from './pages/Assets';
import Kyc from './pages/Kyc';
import UserCenter from './pages/UserCenter';

import ProtectedRouteAdmin from './components/ProtectedRouteAdmin';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-app-bg flex items-center justify-center text-nx-lime">Loading...</div>;
  if (!token) return <Navigate to="/" />;
  return children;
}

function DemoBanner() {
  if (!IS_DEMO_MODE) return null;

  const handleReset = () => {
    resetDemoState();
    window.location.hash = '#/app/trade';
    window.location.reload();
  };

  return (
    <div className="w-full bg-nx-lime/15 border-b border-nx-lime/30 text-app-text px-3 py-1.5 text-xs flex flex-wrap items-center justify-center gap-3 z-50 relative">
      <span className="font-medium text-nx-lime">
        Demo mode (local mock API, virtual balances)
      </span>
      <Link
        to="/admin"
        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors font-semibold"
      >
        Admin
      </Link>
      <button
        type="button"
        onClick={handleReset}
        className="px-2 py-0.5 rounded bg-nx-lime text-black font-bold hover:brightness-110 transition-all"
      >
        Reset Demo
      </button>
    </div>
  );
}

export default function App() {
  const Router = IS_DEMO_MODE ? HashRouter : BrowserRouter;

  return (
    <Router>
      <AuthProvider>
        <DemoBanner />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/app" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="trade" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="trade" element={<TradingTerminal />} />
            <Route path="recommend" element={<Recommend />} />
            <Route path="assets" element={<Assets />} />
          </Route>
          <Route path="/kyc" element={
            <ProtectedRoute>
              <main className="min-h-screen bg-app-bg text-app-text selection:bg-nx-lime/30">
                <div 
                  className="mx-auto min-h-screen flex flex-col w-full max-w-[430px] overflow-hidden bg-app-bg px-5 relative pb-[env(safe-area-inset-bottom)]"
                  style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}
                >
                  <Kyc />
                </div>
              </main>
            </ProtectedRoute>
          } />
          <Route path="/user-center" element={
            <ProtectedRoute>
              <main className="min-h-screen bg-app-bg text-app-text selection:bg-nx-lime/30">
                <div 
                  className="mx-auto min-h-screen flex flex-col w-full max-w-[430px] overflow-hidden bg-app-bg relative pb-[env(safe-area-inset-bottom)]"
                  style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}
                >
                  <UserCenter />
                </div>
              </main>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRouteAdmin>
              <Admin />
            </ProtectedRouteAdmin>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
