import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) return toast.error('Enter your username.');
    if (!password) return toast.error('Enter your password.');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.username}`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-5 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-xs"
      >
        <div className="v-auth-card">
          <div className="text-center mb-6">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center mx-auto mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-neutral-900">Welcome back</h1>
            <p className="text-[13px] text-neutral-400 mt-0.5">Sign in with your credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="v-input w-full"
                placeholder="Your username"
                autoFocus
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="v-input w-full"
                placeholder="Your password"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="v-btn w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-[12px] text-neutral-400 mt-5">
            No account?{' '}
            <Link to="/register" className="text-neutral-900 font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
