import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  HiOutlineLockClosed,
  HiOutlineClipboardCopy,
  HiOutlineDownload,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineEye,
} from 'react-icons/hi';

export default function ViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [meta, setMeta] = useState(null);
  const [content, setContent] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const res = await api.get(`/link/${slug}/meta`);
        setMeta(res.data);
        if (res.data.hasPassword) {
          setNeedsPassword(true);
        } else {
          await accessContent('');
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 && err.response?.data?.requiresAuth) {
          // Need to sign in — redirect to login with return path
          navigate('/login', { state: { from: `/view/${slug}` } });
          return;
        }
        if (status === 403) {
          navigate('/access-denied');
          return;
        }
        setError(err.response?.data?.error || 'Content not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  async function accessContent(pw) {
    setAccessLoading(true);
    try {
      const body = pw ? { password: pw } : {};
      const res = await api.post(`/link/${slug}`, body);
      setContent(res.data);
      setNeedsPassword(false);
      setError(null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 && err.response?.data?.requiresAuth) {
        navigate('/login', { state: { from: `/view/${slug}` } });
        return;
      }
      if (status === 403) {
        navigate('/access-denied');
        return;
      }
      if (err.response?.data?.requiresPassword) {
        setNeedsPassword(true);
      } else {
        setError(err.response?.data?.error || 'Failed to access content.');
      }
    } finally {
      setAccessLoading(false);
    }
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return toast.error('Enter the password.');
    accessContent(password);
  }

  function copyText() {
    navigator.clipboard.writeText(content.textContent);
    toast.success('Copied.');
  }

  function downloadFile() {
    const params = password ? `?password=${encodeURIComponent(password)}` : '';
    window.open(`/api/link/${slug}/download${params}`, '_blank');
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Error
  if (error && !needsPassword) {
    return (
      <div className="max-w-md mx-auto px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-14 h-14 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
            <HiOutlineExclamationCircle className="w-7 h-7 text-neutral-400" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Link Unavailable</h2>
          <p className="text-sm text-neutral-400">{error}</p>
        </motion.div>
      </div>
    );
  }

  // Password gate
  if (needsPassword && !content) {
    return (
      <div className="max-w-sm mx-auto px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center mx-auto mb-4">
            <HiOutlineLockClosed className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Password Required</h2>
          <p className="text-sm text-neutral-400 mb-5">This content is protected.</p>
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="v-input w-full text-center"
              placeholder="Enter password"
              autoFocus
            />
            <button type="submit" disabled={accessLoading} className="v-btn w-full">
              {accessLoading ? 'Verifying...' : 'Unlock'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Content
  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto px-5 sm:px-8 py-12"
    >
      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="v-badge flex items-center gap-1">
          <HiOutlineEye className="w-2.5 h-2.5" />
          {content.viewCount}{content.maxViews ? ` / ${content.maxViews}` : ''} views
        </span>
        <span className="v-badge flex items-center gap-1">
          <HiOutlineClock className="w-2.5 h-2.5" />
          Expires {new Date(content.expiresAt + 'Z').toLocaleString()}
        </span>
        {content.isOneTime && (
          <span className="v-badge !border-orange-200 !text-orange-500">
            🔥 One-Time View
          </span>
        )}
      </div>

      {/* Content card */}
      <div className="v-card">
        {content.type === 'text' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="w-4 h-4 text-neutral-400" />
                <h2 className="text-[13px] font-medium text-neutral-500">Text Content</h2>
              </div>
              <button
                onClick={copyText}
                className="v-btn-ghost !py-1 !px-2.5 text-[11px] flex items-center gap-1"
              >
                <HiOutlineClipboardCopy className="w-3 h-3" />
                Copy
              </button>
            </div>
            <pre className="bg-neutral-50 rounded-lg p-4 font-mono text-sm text-neutral-700 whitespace-pre-wrap break-words leading-relaxed border border-neutral-100 max-h-[60vh] overflow-auto">
              {content.textContent}
            </pre>
          </>
        ) : (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center mx-auto mb-4">
              <HiOutlineDownload className="w-7 h-7 text-neutral-400" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-1">{content.originalFilename}</h2>
            <p className="text-sm text-neutral-400 mb-5">
              {content.mimeType} · {formatSize(content.fileSize)}
            </p>
            <button onClick={downloadFile} className="v-btn inline-flex items-center gap-2">
              <HiOutlineDownload className="w-4 h-4" />
              Download
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
