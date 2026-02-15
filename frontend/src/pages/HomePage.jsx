import { motion } from 'framer-motion';
import UploadForm from '../components/UploadForm';
import FeatureGrid from '../components/FeatureGrid';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      {/* Hero — asymmetric, left-aligned, bold */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-16 max-w-2xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse" />
          <span className="text-[11px] font-medium text-neutral-500 tracking-wide">
            Secure & ephemeral sharing
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-neutral-900 leading-[1.1] mb-4">
          Share anything with
          <br />
          <span className="text-neutral-300">a single link.</span>
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-lg">
          Upload text or files. Get a time-limited, secure URL.
          Password protection, burn-after-reading, and view caps — built in.
        </p>
      </motion.div>

      {/* Two-column layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-8"
      >
        {/* Upload form — 3 cols */}
        <div className="lg:col-span-3">
          <div className="v-card !p-7 sm:!p-8">
            <h2 className="text-sm font-semibold text-neutral-400 tracking-wide uppercase mb-6">
              New Upload
            </h2>
            <UploadForm />
          </div>
        </div>

        {/* Features — 2 cols */}
        <div className="lg:col-span-2">
          <div className="v-card !p-5 sm:!p-6">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">
              Features
            </h3>
            <FeatureGrid />
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-3 gap-4 mt-12"
      >
        {[
          { label: 'Encryption', value: 'AES-256' },
          { label: 'Default TTL', value: '10 min' },
          { label: 'Max Upload', value: '50 MB' },
        ].map((s) => (
          <div key={s.label} className="v-card text-center !py-5 !px-4">
            <p className="text-lg font-bold text-neutral-900">{s.value}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5 uppercase tracking-wider font-medium">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
