'use client';

import { useState } from 'react';
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
  Shield
} from 'lucide-react';export default function HamburgerMenu({ activeSection, onSectionChange, user, onLogout, isResearcher = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

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
      {/* Hamburger Button - Rightmost */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        ) : (
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        )}
      </button>

      {/* Sidebar Menu - Responsive width */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-80 max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Curalink</h2>
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
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                        : 'hover:bg-gray-50 text-gray-700'
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
