'use client';

import { useState } from 'react';
import { User, ChevronDown, Settings, LogOut, Shield, ArrowRightLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProfile({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsOpen(false);
    // Clear cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Call logout API
    await fetch('/api/auth/logout', { method: 'POST' });
    // Redirect to login
    router.push('/login');
  };

  const handleSwitchRole = async () => {
    setIsOpen(false);
    // Clear cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Call logout API
    await fetch('/api/auth/logout', { method: 'POST' });
    // Redirect to login
    router.push('/login');
  };

  if (!user) return null;

  return (
    <>
      {/* User Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-36 z-50 flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        aria-label="User Profile"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</p>
          <p className="text-xs text-gray-500 leading-tight">{user.role}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-20 right-4 w-72 z-50 bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              {/* User Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      {user.role === 'PATIENT' ? 'Patient' : user.role === 'RESEARCHER' ? 'Researcher' : 'Admin'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {/* Admin Dashboard - Only for ADMIN users */}
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/admin/dashboard');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 text-purple-600 transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Admin Dashboard</span>
                  </button>
                )}

                {/* Settings */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    const settingsPath = user.role === 'RESEARCHER' 
                      ? '/researcher/settings' 
                      : '/patient/settings';
                    router.push(settingsPath);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>

                {/* Switch Role */}
                <button
                  onClick={handleSwitchRole}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 text-purple-600 transition-colors"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  <span className="font-medium">Switch Role</span>
                </button>

                {/* Divider */}
                <div className="my-2 border-t border-gray-200"></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
