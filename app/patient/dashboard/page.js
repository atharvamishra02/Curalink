'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Heart, 
  FileText, 
  Users, 
  Search, 
  BookOpen,
  Stethoscope,
  MapPin,
  ExternalLink,
  Mail,
  Eye,
  UserPlus,
  Video,
  TrendingUp,
  MessageSquare,
  Filter,
  X,
  Sparkles,
  Plus,
  Trash2,
  Bell,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import HamburgerMenu from '@/components/HamburgerMenu';

export default function PatientDashboard() {
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [locationFilter, setLocationFilter] = useState('');
  const [conditionFilters, setConditionFilters] = useState([]);
    const [phaseFilter, setPhaseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Data for different sections
  const [researchers, setResearchers] = useState([]);
  const [trials, setTrials] = useState([]);
  const [publications, setPublications] = useState([]);
  const [forums, setForums] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUserData();
    fetchUnreadCount(); // Fetch initial notification count
  }, []);

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Set initial condition filters from user profile
  useEffect(() => {
    if (user?.patientProfile?.conditions?.length > 0) {
      setConditionFilters(user.patientProfile.conditions);
    }
    // Set initial location from user profile
    if (user?.patientProfile?.location) {
      setLocationFilter(user.patientProfile.location);
      console.log('Auto-set user location:', user.patientProfile.location);
    } else if (user?.patientProfile?.city && user?.patientProfile?.country) {
      const userLocation = `${user.patientProfile.city}, ${user.patientProfile.country}`;
      setLocationFilter(userLocation);
      console.log('Auto-set user location from city/country:', userLocation);
    }
  }, [user]);

  // Fetch data when section changes or on initial load
  useEffect(() => {
    if (user) {
      fetchSectionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, user]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/login');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const fetchSectionData = async () => {
    setLoading(true);
    try {
      switch (activeSection) {
        case 'dashboard':
          await fetchDashboard();
          break;
        case 'experts':
          await fetchResearchers();
          break;
        case 'researchers':
          await fetchResearchers();
          break;
        case 'trials':
          await fetchTrials();
          break;
        case 'publications':
          await fetchPublications();
          break;
        case 'forums':
          await fetchForums();
          break;
        case 'favorites':
          await fetchFavorites();
          break;
        case 'notifications':
          await fetchNotifications();
          // Reset unread count when viewing notifications
          if (unreadCount > 0) {
            await markAllNotificationsAsRead();
          }
          break;
        case 'profile':
          // Profile data is already loaded in user state
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    const condition = conditionFilters[0] || searchQuery || 'cancer';
    
    const [pubsRes, trialsRes, researchersRes] = await Promise.all([
      fetch(`/api/publications?condition=${encodeURIComponent(condition)}&limit=6`),
      fetch(`/api/clinical-trials?condition=${encodeURIComponent(condition)}&limit=6`),
      fetch(`/api/researchers?condition=${encodeURIComponent(condition)}&limit=6`)
    ]);

    const pubs = await pubsRes.json();
    const trials = await trialsRes.json();
    const researchers = await researchersRes.json();

    setDashboardData({
      publications: pubs.publications || [],
      trials: trials.trials || [],
      researchers: researchers.researchers || []
    });
  };

  const fetchResearchers = async () => {
    try {
      // Determine if searchQuery is a researcher name or a condition
      // If user typed in search box, treat it as name search
      // Otherwise use condition filters
      let url;
      
      if (searchQuery && searchQuery.trim()) {
        // Name search - use searchQuery as the search parameter
        // Use condition filters if available, otherwise default to 'cancer'
        const conditions = conditionFilters.length > 0 ? conditionFilters : ['cancer'];
        url = `/api/researchers?condition=${encodeURIComponent(conditions.join(','))}&search=${encodeURIComponent(searchQuery)}&limit=30`;
      } else if (conditionFilters.length > 0) {
        // Condition-only search
        url = `/api/researchers?condition=${encodeURIComponent(conditionFilters.join(','))}&limit=30`;
      } else {
        // Default search
        url = `/api/researchers?condition=cancer&limit=30`;
      }
      
      // Add location filter if it exists
      if (locationFilter) {
        url += `&location=${encodeURIComponent(locationFilter)}`;
      }

      console.log('Fetching researchers with URL:', url);
      console.log('Search query:', searchQuery);
      console.log('Condition filters:', conditionFilters);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Researchers found:', data.researchers?.length || 0);
      setResearchers(data.researchers || []);
    } catch (error) {
      console.error('Error fetching researchers:', error);
      setResearchers([]);
    }
  };

  const fetchTrials = async () => {
    try {
      let url = '/api/clinical-trials?limit=20';
      
      // Add condition filters
      if (conditionFilters.length > 0) {
        url += `&condition=${encodeURIComponent(conditionFilters.join(','))}`;
      }
      
      // Add search query
      if (searchQuery) {
        url += `&keyword=${encodeURIComponent(searchQuery)}`;
      }
      
      // Add location filter
      if (locationFilter) {
        url += `&location=${encodeURIComponent(locationFilter)}`;
      }
      
      // Add phase filter
      if (phaseFilter) {
        url += `&phase=${encodeURIComponent(phaseFilter)}`;
      }
      
      // Add status filter
      if (statusFilter) {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      console.log('Fetching trials with URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      setTrials(data.trials || []);
      
      // Show message if no results with filters applied
      if (data.message && data.trials?.length === 0) {
        console.log('ℹ️', data.message);
      }
    } catch (error) {
      console.error('Error fetching trials:', error);
      setTrials([]);
    }
  };

  const fetchPublications = async () => {
    try {
      let url = '/api/publications?limit=20';
      
      // Use search query if available, otherwise use all conditions
      if (searchQuery) {
        console.log('Fetching publications with search query:', searchQuery);
        url += `&condition=${encodeURIComponent(searchQuery)}`;
      } else if (conditionFilters.length > 0) {
        // Use all conditions joined with OR for broader search
        const conditionsQuery = conditionFilters.join(' OR ');
        console.log('Fetching publications with conditions:', conditionsQuery);
        url += `&condition=${encodeURIComponent(conditionsQuery)}`;
      } else {
        // Default fallback
        console.log('Fetching publications with default: cancer');
        url += `&condition=cancer`;
      }

      console.log('Publications API URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Publications response:', data.publications?.length || 0, 'results');
      setPublications(data.publications || []);
    } catch (error) {
      console.error('Error fetching publications:', error);
      setPublications([]);
    }
  };

  const fetchForums = async () => {
    try {
      const response = await fetch('/api/forums');
      const data = await response.json();
      setForums(data.forums || []);
    } catch (error) {
      setForums([]);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      setFavorites([]);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const addConditionFilter = (condition) => {
    if (!conditionFilters.includes(condition)) {
      const newFilters = [...conditionFilters, condition];
      console.log('Adding condition filter:', condition, 'New filters:', newFilters);
      setConditionFilters(newFilters);
    }
  };

  const removeConditionFilter = (condition) => {
    const newFilters = conditionFilters.filter(c => c !== condition);
    console.log('Removing condition filter:', condition, 'New filters:', newFilters);
    setConditionFilters(newFilters);
  };

  const applyFilters = () => {
    console.log('Applying filters - Current section:', activeSection, 'Conditions:', conditionFilters, 'Search:', searchQuery, 'Location:', locationFilter);
    fetchSectionData();
  };

  const getSectionTitle = () => {
    const titles = {
      dashboard: 'Your Dashboard',
      experts: 'Medical Experts',
      researchers: 'Researchers',
      trials: 'Clinical Trials',
      publications: 'Publications',
      forums: 'Forums',
      favorites: 'Favorites',
      notifications: 'Notifications'
    };
    return titles[activeSection] || 'Dashboard';
  };

  const getSectionDescription = () => {
    const descriptions = {
      dashboard: 'Personalized recommendations based on your conditions',
      experts: 'Medical experts specialized in your condition',
      researchers: 'Connect with leading researchers in your condition',
      trials: 'Search for ongoing clinical trials',
      publications: 'Latest research papers and articles',
      forums: 'Community discussions and Q&A',
      favorites: 'Your saved items',
      notifications: 'Stay updated with meeting requests and forum responses'
    };
    return descriptions[activeSection] || '';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hamburger Menu */}
      <HamburgerMenu 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        user={user}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {/* Main Content - with right padding for hamburger menu */}
      <main className="pr-20 pl-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {getSectionTitle()}
          </h1>
          <p className="text-gray-600">{getSectionDescription()}</p>
          
          {/* Debug: Show location filter status */}
          {(activeSection === 'researchers' || activeSection === 'experts') && (
            <div className="mt-2 text-sm">
              {locationFilter ? (
                <span className="text-green-600 font-medium">
                  🗺️ Sorting by proximity to: {locationFilter}
                </span>
              ) : (
                <span className="text-gray-500">
                  💡 Tip: Add your location to see nearby researchers first
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder={`Search ${activeSection}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyFilters();
                    }
                  }}
                  className="pl-12"
                />
              </div>
            </div>
            {(activeSection === 'trials' || activeSection === 'researchers' || activeSection === 'experts') && (
              <div className="w-64">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Your location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyFilters();
                      }
                    }}
                    className="pl-12"
                    title="Researchers near you will be shown first"
                  />
                </div>
              </div>
            )}
            {activeSection === 'trials' && (
              <>
                <select
                  value={phaseFilter}
                  onChange={(e) => setPhaseFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Phases</option>
                  <option value="EARLY_PHASE_1">Early Phase 1</option>
                  <option value="PHASE_1">Phase 1</option>
                  <option value="PHASE_2">Phase 2</option>
                  <option value="PHASE_3">Phase 3</option>
                  <option value="PHASE_4">Phase 4</option>
                  <option value="NOT_APPLICABLE">N/A</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="RECRUITING">Recruiting</option>
                  <option value="NOT_YET_RECRUITING">Not Yet Recruiting</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ACTIVE_NOT_RECRUITING">Active, Not Recruiting</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                  <option value="ENROLLING_BY_INVITATION">Enrolling by Invitation</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </>
            )}
            <Button onClick={applyFilters} className="whitespace-nowrap">
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>

          {/* Condition Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filters:</span>
            {conditionFilters.map((condition) => (
              <span
                key={condition}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
              >
                {condition}
                <button
                  onClick={() => removeConditionFilter(condition)}
                  className="hover:text-blue-900 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
            
            {/* Location indicator for researchers/experts */}
            {(activeSection === 'researchers' || activeSection === 'experts') && locationFilter && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Near: {locationFilter}
                <button
                  onClick={() => setLocationFilter('')}
                  className="hover:text-green-900 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            
            {/* Phase filter badge for trials */}
            {activeSection === 'trials' && phaseFilter && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center gap-2">
                Phase: {phaseFilter.replace(/_/g, ' ').replace('PHASE ', '')}
                <button
                  onClick={() => setPhaseFilter('')}
                  className="hover:text-purple-900 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            
            {/* Status filter badge for trials */}
            {activeSection === 'trials' && statusFilter && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-2">
                Status: {statusFilter.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                <button
                  onClick={() => setStatusFilter('')}
                  className="hover:text-orange-900 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newCondition = prompt('Add a condition:');
                if (newCondition) addConditionFilter(newCondition);
              }}
            >
              + Add
            </Button>
          </div>
        </motion.div>

        {/* Content Sections */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dashboard Section */}
            {activeSection === 'dashboard' && dashboardData && (
              <DashboardContent 
                data={dashboardData} 
                onSectionChange={setActiveSection} 
              />
            )}

            {/* Experts Section */}
            {activeSection === 'experts' && (
              <ResearchersContent researchers={researchers} onRefresh={fetchResearchers} />
            )}

            {/* Researchers Section */}
            {activeSection === 'researchers' && (
              <ResearchersContent researchers={researchers} onRefresh={fetchResearchers} />
            )}

            {/* Trials Section */}
            {activeSection === 'trials' && (
              <TrialsContent trials={trials} onRefresh={fetchTrials} phaseFilter={phaseFilter} statusFilter={statusFilter} />
            )}

            {/* Publications Section */}
            {activeSection === 'publications' && (
              <PublicationsContent publications={publications} onRefresh={fetchPublications} />
            )}

            {/* Forums Section */}
            {activeSection === 'forums' && (
              <ForumsContent forums={forums} currentUser={user} />
            )}

            {/* Favorites Section */}
            {activeSection === 'favorites' && (
              <FavoritesContent favorites={favorites} onRefresh={fetchFavorites} />
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <NotificationsContent 
                notifications={notifications}
                onRefresh={fetchNotifications}
                onMarkAsRead={markAllNotificationsAsRead}
              />
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && user && (
              <ProfileContent user={user} onUpdate={fetchUserData} />
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ data, onSectionChange }) {
  return (
    <div className="space-y-8">
      {/* Find Experts CTA */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Find Expert Doctors Near You</h3>
            <p className="text-blue-100">
              Connect with specialists who match your conditions and are closest to your location
            </p>
          </div>
          <Button
            onClick={() => onSectionChange('experts')}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 shadow-md"
          >
            <Users className="w-5 h-5 mr-2" />
            Find Experts
          </Button>
        </div>
      </motion.div>

      {/* Experts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Recommended Researchers
          </h2>
          <Button variant="outline" onClick={() => onSectionChange('researchers')}>
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.researchers?.slice(0, 3).map((researcher) => (
            <ResearcherCard key={researcher.id} researcher={researcher} />
          ))}
        </div>
        {(!data.researchers || data.researchers.length === 0) && (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No researchers found. Try adjusting your conditions.</p>
          </Card>
        )}
      </div>

      {/* Clinical Trials Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Clinical Trials
          </h2>
          <Button variant="outline" onClick={() => onSectionChange('trials')}>
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.trials.slice(0, 4).map((trial, idx) => (
            <TrialCard key={trial.id || `trial-${idx}-${trial.title}`} trial={trial} />
          ))}
        </div>
        {data.trials.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No trials found. Try searching for a condition.</p>
          </Card>
        )}
      </div>

      {/* Publications Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Latest Publications
          </h2>
          <Button variant="outline" onClick={() => onSectionChange('publications')}>
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.publications.slice(0, 3).map((pub, idx) => (
            <PublicationCard key={pub.id || `pub-${idx}-${pub.title?.substring(0, 20)}`} publication={pub} />
          ))}
        </div>
        {data.publications.length === 0 && (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No publications found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// Expert Card Component
// Researcher Card Component
function ResearcherCard({ researcher, onFavoriteChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Check if already favorited on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const favoriteId = researcher.researcherProfileId || researcher.id;
      if (!favoriteId) return;
      
      try {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        const isFav = data.favorites?.some(fav => 
          fav.type === 'researcher' && (
            fav.data?.researcherProfileId === favoriteId ||
            fav.data?.id === favoriteId ||
            fav.itemId === favoriteId
          )
        );
        setIsFavorited(isFav);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    checkFavoriteStatus();
  }, [researcher.id, researcher.researcherProfileId]);

  const handleFavorite = async () => {
    try {
      // Use researcherProfileId if available, otherwise use id
      const favoriteId = researcher.researcherProfileId || researcher.id;
      
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?type=researcher&itemId=${favoriteId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setIsFavorited(false);
          if (onFavoriteChange) onFavoriteChange(); // Refresh favorites list
        }
      } else {
        // Add to favorites - include full researcher data for external items
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'researcher',
            itemId: favoriteId,
            itemData: researcher // Send full researcher object
          })
        });
        if (response.ok) {
          setIsFavorited(true);
          if (onFavoriteChange) onFavoriteChange(); // Refresh favorites list
        } else if (response.status === 409) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        const response = await fetch(`/api/researchers/follow?researcherId=${researcher.id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setIsFollowing(false);
        }
      } else {
        const response = await fetch('/api/researchers/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            researcherId: researcher.id,
            researcherName: researcher.name
          })
        });
        if (response.ok) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleNudge = async () => {
    setIsNudging(true);
    try {
      const response = await fetch('/api/researchers/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researcherId: researcher.id,
          researcherName: researcher.name,
          message: `I'm interested in your research on ${researcher.specialization}. Would you like to join Curalink?`
        })
      });
      if (response.ok) {
        alert('Invitation sent! The researcher will be notified.');
      }
    } catch (error) {
      console.error('Nudge error:', error);
    }
    setIsNudging(false);
  };

  const handleRequestMeeting = async (preferredDate, preferredTime, message) => {
    try {
      const response = await fetch('/api/researchers/meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researcherId: researcher.id,
          researcherName: researcher.name,
          message,
          preferredDate,
          preferredTime
        })
      });
      if (response.ok) {
        alert('Meeting request sent! You will be notified when the researcher responds.');
        setShowMeetingModal(false);
      }
    } catch (error) {
      console.error('Meeting request error:', error);
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">
            {researcher.name?.charAt(0).toUpperCase() || 'R'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg text-gray-800 truncate flex-1">{researcher.name || 'Researcher'}</h3>
              {/* Show favorite button for all researchers with any ID */}
              {(researcher.researcherProfileId || researcher.id) && (
                <button 
                  onClick={handleFavorite}
                  className={`shrink-0 transition-colors ${
                    isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{researcher.affiliation || 'Research Institution'}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {researcher.publicationCount || 0} publications
              </span>
              {researcher.locationScore >= 80 && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Near You
                </span>
              )}
              {researcher.isInternalResearcher && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                  ⭐ Curalink Researcher
                </span>
              )}
              {researcher.verified && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  ✓ Verified
                </span>
              )}
              {researcher.updatedAt && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  Updated {new Date(researcher.updatedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              )}
            </div>
            {researcher.location && researcher.location !== 'Not specified' && (
              <div className="flex items-center gap-1 mt-2 text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{researcher.location}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-4 line-clamp-2">
          Specializes in: {researcher.specialization}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowProfileModal(true)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View Profile
          </Button>
          <Button 
            size="sm" 
            variant={isFollowing ? "secondary" : "outline"}
            onClick={handleFollow}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleNudge}
            disabled={isNudging}
          >
            <Mail className="w-4 h-4 mr-1" />
            {isNudging ? 'Sending...' : 'Nudge to Join'}
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowMeetingModal(true)}
          >
            <Video className="w-4 h-4 mr-1" />
            Request Meeting
          </Button>
        </div>
      </Card>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{researcher.name}</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Affiliation</h3>
                <p className="text-gray-600">{researcher.affiliation}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Specialization</h3>
                <p className="text-gray-600">{researcher.specialization}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-gray-600">{researcher.location}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Publications ({researcher.publicationCount})</h3>
                <ul className="list-disc list-inside space-y-1">
                  {researcher.publications?.slice(0, 5).map((pub, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{pub}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Request Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Request Meeting</h2>
              <button onClick={() => setShowMeetingModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleRequestMeeting(
                formData.get('date'),
                formData.get('time'),
                formData.get('message')
              );
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Date</label>
                  <input type="date" name="date" className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Time</label>
                  <input type="time" name="time" className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea 
                    name="message" 
                    rows="3" 
                    className="w-full border rounded px-3 py-2"
                    placeholder="Tell the researcher why you'd like to meet..."
                  ></textarea>
                </div>
                <Button type="submit" className="w-full">Send Request</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


// Trial Card Component
function TrialCard({ trial, onFavoriteChange }) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  // Use id if available, otherwise use nctId as fallback
  const trialId = trial.id || trial.nctId;

  // Check if this trial is already favorited
  useEffect(() => {
    const checkFavorited = async () => {
      if (!trialId) return;
      
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const data = await response.json();
          const isAlreadyFavorited = data.favorites.some(
            fav => fav.type === 'trial' && (
              fav.data?.id === trialId ||
              fav.itemId === trialId
            )
          );
          setIsFavorited(isAlreadyFavorited);
        }
      } catch (error) {
        console.error('Error checking favorites:', error);
      }
    };

    checkFavorited();
  }, [trialId]);

  const handleFavorite = async () => {
    try {
      if (isFavorited) {
        const response = await fetch(`/api/favorites?type=trial&itemId=${trialId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setIsFavorited(false);
          if (onFavoriteChange) onFavoriteChange();
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'trial',
            itemId: trialId,
            itemData: trial // Send full trial object
          })
        });
        if (response.ok) {
          setIsFavorited(true);
          if (onFavoriteChange) onFavoriteChange();
        } else if (response.status === 409) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  // Generate AI-friendly summary for patients
  const getAiSummary = () => {
    if (trial.summary && trial.summary !== trial.description) {
      return trial.summary;
    }
    
    // Generate a 3-4 line summary with complete sentences
    const phaseLine = trial.phase ? `This is a ${trial.phase.replace(/_/g, ' ').toLowerCase()} clinical trial.` : 'This is a clinical trial.';
    const statusLine = `Current status: ${trial.status?.replace(/_/g, ' ') || 'Active'}.`;
    const locationLine = trial.location ? `Location: ${trial.location}.` : '';
    const descLine = trial.description ? `${trial.description.split('.')[0]}.` : 'This trial is investigating new treatments or interventions.';
    
    return `${phaseLine} ${statusLine} ${locationLine} ${descLine}`.trim();
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      const response = await fetch('/api/trials/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trialId: trial.id,
          trialTitle: trial.title,
          trialNctId: trial.nctId,
          trialLocation: trial.location,
          subject: emailForm.subject,
          message: emailForm.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Your inquiry has been sent successfully! The trial administrator will contact you soon.');
        setShowEmailModal(false);
        setEmailForm({ subject: '', message: '' });
      } else {
        alert('❌ Failed to send inquiry: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending inquiry:', error);
      alert('❌ Failed to send inquiry. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-lg text-gray-800 flex-1 line-clamp-2">{trial.title}</h3>
          {/* Show favorite button for all trials with any ID */}
          {(trial.id || trial.nctId) && (
            <button 
              onClick={handleFavorite}
              className={`shrink-0 ml-2 transition-colors ${
                isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{trial.description || trial.summary}</p>
        
        {/* AI Summary Toggle */}
        <button
          onClick={() => setShowAiSummary(!showAiSummary)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-3 font-medium"
        >
          <Sparkles className="w-4 h-4" />
          {showAiSummary ? 'Hide' : 'View'} AI Summary
        </button>

        {/* AI Summary Section */}
        {showAiSummary && (
          <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Easy-to-Understand Summary</span>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {getAiSummary()}
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm mb-4">
          {trial.phase && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                {trial.phase}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {trial.status || 'Active'}
              </span>
              {trial.isInternalTrial && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  ⭐ Curalink Trial
                </span>
              )}
            </div>
          )}
          {trial.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{trial.location}</span>
            </div>
          )}
        </div>
        <Button 
          className="w-full" 
          size="sm" 
          onClick={() => {
            const email = trial.contactEmail || 'contact@clinicaltrials.gov';
            const subject = encodeURIComponent(`Inquiry about ${trial.title}`);
            const body = encodeURIComponent(`Dear Trial Administrator,\n\nI am interested in learning more about the clinical trial:\n\nTitle: ${trial.title}\n${trial.nctId ? `NCT ID: ${trial.nctId}\n` : ''}${trial.location ? `Location: ${trial.location}\n` : ''}\n\nI would like to know more about eligibility criteria and how to participate.\n\nThank you for your time.\n\nBest regards`);
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`, '_blank');
          }}
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact Trial
        </Button>
      </Card>

      {/* Email Compose Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Contact Trial Administrator</h2>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              {/* Trial Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">{trial.title}</h3>
                {trial.nctId && (
                  <p className="text-sm text-gray-600">NCT ID: {trial.nctId}</p>
                )}
                {trial.location && (
                  <p className="text-sm text-gray-600">Location: {trial.location}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <Input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="e.g., Inquiry about trial eligibility"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Tell the trial administrator about yourself and why you're interested in this trial..."
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={sending} className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Inquiry'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowEmailModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Publication Card Component
function PublicationCard({ publication, onFavoriteChange }) {
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Check if this publication is already favorited
  useEffect(() => {
    const checkFavorited = async () => {
      if (!publication.id) return;
      
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const data = await response.json();
          const isAlreadyFavorited = data.favorites.some(
            fav => fav.type === 'publication' && (
              fav.data?.id === publication.id ||
              fav.itemId === publication.id
            )
          );
          setIsFavorited(isAlreadyFavorited);
        }
      } catch (error) {
        console.error('Error checking favorites:', error);
      }
    };

    checkFavorited();
  }, [publication.id]);

  const handleFavorite = async () => {
    try {
      if (isFavorited) {
        const response = await fetch(`/api/favorites?type=publication&itemId=${publication.id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setIsFavorited(false);
          if (onFavoriteChange) onFavoriteChange();
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'publication',
            itemId: publication.id,
            itemData: publication // Send full publication object
          })
        });
        if (response.ok) {
          setIsFavorited(true);
          if (onFavoriteChange) onFavoriteChange();
        } else if (response.status === 409) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  // Handle author display - authors can be an array of objects or strings
  const getAuthorDisplay = () => {
    if (!publication.authors || publication.authors.length === 0) {
      return 'Unknown Author';
    }
    
    const firstAuthor = publication.authors[0];
    if (typeof firstAuthor === 'string') {
      return firstAuthor;
    }
    
    // If it's an object, try to get fullName or construct from foreName/lastName
    if (typeof firstAuthor === 'object') {
      return firstAuthor.fullName || 
             `${firstAuthor.foreName || ''} ${firstAuthor.lastName || ''}`.trim() ||
             'Unknown Author';
    }
    
    return 'Unknown Author';
  };

  // Generate AI-friendly summary for patients
  const getAiSummary = () => {
    if (publication.summary && publication.summary !== publication.abstract) {
      return publication.summary;
    }
    
    // Generate a 3-4 line summary with complete sentences
    const abstract = publication.abstract || 'This research paper discusses important medical findings';
    const firstSentences = abstract.split('.').slice(0, 3).join('.') + '.'; // Get first 3 sentences
    const journalLine = publication.journal ? `Published in ${publication.journal}.` : '';
    const authorLine = `Research by ${getAuthorDisplay()}${publication.authors && publication.authors.length > 1 ? ' and colleagues' : ''}.`;
    
    return `${firstSentences} ${journalLine} ${authorLine}`.trim();
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-lg text-gray-800 line-clamp-2 flex-1">{publication.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {publication.isInternalPublication && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
              ⭐ Curalink
            </span>
          )}
          {/* Show favorite button for all publications with any ID */}
          {publication.id && (
            <button 
              onClick={handleFavorite}
              className={`transition-colors ${
                isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{publication.abstract || 'No abstract available'}</p>
      
      {/* AI Summary Toggle */}
      <button
        onClick={() => setShowAiSummary(!showAiSummary)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-3 font-medium"
      >
        <Sparkles className="w-4 h-4" />
        {showAiSummary ? 'Hide' : 'View'} AI Summary
      </button>

      {/* AI Summary Section */}
      {showAiSummary && (
        <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Easy-to-Understand Summary</span>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {getAiSummary()}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mb-3">
        {getAuthorDisplay()} • {publication.journal || 'Journal'}
      </div>
      {publication.url && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(publication.url, '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Read Full Paper
        </Button>
      )}
    </Card>
  );
}

// Content Components
function ResearchersContent({ researchers, onRefresh }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {researchers.map((researcher) => (
        <ResearcherCard key={researcher.id} researcher={researcher} onFavoriteChange={onRefresh} />
      ))}
      {researchers.length === 0 && (
        <div className="col-span-full text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No researchers found for the selected condition. Try a different condition.</p>
        </div>
      )}
    </div>
  );
}


function TrialsContent({ trials, onRefresh, phaseFilter, statusFilter }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {trials.map((trial, idx) => (
        <TrialCard key={trial.id || `trial-${idx}-${trial.title}`} trial={trial} onFavoriteChange={onRefresh} />
      ))}
      {trials.length === 0 && (
        <div className="col-span-full text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {phaseFilter || statusFilter 
              ? 'No clinical trials match your selected filters. Try adjusting the phase or status filters.'
              : 'No clinical trials found. Try adjusting your search criteria.'}
          </p>
        </div>
      )}
    </div>
  );
}

function PublicationsContent({ publications, onRefresh }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {publications.map((pub, idx) => (
        <PublicationCard key={pub.id || `pub-${idx}-${pub.title?.substring(0, 20)}`} publication={pub} onFavoriteChange={onRefresh} />
      ))}
      {publications.length === 0 && (
        <div className="col-span-full text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No publications found for the selected condition.</p>
          <p className="text-gray-400 text-sm mt-2">Try selecting a different condition or check back later.</p>
        </div>
      )}
    </div>
  );
}

function ForumsContent({ forums, currentUser }) {
  const [filteredForums, setFilteredForums] = useState(forums);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    let filtered = forums;

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category?.toLowerCase() === categoryFilter);
    }

    // Filter by status (answered/unanswered)
    if (statusFilter === 'answered') {
      filtered = filtered.filter(f => (f.commentCount || 0) > 0);
    } else if (statusFilter === 'unanswered') {
      filtered = filtered.filter(f => (f.commentCount || 0) === 0);
    }

    setFilteredForums(filtered);
  }, [forums, categoryFilter, statusFilter]);

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });

      if (response.ok) {
        alert('✅ Your question has been posted! Researchers will answer soon.');
        setShowCreatePost(false);
        setNewPost({ title: '', content: '', category: 'general' });
        window.location.reload();
      } else {
        alert('Failed to create post');
      }
    } catch (error) {
      alert('Error creating post');
    }
  };

  const handleDeletePost = async (postId, event) => {
    event.stopPropagation(); // Prevent opening the post modal
    
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/forums/${postId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('✅ Post deleted successfully');
        window.location.reload();
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      alert('Error deleting post');
    }
  };

  const handleViewPost = async (post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    
    try {
      const response = await fetch(`/api/forums/${post.id}`);
      if (response.ok) {
        const data = await response.json();
        setPostComments(data.post?.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {selectedPost.category || 'General'}
                  </span>
                  {(selectedPost.commentCount || 0) > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      ✓ Answered
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedPost.title}</h2>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-gray-500 hover:text-gray-700 ml-4">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Original Question */}
            <div className="p-6 bg-gray-50 border-b">
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{selectedPost.content}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Asked by: {typeof selectedPost.author === 'object' ? selectedPost.author?.name : selectedPost.author || 'Anonymous'}</span>
                <span>•</span>
                <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Comments/Answers Section */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {postComments.length} {postComments.length === 1 ? 'Answer' : 'Answers'} from Researchers
              </h3>
              
              {loadingComments ? (
                <div className="text-center py-8 text-gray-500">Loading answers...</div>
              ) : postComments.length > 0 ? (
                <div className="space-y-4">
                  {postComments.map((comment) => (
                    <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {comment.author?.avatar ? (
                            <img src={comment.author.avatar} alt={comment.author.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                              {comment.author?.name?.[0] || 'R'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-800">{comment.author?.name || 'Researcher'}</span>
                            {comment.author?.role === 'researcher' && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                Researcher
                              </span>
                            )}
                            {comment.author?.researcherProfile?.institution && (
                              <span className="text-xs text-gray-500">• {comment.author.researcherProfile.institution}</span>
                            )}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No answers yet. A researcher will respond soon!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header with Create Post Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Ask Researchers</h2>
        <Button onClick={() => setShowCreatePost(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ask a Question
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="treatment">Treatment</option>
            <option value="side-effects">Side Effects</option>
            <option value="clinical-trials">Clinical Trials</option>
            <option value="lifestyle">Lifestyle</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Posts</option>
            <option value="answered">Answered</option>
            <option value="unanswered">Waiting for Answer</option>
          </select>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <Card className="p-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Ask a Question</h3>
            <button onClick={() => setShowCreatePost(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="treatment">Treatment</option>
                <option value="side-effects">Side Effects</option>
                <option value="clinical-trials">Clinical Trials</option>
                <option value="lifestyle">Lifestyle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
              <Input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="What would you like to ask?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="Provide more details about your question..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <Button onClick={handleCreatePost} className="w-full">
              Post Question
            </Button>
          </div>
        </Card>
      )}

      {/* Forum Posts */}
      <div className="space-y-4">
        {filteredForums.map((forum, idx) => {
          console.log('Forum:', forum.id, 'Author ID:', forum.author?.id, 'Current User ID:', currentUser?.id, 'Match:', forum.author?.id === currentUser?.id);
          return (
          <Card 
            key={forum.id || `forum-${idx}`} 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewPost(forum)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {forum.category || 'General'}
                  </span>
                  {(forum.commentCount || 0) === 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                      Waiting for answer
                    </span>
                  )}
                  {(forum.commentCount || 0) > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      ✓ Answered
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">{forum.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{forum.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Asked by: {typeof forum.author === 'object' ? forum.author?.name : forum.author || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{forum.commentCount || forum.replies || 0} {(forum.commentCount || forum.replies || 0) === 1 ? 'answer' : 'answers'} from researchers</span>
                  <span>•</span>
                  <span>{new Date(forum.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {/* Show delete button only if current user is the author */}
              {currentUser && forum.author?.id === currentUser.id && (
                <button
                  onClick={(e) => handleDeletePost(forum.id, e)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete your post"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </Card>
        );
        })}
        {filteredForums.length === 0 && (
          <Card className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No questions found. Ask your first question!</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function FavoritesContent({ favorites, onRefresh }) {
  if (favorites.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No favorites yet. Start saving items you like!</p>
      </Card>
    );
  }

  // Group favorites by type
  const publications = favorites.filter(fav => fav.type === 'publication').map(fav => fav.data);
  const trials = favorites.filter(fav => fav.type === 'trial').map(fav => fav.data);
  const researchers = favorites.filter(fav => fav.type === 'researcher').map(fav => fav.data);

  return (
    <div className="space-y-8">
      {/* Favorited Publications */}
      {publications.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Saved Publications ({publications.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((pub) => (
              <PublicationCard key={pub.id || `pub-${pub.pmid || pub.title}`} publication={pub} onFavoriteChange={onRefresh} />
            ))}
          </div>
        </div>
      )}

      {/* Favorited Clinical Trials */}
      {trials.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Saved Clinical Trials ({trials.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trials.map((trial) => (
              <TrialCard key={trial.id || trial.nctId || `trial-${trial.title}`} trial={trial} onFavoriteChange={onRefresh} />
            ))}
          </div>
        </div>
      )}

      {/* Favorited Researchers */}
      {researchers.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Saved Researchers ({researchers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {researchers.map((researcher) => (
              <ResearcherCard key={researcher.id || researcher.researcherProfileId || `researcher-${researcher.name}`} researcher={researcher} onFavoriteChange={onRefresh} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileContent({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    age: user.patientProfile?.age || '',
    gender: user.patientProfile?.gender || '',
    conditions: user.patientProfile?.conditions?.join(', ') || '',
    emergencyContact: user.patientProfile?.emergencyContact || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          patientProfile: {
            age: parseInt(formData.age) || null,
            gender: formData.gender,
            conditions: formData.conditions.split(',').map(c => c.trim()).filter(Boolean),
            emergencyContact: formData.emergencyContact
          }
        })
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        setIsEditing(false);
        onUpdate();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <Card className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Patient Account
              </span>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Conditions (comma-separated)
              </label>
              <Input
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                placeholder="e.g., Diabetes, Hypertension"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="Name and phone number"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    age: user.patientProfile?.age || '',
                    gender: user.patientProfile?.gender || '',
                    conditions: user.patientProfile?.conditions?.join(', ') || '',
                    emergencyContact: user.patientProfile?.emergencyContact || ''
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Age</label>
                <p className="text-gray-900 text-lg">{user.patientProfile?.age || 'Not specified'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                <p className="text-gray-900 text-lg">{user.patientProfile?.gender || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Medical Conditions</label>
              {user.patientProfile?.conditions?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.patientProfile.conditions.map((condition, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-900">No conditions specified</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Emergency Contact</label>
              <p className="text-gray-900 text-lg">
                {user.patientProfile?.emergencyContact || 'Not specified'}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-500 mb-1">Account Created</label>
              <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Notifications Content Component
function NotificationsContent({ notifications, onRefresh, onMarkAsRead }) {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MEETING_REQUEST':
      case 'MEETING_ACCEPTED':
      case 'MEETING_REJECTED':
        return '📅';
      case 'FORUM_REPLY':
        return '💬';
      case 'NEW_FOLLOWER':
        return '👤';
      case 'NUDGE':
        return '👋';
      case 'NEW_MESSAGE':
        return '✉️';
      case 'SYSTEM':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'MEETING_ACCEPTED':
        return 'bg-green-50 border-green-200';
      case 'MEETING_REJECTED':
        return 'bg-red-50 border-red-200';
      case 'FORUM_REPLY':
        return 'bg-blue-50 border-blue-200';
      case 'MEETING_REQUEST':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <div className="flex gap-2">
          <Button 
            onClick={onRefresh}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Refresh
          </Button>
          {notifications.some(n => !n.read) && (
            <Button 
              onClick={onMarkAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-2">
              You will be notified when researchers respond to your questions or accept meeting requests
            </p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-5 border-l-4 transition-all ${
                !notification.read ? getNotificationColor(notification.type) : 'bg-white border-gray-200'
              } ${!notification.read ? 'shadow-md' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold text-lg ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </h3>
                      <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    {notification.metadata?.postTitle && (
                      <span className="text-blue-600">• {notification.metadata.postTitle}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
