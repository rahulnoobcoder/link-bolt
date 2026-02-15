import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShieldExclamation } from 'react-icons/hi';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center max-w-sm"
      >
        <div className="w-14 h-14 rounded-xl bg-neutral-900 flex items-center justify-center mx-auto mb-5">
          <HiOutlineShieldExclamation className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-neutral-900 mb-2 tracking-tight">
          Access Denied
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed mb-6">
          You don't have permission to view this vault.
          The owner hasn't granted you access.
        </p>
        <Link to="/" className="v-btn inline-flex items-center gap-2">
          Go Home
        </Link>
      </motion.div>
    </div>
  );
}
