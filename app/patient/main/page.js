'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HamburgerMenu from '@/components/HamburgerMenu';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Search, 
  MapPin, 
  Filter,
  Calendar,
  Users,
  ExternalLink,
  Heart,
  Mail,
  Eye,
  UserPlus,
  Bell,
  Video,
  TrendingUp,
  BookOpen,
  MessageSquare
} from 'lucide-react';

export default function PatientMainPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [conditionFilters, setConditionFilters] = useState([]);
  
  // Data states
  const [experts, setExperts] = useState([]);
  const [trials, setTrials] = useState([]);
  const [publications, setPublications] = useState([]);
  const [forums, setForums] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSectionData();
    }
  }, [activeSection, user, searchQuery, locationFilter, conditionFilters]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Set initial condition filters from user profile
        if (data.user.patientProfile?.conditions) {
          setConditionFilters(data.user.patientProfile.conditions);
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
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
          await fetchExperts();
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
    const condition = conditionFilters[0] || searchQuery;
    if (!condition) return;

    const [pubsRes, trialsRes, expertsRes] = await Promise.all([
      fetch(`/api/publications?condition=${encodeURIComponent(condition)}&limit=6`),
      fetch(`/api/clinical-trials?condition=${encodeURIComponent(condition)}&limit=6`),
      fetch(`/api/experts?specialties=${encodeURIComponent(condition)}&limit=6`)
    ]);

    const pubs = await pubsRes.json();
    const trials = await trialsRes.json();
    const experts = await expertsRes.json();

    setDashboardData({
      publications: pubs.publications || [],
      trials: trials.trials || [],
      experts: experts.experts || []
    });
  };

  const fetchExperts = async () => {
    let url = '/api/experts?limit=20';
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    if (conditionFilters.length > 0) url += `&specialties=${encodeURIComponent(conditionFilters.join(','))}`;
    if (locationFilter) url += `&location=${encodeURIComponent(locationFilter)}`;

    const response = await fetch(url);
    const data = await response.json();
    setExperts(data.experts || []);
  };

  const fetchTrials = async () => {
    let url = '/api/clinical-trials?limit=20';
    if (searchQuery) url += `&keyword=${encodeURIComponent(searchQuery)}`;
    if (conditionFilters.length > 0) url += `&condition=${encodeURIComponent(conditionFilters.join(','))}`;
    if (locationFilter) url += `&location=${encodeURIComponent(locationFilter)}`;

    const response = await fetch(url);
    const data = await response.json();
    setTrials(data.trials || []);
  };

  const fetchPublications = async () => {
    const condition = searchQuery || conditionFilters[0];
    if (!condition) return;

    const response = await fetch(`/api/publications?condition=${encodeURIComponent(condition)}&limit=20`);
    const data = await response.json();
    setPublications(data.publications || []);
  };

  const fetchForums = async () => {
    const response = await fetch('/api/forums');
    const data = await response.json();
    setForums(data.forums || []);
  };

  const fetchFavorites = async () => {
    const response = await fetch('/api/favorites');
    const data = await response.json();
    setFavorites(data.favorites || []);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addConditionFilter = (condition) => {
    if (!conditionFilters.includes(condition)) {
      setConditionFilters([...conditionFilters, condition]);
    }
  };

  const removeConditionFilter = (condition) => {
    setConditionFilters(conditionFilters.filter(c => c !== condition));
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <HamburgerMenu 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="pl-20 pr-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {activeSection === 'dashboard' && 'Your Dashboard'}
            {activeSection === 'experts' && 'Health Experts'}
            {activeSection === 'trials' && 'Clinical Trials'}
            {activeSection === 'publications' && 'Publications'}
            {activeSection === 'forums' && 'Forums'}
            {activeSection === 'favorites' && 'Favorites'}
          </h1>
          <p className="text-gray-600">
            {activeSection === 'dashboard' && 'Personalized recommendations based on your conditions'}
            {activeSection === 'experts' && 'Find and connect with specialists worldwide'}
            {activeSection === 'trials' && 'Search for ongoing clinical trials'}
            {activeSection === 'publications' && 'Latest research papers and articles'}
            {activeSection === 'forums' && 'Community discussions and Q&A'}
            {activeSection === 'favorites' && 'Your saved items'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                icon={Search}
                placeholder={`Search ${activeSection}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {(activeSection === 'experts' || activeSection === 'trials') && (
              <div className="w-64">
                <Input
                  icon={MapPin}
                  placeholder="Location (City, Country)"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
            )}
            <Button onClick={fetchSectionData} className="whitespace-nowrap">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>

          {/* Condition Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Conditions:</span>
            {conditionFilters.map((condition) => (
              <span
                key={condition}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
              >
                {condition}
                <button
                  onClick={() => removeConditionFilter(condition)}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newCondition = prompt('Add a condition:');
                if (newCondition) addConditionFilter(newCondition);
              }}
            >
              + Add Condition
            </Button>
          </div>
        </div>

        {/* Content Sections */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div>
            {/* Dashboard Section */}
            {activeSection === 'dashboard' && dashboardData && (
              <DashboardContent data={dashboardData} onSectionChange={setActiveSection} />
            )}

            {/* Experts Section */}
            {activeSection === 'experts' && (
              <ExpertsContent experts={experts} />
            )}

            {/* Trials Section */}
            {activeSection === 'trials' && (
              <TrialsContent trials={trials} />
            )}

            {/* Publications Section */}
            {activeSection === 'publications' && (
              <PublicationsContent publications={publications} />
            )}

            {/* Forums Section */}
            {activeSection === 'forums' && (
              <ForumsContent forums={forums} />
            )}

            {/* Favorites Section */}
            {activeSection === 'favorites' && (
              <FavoritesContent favorites={favorites} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ data, onSectionChange }) {
  return (
    <div className="space-y-8">
      {/* Experts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Recommended Experts
          </h2>
          <Button variant="outline" onClick={() => onSectionChange('experts')}>
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.experts.slice(0, 3).map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
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
          {data.trials.slice(0, 4).map((trial) => (
            <TrialCard key={trial.id} trial={trial} />
          ))}
        </div>
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
          {data.publications.slice(0, 3).map((pub) => (
            <PublicationCard key={pub.id} publication={pub} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Expert Card Component
function ExpertCard({ expert }) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
          {expert.user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">{expert.user?.name}</h3>
          <p className="text-sm text-gray-600">{expert.institution}</p>
          {expert.specialties && (
            <div className="flex flex-wrap gap-1 mt-2">
              {expert.specialties.slice(0, 2).map((spec, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" className="flex-1">
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        <Button size="sm" variant="outline" onClick={() => setIsFollowing(!isFollowing)}>
          <UserPlus className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline">
          <Video className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

// Trial Card Component
function TrialCard({ trial }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg text-gray-800 flex-1">{trial.title}</h3>
        <button className="text-gray-400 hover:text-red-500">
          <Heart className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{trial.description}</p>
      <div className="space-y-2 text-sm">
        {trial.phase && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
              {trial.phase}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              {trial.status}
            </span>
          </div>
        )}
        {trial.location && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            {trial.location}
          </div>
        )}
      </div>
      <Button 
        className="w-full mt-4" 
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
  );
}

// Publication Card Component
function PublicationCard({ publication }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{publication.title}</h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{publication.abstract}</p>
      <div className="text-xs text-gray-500 mb-3">
        {publication.authors?.[0]} • {publication.journal}
      </div>
      <Button variant="outline" size="sm" className="w-full">
        <ExternalLink className="w-4 h-4 mr-2" />
        Read Full Paper
      </Button>
    </Card>
  );
}

// Experts Content Component
function ExpertsContent({ experts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {experts.map((expert) => (
        <ExpertCard key={expert.id} expert={expert} />
      ))}
      {experts.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          No experts found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}

// Trials Content Component
function TrialsContent({ trials }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {trials.map((trial) => (
        <TrialCard key={trial.id} trial={trial} />
      ))}
      {trials.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          No clinical trials found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}

// Publications Content Component
function PublicationsContent({ publications }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {publications.map((pub) => (
        <PublicationCard key={pub.id} publication={pub} />
      ))}
      {publications.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          No publications found. Try searching for a condition.
        </div>
      )}
    </div>
  );
}

// Forums Content Component
function ForumsContent({ forums }) {
  return (
    <div className="space-y-4">
      {forums.map((forum) => (
        <Card key={forum.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 mb-2">{forum.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{forum.content}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{forum.author}</span>
                <span>•</span>
                <span>{forum.replies} replies</span>
              </div>
            </div>
            <MessageSquare className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
      ))}
      {forums.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No forum posts yet. Be the first to start a discussion!</p>
        </Card>
      )}
    </div>
  );
}

// Favorites Content Component
function FavoritesContent({ favorites }) {
  return (
    <div className="space-y-6">
      {favorites.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No favorites yet. Start saving items you like!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <Card key={fav.id} className="p-6">
              <p className="text-gray-600">Favorite content here</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
