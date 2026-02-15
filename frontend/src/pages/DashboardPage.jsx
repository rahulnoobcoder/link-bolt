import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import {
  HiOutlineTrash,
  HiOutlineClipboardCopy,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
  HiOutlineUpload,
  HiOutlineLockClosed,
  HiOutlineFire,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineGlobe,
  HiOutlineUserGroup,
} from 'react-icons/hi';

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) fetchUploads();
  }, [isAuthenticated]);

  async function fetchUploads() {
    setLoading(true);
    try {
      const res = await api.get('/uploads');
      setUploads(res.data.uploads);
    } catch {
      toast.error('Failed to load uploads.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/uploads/${id}`);
      setUploads((prev) => prev.filter((u) => u.id !== id));
      toast.success('Deleted.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed.');
    } finally {
      setDeleteTarget(null);
    }
  }

  function copyLink(slug) {
    navigator.clipboard.writeText(`${window.location.origin}/view/${slug}`);
    toast.success('Copied.');
  }

  function isExpired(expiresAt) {
    return new Date(expiresAt + 'Z') <= new Date();
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function timeLeft(expiresAt) {
    const diff = new Date(expiresAt + 'Z') - new Date();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ${hrs % 24}h`;
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  }

  function visibilityIcon(v) {
    if (v === 'private') return <HiOutlineLockClosed className="w-2.5 h-2.5" />;
    if (v === 'protected') return <HiOutlineUserGroup className="w-2.5 h-2.5" />;
    return <HiOutlineGlobe className="w-2.5 h-2.5" />;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-6xl mx-auto px-5 sm:px-8 py-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            {user?.username}'s uploads
          </h1>
          <p className="text-[13px] text-neutral-400 mt-0.5">
            {uploads.length} item{uploads.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchUploads}
          className="v-btn-ghost flex items-center gap-1.5 text-[13px]"
        >
          <HiOutlineRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Upload list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
        </div>
      ) : uploads.length === 0 ? (
        <EmptyState
          title="No uploads yet"
          description="Head to the home page and create your first link."
          icon={HiOutlineUpload}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
          {uploads.map((u, i) => {
            const expired = isExpired(u.expiresAt);
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                layout
                className={`v-card group !p-5 ${expired ? 'opacity-40' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
                      {u.type === 'text' ? (
                        <HiOutlineDocumentText className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <HiOutlineUpload className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate max-w-[200px]">
                        {u.type === 'file' ? u.originalFilename : 'Text Paste'}
                      </p>
                      <p className="text-[11px] text-neutral-300">
                        {u.type === 'file' && u.fileSize ? formatSize(u.fileSize) : `${u.textPreview?.length || 0} chars`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(u)}
                    className="text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 p-1.5 rounded-lg"
                    title="Delete"
                  >
                    <HiOutlineTrash className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Text preview */}
                {u.type === 'text' && u.textPreview && (
                  <div className="bg-neutral-50 rounded-lg p-3 mb-4 border border-neutral-100">
                    <p className="text-[12px] font-mono text-neutral-400 line-clamp-2">
                      {u.textPreview}
                    </p>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="v-badge flex items-center gap-1">
                    {visibilityIcon(u.visibility)}
                    {u.visibility || 'public'}
                  </span>
                  {u.hasPassword && (
                    <span className="v-badge flex items-center gap-1">
                      <HiOutlineLockClosed className="w-3 h-3" /> pwd
                    </span>
                  )}
                  {u.isOneTime && (
                    <span className="v-badge flex items-center gap-1 !border-orange-200 !text-orange-500">
                      <HiOutlineFire className="w-3 h-3" /> 1×
                    </span>
                  )}
                  <span className="v-badge flex items-center gap-1">
                    <HiOutlineEye className="w-3 h-3" />
                    {u.viewCount}{u.maxViews ? `/${u.maxViews}` : ''}
                  </span>
                  <span
                    className={`v-badge flex items-center gap-1 ${
                      expired ? '!border-red-200 !text-red-500' : '!border-emerald-200 !text-emerald-600'
                    }`}
                  >
                    <HiOutlineClock className="w-3 h-3" />
                    {timeLeft(u.expiresAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3.5 border-t border-neutral-100">
                  <button
                    onClick={() => copyLink(u.slug)}
                    className="flex-1 v-btn-ghost !py-2 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <a
                    href={`/view/${u.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 v-btn-ghost !py-2 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <HiOutlineExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-lg border border-neutral-100 p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <HiOutlineTrash className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-neutral-900">Delete upload</h3>
                  <p className="text-[12px] text-neutral-400">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-[13px] text-neutral-500 mb-5">
                Are you sure you want to permanently delete{' '}
                <span className="font-medium text-neutral-700">
                  {deleteTarget.type === 'file' ? deleteTarget.originalFilename : 'this text paste'}
                </span>
                ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 v-btn-ghost !py-2 text-[13px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget.id)}
                  className="flex-1 !py-2 text-[13px] font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all duration-150"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
