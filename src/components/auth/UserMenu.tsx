// src/components/auth/UserMenu.tsx
// User menu component for header - shows sign in button or user dropdown

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse" />
    );
  }

  // Not logged in - show sign in button
  if (!user) {
    return (
      <Link
        to="/login"
        className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
      >
        Sign in
      </Link>
    );
  }

  // Logged in - show avatar dropdown
  const userEmail = user.email || 'User';
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {userInitial}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          {/* User info */}
          <div className="px-4 py-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500 text-white rounded-full flex items-center justify-center font-medium">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{userEmail}</p>
                <p className="text-xs text-slate-500">Signed in</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              to="/my-profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <User size={16} className="text-slate-400" />
              My Profile
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Settings size={16} className="text-slate-400" />
              Settings
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-slate-100 pt-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
