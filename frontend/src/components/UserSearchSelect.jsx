import { useState, useRef, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import api from '../services/api';

export default function UserSearchSelect({ selectedUsers, onSelectedUsersChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearch(q) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/auth/users/search?q=${encodeURIComponent(q)}`);
        // Filter out already-selected users
        const filtered = res.data.users.filter(
          (u) => !selectedUsers.some((s) => s.id === u.id)
        );
        setResults(filtered);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function addUser(user) {
    onSelectedUsersChange([...selectedUsers, user]);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function removeUser(userId) {
    onSelectedUsersChange(selectedUsers.filter((u) => u.id !== userId));
  }

  return (
    <div ref={wrapperRef} className="space-y-2">
      <label className="block text-xs font-medium text-neutral-400">
        Grant access to
      </label>

      {/* Selected users chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-[11px] font-medium text-neutral-700"
            >
              {u.username}
              <button
                type="button"
                onClick={() => removeUser(u.id)}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <HiOutlineX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-300" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="v-input w-full !pl-8 !py-2 text-sm"
          placeholder="Search users by username..."
        />
        {searching && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="border border-neutral-200 rounded-lg bg-white shadow-lg shadow-neutral-200/50 max-h-40 overflow-auto">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => addUser(user)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0"
            >
              <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[12px] font-medium text-neutral-800">{user.username}</p>
                <p className="text-[10px] text-neutral-400">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query && results.length === 0 && !searching && (
        <p className="text-[11px] text-neutral-400 py-2 text-center">No users found</p>
      )}
    </div>
  );
}
