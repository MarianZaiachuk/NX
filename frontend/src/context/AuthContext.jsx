import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/me/state`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 401) {
        // Only log out if token is specifically invalid
        setToken(null);
      }
      // If res.status is 502, 500, etc., we just leave the token alone.
    } catch (err) {
      console.error("Network error fetching user:", err);
      // DO NOT setToken(null) on network errors (e.g., when backend is restarting)
      // Otherwise users get logged out randomly.
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.access_token);
      return true;
    }
    throw new Error(data.detail || 'Login failed');
  };

  const register = async (displayName, email, password, fundPassword, code, referralCode) => {
    const res = await fetch(`/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        display_name: displayName, 
        email, 
        password, 
        fund_password: fundPassword,
        code,
        referral_code: referralCode 
      })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.access_token);
      return true;
    }
    throw new Error(data.detail || 'Registration failed');
  };

  const sendCode = async (email) => {
    const res = await fetch(`/api/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) return true;
    throw new Error(data.detail || 'Failed to send code');
  };

  const logout = () => {
    setToken(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, fetchUser, sendCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
