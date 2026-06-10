'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  UserSearch, 
  Beaker, 
  BookOpen,
  MessageSquare,
  Heart,
  User,
  LogOut,
  ChevronRight,
  Home,
  ArrowRightLeft,
  GraduationCap,
  Settings,
  Shield,
  Sun,
  Moon,
  Stethoscope
} from 'lucide-react';

export default function HamburgerMenu({ activeSection, onSectionChange, user, onLogout, isResearcher = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  // Sync state with DOM class on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const patientMenuItems = [
    {
      id: 'home',
      name: 'Home',
      icon: Home,
      description: 'Back to home'
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Personalized recommendations'
    },
    {
      id: 'experts',
      name: 'Experts',
      icon: GraduationCap,
      description: 'Find experts for your condition'
    },
    {
      id: 'researchers',
      name: 'Researchers',
      icon: UserSearch,
      description: 'Connect with leading researchers'
    },
    {
      id: 'trials',
      name: 'Clinical Trials',
      icon: Beaker,
      description: 'Search ongoing trials'
    },
    {
      id: 'publications',
      name: 'Publications',
      icon: BookOpen,
      description: 'Research papers and articles'
    },
    {
      id: 'forums',
      name: 'Forums',
      icon: MessageSquare,
      description: 'Community discussions'
    },
    {
      id: 'favorites',
      name: 'Favorites',
      icon: Heart,
      description: 'Saved items'
    }
  ];

  const researcherMenuItems = [
    {
      id: 'home',
      name: 'Home',
      icon: Home,
      description: 'Back to home'
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Your research overview'
    },
    {
      id: 'researchers',
      name: 'Researchers',
      icon: UserSearch,
      description: 'Discover fellow researchers'
    },
    {
      id: 'collaborators',
      name: 'Collaborators',
      icon: UserSearch,
      description: 'Connect with researchers'
    },
    {
      id: 'trials',
      name: 'My Trials',
      icon: Beaker,
      description: 'Manage clinical trials'
    },
    {
      id: 'publications',
      name: 'Publications',
      icon: BookOpen,
      description: 'Your research publications'
    },
    {
      id: 'forums',
      name: 'Forums',
      icon: MessageSquare,
      description: 'Engage in discussions'
    },
    {
      id: 'favorites',
      name: 'Favorites',
      icon: Heart,
      description: 'Saved items'
    }
  ];

  const menuItems = isResearcher ? researcherMenuItems : patientMenuItems;

  const handleSectionClick = (sectionId) => {
    setIsOpen(false);
    
    // Handle home navigation
    if (sectionId === 'home') {
      router.push('/');
      return;
    }
    
    // Handle settings navigation
    if (sectionId === 'settings') {
      router.push(isResearcher ? '/researcher/settings' : '/patient/settings');
      return;
    }
    
    onSectionChange(sectionId);
  };

  return (
    <>
      {/* Theme Toggle Button - Near Bell Icon (right-[184px]) */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-[184px] z-50 p-2.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg hover:border-indigo-500/20 dark:hover:border-indigo-500/30 transition-all duration-300 hover:scale-105"
        aria-label="Toggle Theme"
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? (
          <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
        )}
      </button>

      {/* Hamburger Button - Rightmost */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg hover:border-indigo-500/20 dark:hover:border-indigo-500/30 transition-all duration-300 hover:scale-105"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200" />
        ) : (
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200" />
        )}
      </button>

      {/* Sidebar Menu - Responsive width */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-80 max-w-sm sidebar-drawer shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900/50 dark:to-indigo-950/20 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {user && (
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-blue-300">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  <p className="text-xs text-blue-600 font-medium mt-0.5">
                    {user.role === 'PATIENT' ? '👤 Patient' : user.role === 'RESEARCHER' ? '🔬 Researcher' : '👑 Admin'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionClick(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/10'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <p className={`font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                        {item.name}
                      </p>
                      <p className={`text-xs ${
                        isActive ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                    
                    <ChevronRight className={`w-5 h-5 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    } group-hover:translate-x-1 transition-transform`} />
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {/* Admin Dashboard Button - Only show for ADMIN users */}
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/admin/dashboard');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors border-2 border-purple-200"
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin Dashboard</span>
              </button>
            )}
            
            <button
              onClick={() => handleSectionClick('profile')}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-medium">My Profile</span>
            </button>
            
            <button
              onClick={async () => {
                setIsOpen(false);
                // Logout by clearing cookies
                document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                // Call logout API
                await fetch('/api/auth/logout', { method: 'POST' });
                // Redirect to login
                router.push('/login');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
            >
              <ArrowRightLeft className="w-5 h-5" />
              <span className="font-medium">Switch Role</span>
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
