import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRouteAdmin({ children }) {
  const { user, token, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-app-bg flex items-center justify-center text-nx-lime">Loading...</div>;
  if (!token) return <Navigate to="/" />;
  
  if (!user || !user.is_admin) {
    // If not an admin, redirect to app or show 403
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center text-app-text">
        <h1 className="text-4xl font-bold mb-4 text-red-500">403</h1>
        <p className="text-xl">Access Denied. Admin privileges required.</p>
        <button 
          onClick={() => window.location.href = '/app'}
          className="mt-6 px-4 py-2 bg-nx-lime text-black rounded hover:bg-opacity-80 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
}
