import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VisibilitySelector from './VisibilitySelector';
import {
  HiOutlineDocumentText,
  HiOutlineUpload,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineClipboardCopy,
  HiOutlineExternalLink,
  HiOutlineX,
  HiOutlineArrowRight,
  HiOutlineFire,
  HiOutlineChevronDown,
} from 'react-icons/hi';

export default function UploadForm() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isOneTime, setIsOneTime] = useState(false);
  const [maxViews, setMaxViews] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('type', mode);

      if (mode === 'text') {
        if (!textContent.trim()) {
          toast.error('Enter some content first.');
          setLoading(false);
          return;
        }
        formData.append('textContent', textContent);
      } else {
        if (!file) {
          toast.error('Select a file to upload.');
          setLoading(false);
          return;
        }
        formData.append('file', file);
      }

      if (password) formData.append('password', password);
      if (isOneTime) formData.append('isOneTime', 'true');
      if (maxViews) formData.append('maxViews', maxViews);
      if (expiresAt) formData.append('expiresAt', new Date(expiresAt).toISOString());
      formData.append('visibility', visibility);
      if (visibility === 'protected' && allowedUsers.length > 0) {
        formData.append('allowedUserIds', JSON.stringify(allowedUsers.map((u) => u.id)));
      }

      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const shareUrl = `${window.location.origin}/view/${res.data.upload.slug}`;
      setResult({ ...res.data.upload, shareUrl });
      toast.success('Link created.');

      // Reset
      setTextContent('');
      setFile(null);
      setPassword('');
      setIsOneTime(false);
      setMaxViews('');
      setExpiresAt('');
      setVisibility('public');
      setAllowedUsers([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(result.shareUrl);
    toast.success('Copied.');
  }

  function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 bg-neutral-100 rounded-lg w-fit">
        {[
          { key: 'text', label: 'Text', icon: HiOutlineDocumentText },
          { key: 'file', label: 'File', icon: HiOutlineUpload },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
              mode === m.key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <m.icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Content */}
        {mode === 'text' ? (
          <div>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={8}
              className="v-input w-full font-mono text-sm resize-none leading-relaxed"
              placeholder="Paste text, code, notes..."
            />
            <p className="text-[11px] text-neutral-300 mt-1">
              {textContent.length.toLocaleString()} / 500,000
            </p>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`v-card w-full py-8 flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-neutral-300 transition-colors ${
              file ? 'border-neutral-400' : ''
            }`}
          >
            {file ? (
              <>
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <HiOutlineDocumentText className="w-5 h-5 text-neutral-600" />
                </div>
                <p className="text-sm font-medium text-neutral-800">{file.name}</p>
                <p className="text-[11px] text-neutral-400">{formatFileSize(file.size)}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-[11px] text-red-500 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                  <HiOutlineUpload className="w-5 h-5 text-neutral-300" />
                </div>
                <p className="text-sm text-neutral-400">Click to upload</p>
                <p className="text-[10px] text-neutral-300">Max 50 MB</p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {/* Visibility */}
        <VisibilitySelector
          value={visibility}
          onChange={setVisibility}
          allowedUsers={allowedUsers}
          onAllowedUsersChange={setAllowedUsers}
          isAuthenticated={isAuthenticated}
        />

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-[12px] text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <HiOutlineChevronDown
            className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Advanced options
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 pb-1">
                {/* Password */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 mb-1.5">
                    <HiOutlineLockClosed className="w-3 h-3" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="v-input w-full text-sm !py-2"
                    placeholder="Optional"
                  />
                </div>

                {/* Expiry */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 mb-1.5">
                    <HiOutlineClock className="w-3 h-3" />
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="v-input w-full text-sm !py-2"
                  />
                  <p className="text-[9px] text-neutral-300 mt-0.5">Default: 10 min</p>
                </div>

                {/* Max Views */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 mb-1.5">
                    <HiOutlineEye className="w-3 h-3" />
                    Max Views
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                    className="v-input w-full text-sm !py-2"
                    placeholder="Unlimited"
                  />
                </div>

                {/* Burn After Reading */}
                <div
                  onClick={() => setIsOneTime(!isOneTime)}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                    isOneTime
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <HiOutlineFire className={`w-4 h-4 ${isOneTime ? 'text-orange-400' : 'text-neutral-300'}`} />
                  <div>
                    <p className="text-[11px] font-semibold">Burn After Reading</p>
                    <p className={`text-[9px] ${isOneTime ? 'text-neutral-400' : 'text-neutral-300'}`}>
                      Self-destructs
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="v-btn w-full flex items-center justify-center gap-2 !py-3.5 !mt-7"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Generate Link
              <HiOutlineArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="v-card !border-neutral-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Your link is ready
                </p>
                <code className="text-sm font-mono text-neutral-800 bg-neutral-50 px-3 py-1.5 rounded-md border border-neutral-200 break-all block">
                  {result.shareUrl}
                </code>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-neutral-300 hover:text-neutral-600 transition-colors"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={copyLink} className="v-btn !py-2 !px-4 text-sm flex items-center gap-1.5">
                <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
                Copy
              </button>
              <a
                href={result.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="v-btn-outline !py-2 !px-4 text-sm flex items-center gap-1.5"
              >
                <HiOutlineExternalLink className="w-3.5 h-3.5" />
                Open
              </a>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-100">
              {result.hasPassword && <span className="v-badge">🔒 Password</span>}
              {result.isOneTime && <span className="v-badge">🔥 One-Time</span>}
              {result.maxViews && <span className="v-badge">👁 {result.maxViews} views</span>}
              <span className="v-badge">⏱ {new Date(result.expiresAt + 'Z').toLocaleString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
