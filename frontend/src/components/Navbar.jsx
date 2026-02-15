import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { HiOutlineViewGrid, HiOutlineLogout } from 'react-icons/hi';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-neutral-200/40" style={{ backgroundColor: 'rgba(247,239,232,0.85)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
              LinkVault
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="v-btn-ghost flex items-center gap-1.5 text-[13px]"
                >
                  <HiOutlineViewGrid className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <div className="hidden sm:flex items-center gap-2 mx-1 px-2.5 py-1 rounded-md bg-neutral-50 border border-neutral-100">
                  <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center text-[9px] font-bold text-white">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-[12px] text-neutral-500 font-medium">{user?.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="v-btn-ghost flex items-center gap-1.5 text-[13px] text-neutral-400 hover:text-neutral-900"
                >
                  <HiOutlineLogout className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="v-btn-ghost text-[13px]">
                  Sign In
                </Link>
                <Link to="/register" className="v-btn text-[13px] !py-1.5 !px-3.5">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
