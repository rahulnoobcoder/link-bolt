import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ParticleField from './components/ParticleField';
import HomePage from './pages/HomePage';
import ViewPage from './pages/ViewPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

export default function App() {
  return (
    <div className="relative min-h-screen flex flex-col text-neutral-900" style={{ backgroundColor: '#F7EFE8' }}>
      <ParticleField />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#171717',
            border: '1px solid #e5e5e5',
            borderRadius: '10px',
            fontSize: '13px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          },
          success: {
            iconTheme: { primary: '#171717', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />
      <Navbar />
      <main className="relative z-10 flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/view/:slug" element={<ViewPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
        </Routes>
      </main>
      <footer className="relative z-10 py-6 text-center text-neutral-300 text-xs tracking-wide border-t border-neutral-200/40">
        <p>LinkVault &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
