import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineGlobe, HiOutlineLockClosed, HiOutlineUserGroup } from 'react-icons/hi';
import UserSearchSelect from './UserSearchSelect';

const options = [
  {
    value: 'public',
    label: 'Public',
    desc: 'Anyone with the link',
    icon: HiOutlineGlobe,
  },
  {
    value: 'private',
    label: 'Private',
    desc: 'Only you',
    icon: HiOutlineLockClosed,
  },
  {
    value: 'protected',
    label: 'Protected',
    desc: 'Selected users',
    icon: HiOutlineUserGroup,
  },
];

export default function VisibilitySelector({ value, onChange, allowedUsers, onAllowedUsersChange, isAuthenticated }) {
  return (
    <div className="space-y-3 pt-1">
      <label className="block text-xs font-medium text-neutral-400 tracking-wide uppercase">
        Vault Visibility
      </label>

      <div className="grid grid-cols-3 gap-2.5">
        {options.map((opt) => {
          const active = value === opt.value;
          const disabled = opt.value !== 'public' && !isAuthenticated;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`relative flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 transition-all text-center ${
                active
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : disabled
                  ? 'border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
              }`}
            >
              <opt.icon className={`w-4 h-4 ${active ? 'text-white' : ''}`} />
              <span className="text-[11px] font-semibold">{opt.label}</span>
              <span className={`text-[9px] leading-tight ${active ? 'text-neutral-300' : 'text-neutral-400'}`}>
                {opt.desc}
              </span>
              {disabled && (
                <span className="text-[8px] text-neutral-300 mt-0.5">Sign in required</span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {value === 'protected' && isAuthenticated && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              <UserSearchSelect
                selectedUsers={allowedUsers}
                onSelectedUsersChange={onAllowedUsersChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
