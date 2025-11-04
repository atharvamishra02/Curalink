'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Beaker, 
  BookOpen, 
  MessageSquare, 
  Heart,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  UserPlus,
  CheckCircle,
  MapPin,
  Calendar,
  X,
  Bell,
  Video,
  Sparkles,
  Eye,
  UserCheck,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import HamburgerMenu from '@/components/HamburgerMenu';

export default function ResearcherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Data states
  const [collaborators, setCollaborators] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [experts, setExperts] = useState([]);
  const [myTrials, setMyTrials] = useState([]);
  const [externalTrials, setExternalTrials] = useState([]);
  const [publications, setPublications] = useState([]);
  const [externalPublications, setExternalPublications] = useState([]);
  const [forums, setForums] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    fetchUserData();
    fetchUnreadCount();
  }, []);

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
        console.log('User data from API:', data.user);
        console.log('Researcher Profile:', data.user?.researcherProfile);
        console.log('Publications:', data.user?.researcherProfile?.publications);
        console.log('Clinical Trials:', data.user?.researcherProfile?.clinicalTrials);
        if (data.user.role !== 'RESEARCHER') {
          router.push('/patient/dashboard');
          return;
        }
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchSectionData = async () => {
    setLoading(true);
    try {
      switch (activeSection) {
        case 'dashboard':
          await fetchDashboard();
          break;
        case 'researchers':
          await fetchResearchers();
          break;
        case 'experts':
          await fetchExperts();
          break;
        case 'collaborators':
          await fetchCollaborators();
          break;
        case 'trials':
          await fetchFavorites(); // Load favorites first
          await fetchMyTrials();
          break;
        case 'publications':
          await fetchFavorites(); // Load favorites first
          await fetchPublications();
          break;
        case 'forums':
          await fetchForums();
          break;
        case 'notifications':
          // Notifications will be fetched by the component
          // Reset unread count when viewing notifications
          setUnreadCount(0);
          break;
        case 'favorites':
          await fetchFavorites();
          break;
        case 'profile':
          // Profile data is already loaded in user state
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    const specialties = user?.researcherProfile?.specialties || [];
    const specialty = specialties[0] || 'Oncology';
    
    try {
      // Fetch user's own data and external data in parallel
      const [trialsRes, collabRes, forumsRes, pubsRes, researchersRes] = await Promise.all([
        fetch('/api/researcher/trials?limit=6'),
        fetch(`/api/researcher/collaborators?specialty=${encodeURIComponent(specialty)}&limit=6`),
        fetch('/api/forums?limit=6'),
        fetch('/api/researcher/publications'),
        fetch(`/api/researchers?condition=${encodeURIComponent(specialty)}&limit=6`)
      ]);

      const trials = await trialsRes.json();
      const collab = await collabRes.json();
      const forumsData = await forumsRes.json();
      const pubsData = await pubsRes.json();
      const researchersData = await researchersRes.json();

      // Fetch external trials and publications based on specialties
      let externalTrials = [];
      let externalPublications = [];
      
      if (specialties.length > 0) {
        try {
          // Fetch external trials for the first specialty
          const externalTrialsRes = await fetch(`/api/clinical-trials?condition=${encodeURIComponent(specialty)}&limit=6`);
          const externalTrialsData = await externalTrialsRes.json();
          externalTrials = externalTrialsData.trials || [];
          
          // Fetch external publications for the first specialty
          const externalPubsRes = await fetch(`/api/publications?condition=${encodeURIComponent(specialty)}&limit=6`);
          const externalPubsData = await externalPubsRes.json();
          externalPublications = externalPubsData.publications || [];
        } catch (err) {
          console.error('Error fetching external data:', err);
        }
      }

      // Filter out current user from researchers
      const filteredResearchers = (researchersData.researchers || []).filter(
        r => r.id !== user?.userId
      );

      setDashboardData({
        trials: trials.trials || [],
        externalTrials: externalTrials,
        collaborators: collab.collaborators || [],
        forums: forumsData.forums || [],
        publications: pubsData.publications || [],
        externalPublications: externalPublications,
        researchers: filteredResearchers
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setDashboardData({ 
        trials: [], 
        externalTrials: [],
        collaborators: [], 
        forums: [], 
        publications: [],
        externalPublications: [],
        researchers: []
      });
    }
  };

  const fetchResearchers = async () => {
    try {
      // If there's a search query, use it as the condition to search by specialty
      const condition = searchQuery && searchQuery.trim() 
        ? encodeURIComponent(searchQuery.trim())
        : 'general';
      
      let url = `/api/researchers?condition=${condition}&limit=100`;
      
      if (searchQuery && searchQuery.trim()) {
        // Also add as search parameter for name/institution search
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      
      if (locationFilter && locationFilter.trim()) {
        // Add location filter for proximity-based sorting
        url += `&location=${encodeURIComponent(locationFilter.trim())}`;
      }

      console.log('Fetching researchers with URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Researchers found:', data.researchers?.length || 0);
      
      // Filter out the current user
      const filteredResearchers = (data.researchers || []).filter(
        researcher => researcher.id !== user?.userId
      );
      
      setResearchers(filteredResearchers);
    } catch (error) {
      console.error('Error fetching researchers:', error);
      setResearchers([]);
    }
  };

  const fetchExperts = async () => {
    try {
      let url = '/api/researchers?condition=medicine&limit=100';
      
      if (searchQuery && searchQuery.trim()) {
        // If there's a search query, search by name, specialty, or institution
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      
      if (locationFilter && locationFilter.trim()) {
        // Add location filter for proximity-based sorting
        url += `&location=${encodeURIComponent(locationFilter.trim())}`;
      }

      console.log('Fetching experts with URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Experts found:', data.researchers?.length || 0);
      
      // Filter out the current user
      const filteredExperts = (data.researchers || []).filter(
        expert => expert.id !== user?.userId
      );
      
      setExperts(filteredExperts);
    } catch (error) {
      console.error('Error fetching experts:', error);
      setExperts([]);
    }
  };

  const fetchCollaborators = async () => {
    try {
      let url = '/api/researcher/collaborators?limit=100'; // Fetch more researchers
      if (searchQuery && searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      // Filter out the current user from the list
      const filteredCollaborators = (data.collaborators || []).filter(
        collab => collab.id !== user?.userId
      );
      
      setCollaborators(filteredCollaborators);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setCollaborators([]);
    }
  };

  const fetchMyTrials = async () => {
    try {
      // First get user's own trials
      const userTrialsResponse = await fetch('/api/researcher/trials');
      const userTrialsData = await userTrialsResponse.json();
      const userTrials = userTrialsData.trials || [];

      console.log('User trials:', userTrials.length);
      // Set user's own trials
      setMyTrials(userTrials);

      // Then search external clinical trials
      let searchConditions = [];
      
      if (searchQuery && searchQuery.trim()) {
        // If there's a search query, use it
        searchConditions = [searchQuery.trim()];
        console.log('Searching external trials for query:', searchQuery);
      } else {
        // Otherwise use researcher's specialties
        searchConditions = user?.researcherProfile?.specialties || [];
        console.log('Searching external trials for specialties:', searchConditions);
      }

      let externalTrials = [];
      if (searchConditions.length > 0) {
        // Search for each condition and combine results
        for (const condition of searchConditions) {
          try {
            const searchParams = new URLSearchParams();
            searchParams.append('condition', condition);
            searchParams.append('limit', '50');

            console.log(`Fetching trials for condition: ${condition}`);
            const externalResponse = await fetch(`/api/clinical-trials?${searchParams}`);
            const externalData = await externalResponse.json();
            const trials = externalData.trials || [];
            console.log(`  - Found ${trials.length} trials for ${condition}`);
            externalTrials.push(...trials);
          } catch (err) {
            console.error(`Error fetching trials for ${condition}:`, err);
          }
        }
        console.log('Total external trials collected:', externalTrials.length);
      }

      // Remove user's own trials from external list to avoid duplicates
      const filteredExternalTrials = externalTrials.filter(extTrial => 
        !userTrials.some(userTrial => 
          (extTrial.nctId && userTrial.nctId && extTrial.nctId === userTrial.nctId) ||
          (extTrial.id && userTrial.id && extTrial.id === userTrial.id)
        )
      );
      console.log('After removing user trials:', filteredExternalTrials.length);

      // Set external trials separately (remove duplicates)
      const uniqueTrials = filteredExternalTrials.filter((trial, index, self) =>
        index === self.findIndex((t) => 
          (t.nctId && trial.nctId && t.nctId === trial.nctId) ||
          (t.id && trial.id && t.id === trial.id)
        )
      );
      setExternalTrials(uniqueTrials);
      console.log('Final unique external trials:', uniqueTrials.length);
    } catch (error) {
      console.error('Error fetching trials:', error);
      setMyTrials([]);
      setExternalTrials([]);
    }
  };

  const fetchPublications = async () => {
    try {
      // First get user's own publications
      const userPubsResponse = await fetch('/api/researcher/publications');
      const userPubsData = await userPubsResponse.json();
      const userPubs = userPubsData.publications || [];

      console.log('User publications:', userPubs.length);
      // Set user's own publications
      setPublications(userPubs);

      // Then search external publications
      let searchConditions = [];
      
      if (searchQuery && searchQuery.trim()) {
        // If there's a search query, use it
        searchConditions = [searchQuery.trim()];
        console.log('Searching external publications for query:', searchQuery);
      } else {
        // Otherwise use researcher's specialties
        searchConditions = user?.researcherProfile?.specialties || [];
        console.log('Searching external publications for specialties:', searchConditions);
      }

      let externalPubs = [];
      if (searchConditions.length > 0) {
        // Search for each condition and combine results
        for (const condition of searchConditions) {
          try {
            const searchParams = new URLSearchParams();
            searchParams.append('condition', condition);
            searchParams.append('limit', '50');

            console.log(`Fetching publications for condition: ${condition}`);
            const externalResponse = await fetch(`/api/publications?${searchParams}`);
            const externalData = await externalResponse.json();
            const pubs = externalData.publications || [];
            console.log(`  - Found ${pubs.length} publications for ${condition}`);
            console.log(`  - Internal: ${externalData.internal || 0}, External: ${externalData.external || 0}`);
            externalPubs.push(...pubs);
          } catch (err) {
            console.error(`Error fetching publications for ${condition}:`, err);
          }
        }
        console.log('Total external publications collected:', externalPubs.length);
      }

      // Remove user's own publications from external list to avoid duplicates
      const filteredExternalPubs = externalPubs.filter(extPub => 
        !userPubs.some(userPub => 
          (extPub.pmid && userPub.pmid && extPub.pmid === userPub.pmid) ||
          (extPub.doi && userPub.doi && extPub.doi === userPub.doi) ||
          (extPub.id && userPub.id && extPub.id === userPub.id)
        )
      );
      console.log('After removing user publications:', filteredExternalPubs.length);

      // Set external publications separately (remove duplicates)
      const uniquePubs = filteredExternalPubs.filter((pub, index, self) =>
        index === self.findIndex((p) => 
          (p.pmid && pub.pmid && p.pmid === pub.pmid) ||
          (p.doi && pub.doi && p.doi === pub.doi) ||
          (p.id && pub.id && p.id === pub.id)
        )
      );
      setExternalPublications(uniquePubs);
      console.log('Final unique external publications:', uniquePubs.length);
    } catch (error) {
      console.error('Error fetching publications:', error);
      setPublications([]);
      setExternalPublications([]);
    }
  };

  const fetchForums = async () => {
    try {
      const response = await fetch('/api/forums?limit=50');
      const data = await response.json();
      setForums(data.forums || []);
    } catch (error) {
      console.error('Error fetching forums:', error);
      setForums([]);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    }
  };

  const toggleFavorite = async (itemType, itemId, itemData = null) => {
    try {
      // Check if already favorited
      const isFav = favorites.some(fav => {
        // Check using the formatted structure from the API
        if (fav.type === itemType && fav.itemId === itemId) {
          return true;
        }
        // Also check raw database fields as fallback
        if (itemType === 'trial') {
          return fav.clinicalTrialId === itemId || fav.externalId === itemId;
        }
        if (itemType === 'publication') {
          return fav.publicationId === itemId || fav.externalId === itemId;
        }
        return false;
      });

      if (isFav) {
        // Remove from favorites - use query parameters for DELETE
        const response = await fetch(`/api/favorites?type=${itemType}&itemId=${encodeURIComponent(itemId)}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Update local state - filter out the removed item
          setFavorites(favorites.filter(fav => {
            // Filter using the formatted structure
            if (fav.type === itemType && fav.itemId === itemId) {
              return false;
            }
            // Also filter using raw database fields
            if (itemType === 'trial') {
              return fav.clinicalTrialId !== itemId && fav.externalId !== itemId;
            }
            if (itemType === 'publication') {
              return fav.publicationId !== itemId && fav.externalId !== itemId;
            }
            return true;
          }));
        } else {
          const errorData = await response.json();
          console.error('Failed to remove favorite:', errorData);
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: itemType,
            itemId,
            itemData: itemData // Include the full item data
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Add the new favorite with the formatted structure including data
          setFavorites([...favorites, {
            id: data.favorite.id,
            type: itemType,
            itemId: itemId,
            data: itemData, // Store the full item data
            isExternal: data.favorite.isExternal
          }]);
        } else {
          const errorData = await response.json();
          // If it's a 409 conflict, it means it's already favorited but not in our local state
          // Just refresh favorites to sync
          if (response.status === 409) {
            console.log('Item already favorited, refreshing favorites...');
            await fetchFavorites();
          } else {
            console.error('Failed to add favorite:', errorData);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isFavorited = (itemType, itemId) => {
    return favorites.some(fav => {
      // Check using the formatted structure from the API (fav.type and fav.itemId)
      if (fav.type === itemType && fav.itemId === itemId) {
        return true;
      }
      // Also check raw database fields as fallback
      if (itemType === 'trial') {
        return fav.clinicalTrialId === itemId || fav.externalId === itemId;
      }
      if (itemType === 'publication') {
        return fav.publicationId === itemId || fav.externalId === itemId;
      }
      return false;
    });
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getSectionTitle = () => {
    const titles = {
      dashboard: 'Researcher Dashboard',
      researchers: 'Researchers',
      experts: 'Experts',
      collaborators: 'Collaborators',
      trials: 'My Clinical Trials',
      publications: 'Publications',
      forums: 'Forums',
      notifications: 'Notifications',
      favorites: 'Favorites'
    };
    return titles[activeSection] || 'Dashboard';
  };

  const getSectionDescription = () => {
    const descriptions = {
      dashboard: 'Manage your research activities and collaborations',
      researchers: 'Discover and connect with fellow researchers',
      experts: 'Find medical experts and specialists',
      collaborators: 'Your network of collaborators',
      trials: 'Search and manage clinical trials',
      publications: 'Search and manage your research publications',
      forums: 'Engage in community discussions',
      notifications: 'View meeting requests and invitations',
      favorites: 'Your saved items'
    };
    return descriptions[activeSection] || '';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HamburgerMenu 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        user={user}
        onLogout={handleLogout}
        isResearcher={true}
        unreadCount={unreadCount}
      />

      <div className="pr-20 pl-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {getSectionTitle()}
            </h1>
            <p className="text-lg text-gray-600">{getSectionDescription()}</p>
          </div>

          {/* Search Bar (for trials section) */}
          {activeSection === 'trials' && (
            <div className="mb-6">
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search clinical trials by condition or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchMyTrials();
                    }
                  }}
                />
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  size="sm"
                  onClick={fetchMyTrials}
                >
                  Search
                </Button>
              </div>
            </div>
          )}

          {/* Search Bar (for publications section) */}
          {activeSection === 'publications' && (
            <div className="mb-6">
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search publications by topic or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchPublications();
                    }
                  }}
                />
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  size="sm"
                  onClick={fetchPublications}
                >
                  Search
                </Button>
              </div>
            </div>
          )}

          {/* Search Bar (for researchers section) */}
          {activeSection === 'researchers' && (
            <div className="mb-6">
              <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
                {/* Name/Specialty Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by name, specialty, or institution..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchResearchers();
                      }
                    }}
                  />
                </div>

                {/* Location Search */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Filter by location (city, state, or country)..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchResearchers();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Search Actions */}
              <div className="flex gap-2 mt-4 max-w-4xl">
                <Button 
                  size="sm"
                  onClick={fetchResearchers}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                {(searchQuery || locationFilter) && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setLocationFilter('');
                      setTimeout(fetchResearchers, 0);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Search Bar (for experts section) */}
          {activeSection === 'experts' && (
            <div className="mb-6">
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search experts by name, specialty, or field..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-28 py-3 w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchExperts();
                    }
                  }}
                />
                {searchQuery && (
                  <Button 
                    className="absolute right-24 top-1/2 transform -translate-y-1/2"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      fetchExperts();
                    }}
                  >
                    Clear
                  </Button>
                )}
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  size="sm"
                  onClick={fetchExperts}
                >
                  Search
                </Button>
              </div>
            </div>
          )}

          {/* Search Bar (for collaborators section) */}
          {activeSection === 'collaborators' && (
            <div className="mb-6">
              <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
                {/* Name/Specialty Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by name, specialty, or institution..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchCollaborators();
                      }
                    }}
                  />
                </div>

                {/* Location Search */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Filter by location (city, state, or country)..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchCollaborators();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Search Actions */}
              <div className="flex gap-2 mt-4 max-w-4xl">
                <Button 
                  size="sm"
                  onClick={fetchCollaborators}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                {(searchQuery || locationFilter) && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setLocationFilter('');
                      setTimeout(fetchCollaborators, 0);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Content Sections */}
          {!loading && (
            <>
              {activeSection === 'dashboard' && (
                <DashboardContent 
                  data={dashboardData} 
                  onSectionChange={setActiveSection}
                  user={user}
                />
              )}

              {activeSection === 'researchers' && (
                <ResearchersContent researchers={researchers} />
              )}

              {activeSection === 'experts' && (
                <ExpertsContent experts={experts} />
              )}

              {activeSection === 'collaborators' && (
                <CollaboratorsContent collaborators={collaborators} />
              )}

              {activeSection === 'trials' && (
                <TrialsContent 
                  userTrials={myTrials} 
                  externalTrials={externalTrials}
                  onRefresh={fetchMyTrials}
                  onUserDataRefresh={fetchUserData}
                  toggleFavorite={toggleFavorite}
                  isFavorited={isFavorited}
                />
              )}

              {activeSection === 'publications' && (
                <PublicationsContent 
                  userPublications={publications}
                  externalPublications={externalPublications}
                  onRefresh={fetchPublications}
                  onUserDataRefresh={fetchUserData}
                  toggleFavorite={toggleFavorite}
                  isFavorited={isFavorited}
                />
              )}

              {activeSection === 'forums' && (
                <ForumsContent forums={forums} />
              )}

              {activeSection === 'notifications' && (
                <NotificationsContent />
              )}

              {activeSection === 'favorites' && (
                <FavoritesContent favorites={favorites} />
              )}

              {activeSection === 'profile' && user && (
                <ProfileContent user={user} onUpdate={fetchUserData} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Dashboard Overview Component
function DashboardContent({ data, onSectionChange }) {
  const [connecting, setConnecting] = useState({});
  const [following, setFollowing] = useState({});
  const router = useRouter();

  if (!data) return null;

  const handleViewProfile = (researcher) => {
    alert(`Viewing profile of ${researcher.name}\n\nEmail: ${researcher.email || 'N/A'}\nInstitution: ${researcher.affiliation || researcher.institution || 'N/A'}\nPublications: ${researcher.publicationCount || 0}`);
  };

  const handleViewTrial = (trial) => {
    // If it has a URL, open it
    if (trial.url) {
      window.open(trial.url, '_blank');
    } else if (trial.nctId) {
      // For ClinicalTrials.gov trials
      window.open(`https://clinicaltrials.gov/ct2/show/${trial.nctId}`, '_blank');
    } else {
      // Show modal with details
      alert(`${trial.title}\n\nStatus: ${trial.status}\nDescription: ${trial.description || trial.briefSummary || 'No description available'}\nLocation: ${trial.location || trial.locations || 'N/A'}`);
    }
  };

  const handleViewPublication = (pub) => {
    // If it has a DOI, open it
    if (pub.doi) {
      window.open(`https://doi.org/${pub.doi}`, '_blank');
    } else if (pub.pmid) {
      // For PubMed publications
      window.open(`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`, '_blank');
    } else if (pub.url) {
      window.open(pub.url, '_blank');
    } else {
      // Show modal with details
      alert(`${pub.title}\n\nAuthors: ${pub.authors?.map(a => typeof a === 'string' ? a : a.fullName || `${a.foreName} ${a.lastName}`).join(', ') || 'Unknown'}\nJournal: ${pub.journal || 'N/A'}\nYear: ${pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : 'N/A'}`);
    }
  };

  const handleConnect = async (researcherId) => {
    setConnecting(prev => ({ ...prev, [researcherId]: true }));
    try {
      const response = await fetch('/api/researcher/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaboratorId: researcherId })
      });

      if (response.ok) {
        alert('Connection request sent!');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending connection request');
    } finally {
      setConnecting(prev => ({ ...prev, [researcherId]: false }));
    }
  };

  const handleFollow = async (researcherId) => {
    setFollowing(prev => ({ ...prev, [researcherId]: true }));
    try {
      const response = await fetch('/api/researchers/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ researcherId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to follow researcher');
      }

      alert('Successfully followed researcher!');
      window.location.reload();
    } catch (error) {
      console.error('Error following researcher:', error);
      alert(error.message || 'Error following researcher');
      setFollowing(prev => ({ ...prev, [researcherId]: false }));
    }
  };

  const stats = [
    {
      icon: <Beaker className="w-6 h-6" />,
      label: 'My Active Trials',
      value: data.trials?.length || 0,
      color: 'blue',
      action: () => onSectionChange('trials')
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: 'My Collaborators',
      value: data.collaborators?.length || 0,
      color: 'green',
      action: () => onSectionChange('collaborators')
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      label: 'Forum Topics',
      value: data.forums?.length || 0,
      color: 'purple',
      action: () => onSectionChange('forums')
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      label: 'My Publications',
      value: data.publications?.length || 0,
      color: 'orange',
      action: () => onSectionChange('publications')
    }
  ];

  // Combine and limit items for display
  const allTrials = [...(data.trials || []), ...(data.externalTrials || [])].slice(0, 6);
  const allPublications = [...(data.publications || []), ...(data.externalPublications || [])].slice(0, 6);
  const displayResearchers = (data.researchers || []).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={index}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={stat.action}
          >
            <div className={`text-${stat.color}-600 mb-3`}>{stat.icon}</div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-gray-600 text-sm">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Researchers Section */}
      {displayResearchers.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Researchers in Your Field</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {displayResearchers.map((researcher) => (
              <Card key={researcher.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{researcher.name}</h3>
                    <p className="text-sm text-gray-600">{researcher.affiliation || researcher.institution}</p>
                  </div>
                </div>
                {researcher.specialty && (
                  <div className="mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {researcher.specialty}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {researcher.publicationCount || 0} Publications
                  </div>
                </div>
                {!researcher.isInternalResearcher && (
                  <div className="mb-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Source: {researcher.source}
                    </span>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {/* View Profile Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleViewProfile(researcher)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>

                  {/* Follow Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${researcher.isFollowing ? 'bg-green-50 border-green-300 text-green-700' : ''}`}
                    onClick={() => handleFollow(researcher.id)}
                    disabled={following[researcher.id] || !researcher.isInternalResearcher || researcher.isFollowing}
                  >
                    {following[researcher.id] ? (
                      'Following...'
                    ) : researcher.isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Followed
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        {!researcher.isInternalResearcher ? 'Not on Platform' : 'Follow'}
                      </>
                    )}
                  </Button>

                  {/* Connect Button */}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect(researcher.id)}
                    disabled={connecting[researcher.id] || !researcher.isInternalResearcher}
                    title={!researcher.isInternalResearcher ? 'This researcher is not registered on the platform' : ''}
                  >
                    {connecting[researcher.id] ? 'Connecting...' : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {!researcher.isInternalResearcher ? 'Not on Platform' : 'Connect'}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Trials Section */}
      {allTrials.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Clinical Trials</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {allTrials.map((trial) => (
              <Card key={trial.id || trial.nctId} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    trial.status === 'RECRUITING' || trial.status === 'Recruiting' ? 'bg-green-100 text-green-700' :
                    trial.status === 'ACTIVE' || trial.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {trial.status}
                  </span>
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2">{trial.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trial.description || trial.briefSummary}</p>
                {(trial.location || trial.locations) && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    {trial.location || (Array.isArray(trial.locations) ? trial.locations[0] : trial.locations)}
                  </div>
                )}
                
                {/* View Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleViewTrial(trial)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Publications Section */}
      {allPublications.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Publications</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {allPublications.map((pub) => {
              // Handle author - could be string or object
              let authorName = 'Unknown Author';
              if (pub.authors && Array.isArray(pub.authors) && pub.authors.length > 0) {
                const firstAuthor = pub.authors[0];
                if (typeof firstAuthor === 'string') {
                  authorName = firstAuthor;
                } else if (firstAuthor.fullName) {
                  authorName = firstAuthor.fullName;
                } else if (firstAuthor.foreName && firstAuthor.lastName) {
                  authorName = `${firstAuthor.foreName} ${firstAuthor.lastName}`;
                } else if (firstAuthor.lastName) {
                  authorName = firstAuthor.lastName;
                }
              } else if (pub.author) {
                authorName = pub.author;
              }

              return (
                <Card key={pub.id || pub.pmid} className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold mb-2 line-clamp-2">{pub.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {pub.abstract || pub.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="line-clamp-1">{authorName}</span>
                    <span>{pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : pub.publishedDate ? new Date(pub.publishedDate).getFullYear() : 'N/A'}</span>
                  </div>
                  {pub.journal && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-1">{pub.journal}</p>
                  )}
                  
                  {/* View Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleViewPublication(pub)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Publication
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Researchers Content Component
function ResearchersContent({ researchers }) {
  const [connecting, setConnecting] = useState({});
  const [following, setFollowing] = useState({});
  const [accepting, setAccepting] = useState({});
  const router = useRouter();

  const handleConnect = async (researcherId) => {
    setConnecting(prev => ({ ...prev, [researcherId]: true }));
    try {
      const response = await fetch('/api/researcher/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaboratorId: researcherId })
      });

      if (response.ok) {
        alert('Connection request sent!');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending connection request');
    } finally {
      setConnecting(prev => ({ ...prev, [researcherId]: false }));
    }
  };

  const handleAccept = async (connectionId, researcherName) => {
    setAccepting(prev => ({ ...prev, [connectionId]: true }));
    try {
      const response = await fetch('/api/researcher/connect', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      });

      if (response.ok) {
        alert(`You are now connected with ${researcherName}!`);
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to accept connection');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error accepting connection');
    } finally {
      setAccepting(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleChat = (researcherId, researcherName) => {
    // Navigate to chat page
    router.push(`/researcher/chat?userId=${researcherId}&userName=${encodeURIComponent(researcherName)}`);
  };

  const handleFollow = async (researcherId) => {
    setFollowing(prev => ({ ...prev, [researcherId]: true }));
    try {
      const response = await fetch('/api/researchers/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ researcherId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to follow researcher');
      }

      // Show success message (can be replaced with a toast notification)
      alert('Successfully followed researcher!');
      
      // Refresh the page to update the follow status
      window.location.reload();
    } catch (error) {
      console.error('Error following researcher:', error);
      alert(error.message || 'Error following researcher');
      setFollowing(prev => ({ ...prev, [researcherId]: false }));
    }
  };

  const handleViewProfile = (researcher) => {
    // TODO: Navigate to researcher profile or open modal
    alert(`Viewing profile of ${researcher.name}\n\nEmail: ${researcher.email}\nInstitution: ${researcher.affiliation || researcher.institution || 'N/A'}\nPublications: ${researcher.publicationCount || 0}`);
  };

  if (researchers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Researchers Found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {researchers.map((researcher) => (
        <Card key={researcher.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{researcher.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{researcher.email}</p>
              {(researcher.affiliation || researcher.institution) && (
                <p className="text-xs text-gray-500 mb-1">
                  {researcher.affiliation || researcher.institution}
                </p>
              )}
              {researcher.location && researcher.location !== 'Not specified' && (
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {researcher.location}
                </div>
              )}
            </div>
          </div>

          {/* Specialties */}
          {((researcher.specialties && researcher.specialties.length > 0) || researcher.specialty) && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Field of Study:</p>
              <div className="flex flex-wrap gap-2">
                {researcher.specialties && researcher.specialties.length > 0 ? (
                  researcher.specialties.slice(0, 3).map((specialty, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {specialty}
                    </span>
                  ))
                ) : researcher.specialty ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {researcher.specialty}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* Bio or Research Interests */}
          {(researcher.bio || researcher.researchInterests || researcher.specialization) && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {researcher.bio || researcher.researchInterests || researcher.specialization}
            </p>
          )}

          {/* Meeting Availability */}
          {researcher.availableForMeetings && researcher.meetingSchedule && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-800 mb-1">Available for Meetings</p>
                  <p className="text-xs text-green-700 whitespace-pre-line line-clamp-3">
                    {researcher.meetingSchedule}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Publication and Trial Count */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {researcher.publicationCount || 0} Publications
            </div>
            {researcher.trialCount !== undefined && (
              <div className="flex items-center">
                <Beaker className="w-4 h-4 mr-1" />
                {researcher.trialCount} Trials
              </div>
            )}
          </div>

          {/* Source Badge - Show if external */}
          {!researcher.isInternalResearcher && researcher.source && (
            <div className="mb-4">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Source: {researcher.source}
              </span>
            </div>
          )}

          {/* Three Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* View Profile Button - Always visible */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleViewProfile(researcher)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </Button>

            {/* Follow Button - Disabled for external researchers */}
            <Button
              variant="outline"
              size="sm"
              className={`w-full ${researcher.isFollowing ? 'bg-green-50 border-green-300 text-green-700' : ''}`}
              onClick={() => handleFollow(researcher.id)}
              disabled={following[researcher.id] || !researcher.isInternalResearcher || researcher.isFollowing}
            >
              {following[researcher.id] ? (
                'Following...'
              ) : researcher.isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Followed
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  {!researcher.isInternalResearcher ? 'Not on Platform' : 'Follow'}
                </>
              )}
            </Button>

            {/* Connection Button - Changes based on status */}
            {researcher.connectionStatus === 'accepted' ? (
              // Already connected - Show Chat button
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleChat(researcher.id, researcher.name)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
            ) : researcher.connectionStatus === 'pending' && researcher.isReceivedByMe ? (
              // Received request - Show Accept button
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handleAccept(researcher.connectionId, researcher.name)}
                disabled={accepting[researcher.connectionId]}
              >
                {accepting[researcher.connectionId] ? 'Accepting...' : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Request
                  </>
                )}
              </Button>
            ) : researcher.connectionStatus === 'pending' && researcher.isSentByMe ? (
              // Sent request - Show pending status
              <Button
                size="sm"
                className="w-full"
                disabled
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Request Pending
              </Button>
            ) : (
              // No connection - Show Request to Connect
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleConnect(researcher.id)}
                disabled={connecting[researcher.id] || !researcher.isInternalResearcher}
                title={!researcher.isInternalResearcher ? 'This researcher is not registered on the platform' : ''}
              >
                {connecting[researcher.id] ? 'Sending...' : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {!researcher.isInternalResearcher ? 'Not on Platform' : 'Request to Connect'}
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Experts Content Component  
function ExpertsContent({ experts }) {
  const [connecting, setConnecting] = useState({});

  const handleConnect = async (expertId) => {
    setConnecting(prev => ({ ...prev, [expertId]: true }));
    try {
      const response = await fetch('/api/researcher/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaboratorId: expertId })
      });

      if (response.ok) {
        alert('Connection request sent!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending connection request');
    } finally {
      setConnecting(prev => ({ ...prev, [expertId]: false }));
    }
  };

  if (experts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Experts Found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {experts.map((expert) => (
        <Card key={expert.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{expert.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{expert.email}</p>
              {(expert.affiliation || expert.institution) && (
                <p className="text-xs text-gray-500 mb-1">
                  {expert.affiliation || expert.institution}
                </p>
              )}
              {expert.location && expert.location !== 'Not specified' && (
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {expert.location}
                </div>
              )}
            </div>
          </div>

          {/* Specialties */}
          {((expert.specialties && expert.specialties.length > 0) || expert.specialty) && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Field of Study:</p>
              <div className="flex flex-wrap gap-2">
                {expert.specialties && expert.specialties.length > 0 ? (
                  expert.specialties.slice(0, 3).map((specialty, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {specialty}
                    </span>
                  ))
                ) : expert.specialty ? (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {expert.specialty}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* Bio or Research Interests */}
          {(expert.bio || expert.researchInterests || expert.specialization) && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {expert.bio || expert.researchInterests || expert.specialization}
            </p>
          )}

          {/* Meeting Availability */}
          {expert.availableForMeetings && expert.meetingSchedule && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-800 mb-1">Available for Meetings</p>
                  <p className="text-xs text-green-700 whitespace-pre-line line-clamp-3">
                    {expert.meetingSchedule}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Publication and Trial Count */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {expert.publicationCount || 0} Publications
            </div>
            {expert.trialCount !== undefined && (
              <div className="flex items-center">
                <Beaker className="w-4 h-4 mr-1" />
                {expert.trialCount} Trials
              </div>
            )}
          </div>

          {/* Source Badge - Show if external */}
          {!expert.isInternalResearcher && expert.source && (
            <div className="mb-3">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Source: {expert.source}
              </span>
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => handleConnect(expert.id)}
            disabled={connecting[expert.id] || !expert.isInternalResearcher}
            title={!expert.isInternalResearcher ? 'This expert is not registered on the platform' : ''}
          >
            {connecting[expert.id] ? 'Sending...' : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                {!expert.isInternalResearcher ? 'Not on Platform' : 'Connect'}
              </>
            )}
          </Button>
        </Card>
      ))}
    </div>
  );
}

// Collaborators Content Component
function CollaboratorsContent({ collaborators }) {
  const [connecting, setConnecting] = useState({});
  const [accepting, setAccepting] = useState({});
  const router = useRouter();

  const handleConnect = async (collaboratorId) => {
    setConnecting(prev => ({ ...prev, [collaboratorId]: true }));
    try {
      const response = await fetch('/api/researcher/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaboratorId: collaboratorId })
      });

      if (response.ok) {
        alert('Connection request sent!');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending connection request');
    } finally {
      setConnecting(prev => ({ ...prev, [collaboratorId]: false }));
    }
  };

  const handleAccept = async (connectionId, collaboratorName) => {
    setAccepting(prev => ({ ...prev, [connectionId]: true }));
    try {
      const response = await fetch('/api/researcher/connect', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      });

      if (response.ok) {
        alert(`You are now connected with ${collaboratorName}!`);
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to accept connection');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error accepting connection');
    } finally {
      setAccepting(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleChat = (collaboratorId, collaboratorName) => {
    // Navigate to chat page
    router.push(`/researcher/chat?userId=${collaboratorId}&userName=${encodeURIComponent(collaboratorName)}`);
  };

  if (collaborators.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Collaborators Found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collaborators.map((collaborator) => (
        <Card key={collaborator.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{collaborator.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{collaborator.email}</p>
              {collaborator.institution && (
                <p className="text-xs text-gray-500">{collaborator.institution}</p>
              )}
            </div>
          </div>

          {/* Connection Status Badge */}
          {collaborator.connectionStatus && (
            <div className="mb-3">
              <span className={`px-2 py-1 text-xs rounded-full ${
                collaborator.connectionStatus === 'accepted' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {collaborator.connectionStatus === 'accepted' ? 'Connected' : 'Request Pending'}
              </span>
            </div>
          )}

          {collaborator.specialties && collaborator.specialties.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Field of Study:</p>
              <div className="flex flex-wrap gap-2">
                {collaborator.specialties.map((specialty, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {collaborator.researchInterests && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{collaborator.researchInterests}</p>
          )}

          {/* Meeting Availability */}
          {collaborator.availableForMeetings && collaborator.meetingSchedule && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-800 mb-1">Available for Meetings</p>
                  <p className="text-xs text-green-700 whitespace-pre-line line-clamp-3">
                    {collaborator.meetingSchedule}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {collaborator.publicationCount || 0} Publications
            </div>
          </div>

          {/* Conditional Button based on connection status */}
          {collaborator.connectionStatus === 'accepted' ? (
            // Already connected - Show Chat button
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => handleChat(collaborator.id, collaborator.name)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
          ) : collaborator.connectionStatus === 'pending' && collaborator.isReceivedByMe ? (
            // Received request - Show Accept button
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleAccept(collaborator.connectionId, collaborator.name)}
              disabled={accepting[collaborator.connectionId]}
            >
              {accepting[collaborator.connectionId] ? 'Accepting...' : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Request
                </>
              )}
            </Button>
          ) : collaborator.connectionStatus === 'pending' && collaborator.isSentByMe ? (
            // Sent request - Show pending status
            <Button
              className="w-full"
              disabled
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Request Pending
            </Button>
          ) : (
            // No connection - Show Connect button
            <Button
              className="w-full"
              onClick={() => handleConnect(collaborator.id)}
              disabled={connecting[collaborator.id]}
            >
              {connecting[collaborator.id] ? 'Sending...' : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}

// Trial Card Component with AI Summary
function TrialCard({ trial, isUserTrial, toggleFavorite, isFavorited }) {
  const [showAiSummary, setShowAiSummary] = useState(false);
  const trialId = trial.id || trial.nctId;
  const favorited = isFavorited('trial', trialId);
  
  // Generate AI-friendly summary
  const getAiSummary = () => {
    if (trial.summary && trial.summary !== trial.description) {
      return trial.summary;
    }
    
    // Generate a 2-3 line summary with complete sentences
    const phaseLine = trial.phase ? `This is a ${trial.phase.replace(/_/g, ' ').toLowerCase()} clinical trial.` : 'This is a clinical trial.';
    const statusLine = `Current status: ${trial.status?.replace(/_/g, ' ') || 'Active'}.`;
    const locationLine = trial.location ? `Location: ${trial.location}.` : '';
    
    return `${phaseLine} ${statusLine} ${locationLine}`.trim();
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            trial.status === 'RECRUITING' ? 'bg-green-100 text-green-700' :
            trial.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
            trial.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {trial.status}
          </span>
          {!isUserTrial && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              External
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite('trial', trialId, trial)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              className={`w-5 h-5 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
          <span className="text-xs text-gray-500">{trial.phase}</span>
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-2">{trial.title}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-3">{trial.description || trial.summary}</p>
      
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
            <span className="text-sm font-semibold text-blue-900">Quick Summary</span>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {getAiSummary()}
          </div>
        </div>
      )}

      {trial.nctId && (
        <div className="mb-2">
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
            NCT ID: {trial.nctId}
          </span>
        </div>
      )}

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          {trial.location}
        </div>
        {trial.startDate && (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(trial.startDate).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {isUserTrial && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              alert(`Edit functionality coming soon for: ${trial.title}`);
            }}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => {
            if (trial.url) {
              window.open(trial.url, '_blank');
            } else if (trial.nctId) {
              window.open(`https://clinicaltrials.gov/study/${trial.nctId}`, '_blank');
            } else {
              alert(`Trial: ${trial.title}\n\nDescription: ${trial.description || trial.summary}\n\nLocation: ${trial.location}\nStatus: ${trial.status}\nPhase: ${trial.phase}`);
            }
          }}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          View
        </Button>
      </div>
    </Card>
  );
}

// Trials Content Component
function TrialsContent({ userTrials, externalTrials, onRefresh, onUserDataRefresh, toggleFavorite, isFavorited }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrial, setNewTrial] = useState({
    title: '',
    description: '',
    condition: '',
    phase: 'PHASE_1',
    status: 'RECRUITING',
    startDate: '',
    estimatedEndDate: '',
    location: '',
    eligibilityCriteria: ''
  });
  const [adding, setAdding] = useState(false);

  const handleAddTrial = async (e) => {
    e.preventDefault();
    setAdding(true);

    try {
      // Transform data to match API expectations
      const trialData = {
        title: newTrial.title,
        description: newTrial.description,
        condition: newTrial.condition,
        phase: newTrial.phase,
        status: newTrial.status,
        location: newTrial.location,
        startDate: newTrial.startDate,
        endDate: newTrial.estimatedEndDate, // API expects 'endDate'
        eligibilityCriteria: newTrial.eligibilityCriteria || null // Send as string or null
      };

      const response = await fetch('/api/researcher/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialData)
      });

      if (response.ok) {
        alert('Trial added successfully!');
        setShowAddModal(false);
        setNewTrial({
          title: '',
          description: '',
          condition: '',
          phase: 'PHASE_1',
          status: 'RECRUITING',
          startDate: '',
          estimatedEndDate: '',
          location: '',
          eligibilityCriteria: ''
        });
        onRefresh();
        // Also refresh user data to update the count in profile
        if (onUserDataRefresh) onUserDataRefresh();
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Failed to add trial: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding trial');
    } finally {
      setAdding(false);
    }
  };

  const renderTrialCard = (trial, isUserTrial = false) => {
    const trialId = trial.id || trial.nctId;
    return <TrialCard key={trialId} trial={trial} isUserTrial={isUserTrial} toggleFavorite={toggleFavorite} isFavorited={isFavorited} />;
  };

  return (
    <>
      <div className="mb-6">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Trial
        </Button>
      </div>

      {/* Your Clinical Trials */}
      {userTrials.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Clinical Trials</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {userTrials.map((trial) => renderTrialCard(trial, true))}
          </div>
        </div>
      )}

      {userTrials.length === 0 && externalTrials.length === 0 && (
        <Card className="p-12 text-center">
          <Beaker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Trials Yet</h3>
          <p className="text-gray-600 mb-4">Start by adding your first clinical trial</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Trial
          </Button>
        </Card>
      )}

      {/* External Clinical Trials */}
      {externalTrials.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Related Clinical Trials from External Sources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {externalTrials.map((trial) => renderTrialCard(trial, false))}
          </div>
        </div>
      )}

      {/* Add Trial Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Add New Clinical Trial</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTrial} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Trial Title *</label>
                <Input
                  value={newTrial.title}
                  onChange={(e) => setNewTrial({ ...newTrial, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={4}
                  value={newTrial.description}
                  onChange={(e) => setNewTrial({ ...newTrial, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Condition *</label>
                  <Input
                    value={newTrial.condition}
                    onChange={(e) => setNewTrial({ ...newTrial, condition: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phase *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    value={newTrial.phase}
                    onChange={(e) => setNewTrial({ ...newTrial, phase: e.target.value })}
                    required
                  >
                    <option value="PHASE_1">Phase 1</option>
                    <option value="PHASE_2">Phase 2</option>
                    <option value="PHASE_3">Phase 3</option>
                    <option value="PHASE_4">Phase 4</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    value={newTrial.status}
                    onChange={(e) => setNewTrial({ ...newTrial, status: e.target.value })}
                    required
                  >
                    <option value="RECRUITING">Recruiting</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location *</label>
                  <Input
                    value={newTrial.location}
                    onChange={(e) => setNewTrial({ ...newTrial, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={newTrial.startDate}
                    onChange={(e) => setNewTrial({ ...newTrial, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Estimated End Date</label>
                  <Input
                    type="date"
                    value={newTrial.estimatedEndDate}
                    onChange={(e) => setNewTrial({ ...newTrial, estimatedEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Eligibility Criteria</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                  rows={10}
                  value={newTrial.eligibilityCriteria}
                  onChange={(e) => setNewTrial({ ...newTrial, eligibilityCriteria: e.target.value })}
                  placeholder="Inclusion Criteria:&#10;&#10;• Adults aged 30–70 years with confirmed solid tumors&#10;• Patients eligible for either immunotherapy or chemotherapy regimens&#10;• Baseline cardiac function within normal limits&#10;&#10;Exclusion Criteria:&#10;&#10;• Pre-existing cardiovascular disease or arrhythmias&#10;• Concurrent participation in another interventional trial&#10;• Pregnant or lactating women"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter inclusion and exclusion criteria. Use bullet points or numbered lists for clarity.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={adding} className="flex-1">
                  {adding ? 'Adding...' : 'Add Trial'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
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

// Publication Card Component with AI Summary
function PublicationCard({ publication, index, isUserPub, toggleFavorite, isFavorited }) {
  const [showAiSummary, setShowAiSummary] = useState(false);
  const pubId = publication.id || publication.pmid;
  const favorited = isFavorited('publication', pubId);
  
  // Generate AI-friendly summary
  const getAiSummary = () => {
    if (publication.aiSummary) {
      return publication.aiSummary;
    }
    
    // Generate a 2-3 line summary from abstract
    const abstract = publication.abstract || 'This research paper discusses important findings';
    const firstSentences = abstract.split('.').slice(0, 2).join('.') + '.'; // Get first 2 sentences
    const journalLine = publication.journal ? `Published in ${publication.journal}.` : '';
    
    return `${firstSentences} ${journalLine}`.trim();
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-lg flex-1">{publication.title}</h3>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => toggleFavorite('publication', pubId, publication)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              className={`w-5 h-5 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
          {!isUserPub && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              PubMed
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        {publication.journal} • {publication.publishedDate ? new Date(publication.publishedDate).toLocaleDateString() : publication.year || 'Date not available'}
      </p>
      {publication.authors && publication.authors.length > 0 && (
        <p className="text-xs text-gray-500 mb-2">
          Authors: {publication.authors.slice(0, 3).map(a => a.name).join(', ')}
          {publication.authors.length > 3 && ` +${publication.authors.length - 3} more`}
        </p>
      )}
      {publication.abstract && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{publication.abstract}</p>
      )}
      
      {/* AI Summary Toggle */}
      <button
        onClick={() => setShowAiSummary(!showAiSummary)}
        className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 mb-3 font-medium"
      >
        <Sparkles className="w-4 h-4" />
        {showAiSummary ? 'Hide' : 'View'} AI Summary
      </button>

      {/* AI Summary Section */}
      {showAiSummary && (
        <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Quick Summary</span>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {getAiSummary()}
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        {publication.doi && (
          <span className="text-xs text-gray-500">DOI: {publication.doi}</span>
        )}
        {publication.pmid && (
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
            PMID: {publication.pmid}
          </span>
        )}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            if (publication.url) {
              window.open(publication.url, '_blank');
            } else if (publication.pmid) {
              window.open(`https://pubmed.ncbi.nlm.nih.gov/${publication.pmid}/`, '_blank');
            } else if (publication.doi) {
              window.open(`https://doi.org/${publication.doi}`, '_blank');
            } else {
              alert(`Publication: ${publication.title}\n\nJournal: ${publication.journal}\nAuthors: ${publication.authors?.map(a => a.name).join(', ')}\n\n${publication.abstract || 'No abstract available'}`);
            }
          }}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          View
        </Button>
      </div>
    </Card>
  );
}

// Publications Content Component
function PublicationsContent({ userPublications, externalPublications, onRefresh, onUserDataRefresh, toggleFavorite, isFavorited }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPublication, setNewPublication] = useState({
    title: '',
    journal: '',
    publishedDate: '',
    doi: '',
    abstract: '',
    aiSummary: ''
  });
  const [adding, setAdding] = useState(false);

  const handleAddPublication = async (e) => {
    e.preventDefault();
    setAdding(true);

    try {
      const response = await fetch('/api/researcher/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPublication)
      });

      if (response.ok) {
        alert('Publication added successfully!');
        setShowAddModal(false);
        setNewPublication({
          title: '',
          journal: '',
          publishedDate: '',
          doi: '',
          abstract: '',
          aiSummary: ''
        });
        onRefresh();
        // Also refresh user data to update the count in profile
        if (onUserDataRefresh) onUserDataRefresh();
      } else {
        alert('Failed to add publication');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding publication');
    } finally {
      setAdding(false);
    }
  };

  const renderPublicationCard = (pub, index, isUserPub = false) => {
    const pubId = pub.id || pub.pmid || `pub-${index}`;
    return <PublicationCard key={pubId} publication={pub} index={index} isUserPub={isUserPub} toggleFavorite={toggleFavorite} isFavorited={isFavorited} />;
  };

  return (
    <>
      <div className="mb-6">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Publication
        </Button>
      </div>

      {/* Your Publications */}
      {userPublications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Publications</h2>
          <div className="space-y-4">
            {userPublications.map((pub, index) => renderPublicationCard(pub, index, true))}
          </div>
        </div>
      )}

      {userPublications.length === 0 && externalPublications.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Publications Yet</h3>
          <p className="text-gray-600 mb-4">Add your research publications</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Publication
          </Button>
        </Card>
      )}

      {/* External Publications from PubMed */}
      {externalPublications.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Related Publications from PubMed</h2>
          <div className="space-y-4">
            {externalPublications.map((pub, index) => renderPublicationCard(pub, index, false))}
          </div>
        </div>
      )}

      {/* Add Publication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Add Publication</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPublication} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={newPublication.title}
                  onChange={(e) => setNewPublication({ ...newPublication, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Journal *</label>
                  <Input
                    value={newPublication.journal}
                    onChange={(e) => setNewPublication({ ...newPublication, journal: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Published Date *</label>
                  <Input
                    type="date"
                    value={newPublication.publishedDate}
                    onChange={(e) => setNewPublication({ ...newPublication, publishedDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">DOI</label>
                <Input
                  value={newPublication.doi}
                  onChange={(e) => setNewPublication({ ...newPublication, doi: e.target.value })}
                  placeholder="10.1000/xyz123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Abstract</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={4}
                  value={newPublication.abstract}
                  onChange={(e) => setNewPublication({ ...newPublication, abstract: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">AI Summary</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={3}
                  value={newPublication.aiSummary}
                  onChange={(e) => setNewPublication({ ...newPublication, aiSummary: e.target.value })}
                  placeholder="Brief AI-generated summary of key findings..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={adding} className="flex-1">
                  {adding ? 'Adding...' : 'Add Publication'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
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

// Forums Content Component
function ForumsContent({ forums }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: []
  });
  const [creating, setCreating] = useState(false);
  const [comment, setComment] = useState('');
  const [postDetails, setPostDetails] = useState(null);

  const categories = [
    { value: 'general', label: 'General Discussion' },
    { value: 'research', label: 'Research & Methodology' },
    { value: 'clinical-trials', label: 'Clinical Trials' },
    { value: 'publications', label: 'Publications' },
    { value: 'qa', label: 'Questions & Answers' },
    { value: 'collaboration', label: 'Collaboration Opportunities' }
  ];

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });

      if (response.ok) {
        alert('Post created successfully!');
        setShowCreateModal(false);
        setNewPost({
          title: '',
          content: '',
          category: 'GENERAL',
          tags: []
        });
        window.location.reload();
      } else {
        alert('Failed to create post');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating post');
    } finally {
      setCreating(false);
    }
  };

  const handleViewPost = async (postId) => {
    try {
      const response = await fetch(`/api/forums/${postId}`);
      const data = await response.json();
      setPostDetails(data.post);
      setShowPostDetail(true);
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Error loading post details');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !postDetails) return;

    try {
      const response = await fetch(`/api/forums/${postDetails.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment })
      });

      if (response.ok) {
        const data = await response.json();
        setPostDetails({
          ...postDetails,
          comments: [...(postDetails.comments || []), data.comment]
        });
        setComment('');
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding comment');
    }
  };

  const getCategoryColor = (category) => {
    // Handle both object and string formats
    const categoryName = typeof category === 'object' 
      ? (category?.name || category?.slug || '').toLowerCase() 
      : (category || '').toLowerCase();
    
    const colors = {
      'general': 'bg-gray-100 text-gray-700',
      'research': 'bg-blue-100 text-blue-700',
      'clinical-trials': 'bg-green-100 text-green-700',
      'clinical trials': 'bg-green-100 text-green-700',
      'publications': 'bg-purple-100 text-purple-700',
      'qa': 'bg-yellow-100 text-yellow-700',
      'questions & answers': 'bg-yellow-100 text-yellow-700',
      'collaboration': 'bg-pink-100 text-pink-700',
      'collaboration opportunities': 'bg-pink-100 text-pink-700'
    };
    return colors[categoryName] || colors['general'];
  };

  return (
    <>
      <div className="mb-6">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Discussion
        </Button>
      </div>

      {forums.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Forum Topics</h3>
          <p className="text-gray-600 mb-4">Start engaging with the community</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Post
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {forums.map((forum) => (
            <Card 
              key={forum.id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewPost(forum.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(forum.category)}`}>
                      {typeof forum.category === 'object' ? forum.category?.name || 'General' : forum.category}
                    </span>
                    {forum.isPinned && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Pinned
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{forum.title}</h3>
                </div>
                <span className="text-xs text-gray-500">{new Date(forum.createdAt).toLocaleDateString()}</span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{forum.content}</p>
              
              {forum.tags && forum.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {forum.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {forum.commentCount || 0} Comments
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {forum.viewCount || 0} Views
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {forum.author?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-xs">{forum.author?.name}</p>
                    {forum.author?.institution && (
                      <p className="text-xs text-gray-500">{forum.author.institution}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create Discussion</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="What would you like to discuss?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content *</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={8}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share your thoughts, questions, or insights..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <Input
                  value={newPost.tags.join(', ')}
                  onChange={(e) => setNewPost({ 
                    ...newPost, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  })}
                  placeholder="e.g., oncology, immunotherapy, methodology"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? 'Creating...' : 'Create Post'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {showPostDetail && postDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(postDetails.category)}`}>
                  {typeof postDetails.category === 'object' ? postDetails.category?.name || 'General' : postDetails.category}
                </span>
                {postDetails.isPinned && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Pinned
                  </span>
                )}
              </div>
              <button onClick={() => setShowPostDetail(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{postDetails.title}</h2>
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {postDetails.author?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{postDetails.author?.name}</p>
                  {postDetails.author?.researcherProfile?.institution && (
                    <p className="text-sm text-gray-600">{postDetails.author.researcherProfile.institution}</p>
                  )}
                  {postDetails.author?.researcherProfile?.specialties && (
                    <p className="text-xs text-gray-500">{postDetails.author.researcherProfile.specialties.join(', ')}</p>
                  )}
                </div>
                <span className="ml-auto text-sm text-gray-500">
                  {new Date(postDetails.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{postDetails.content}</p>
              </div>

              {postDetails.tags && postDetails.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {postDetails.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b">
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {postDetails.comments?.length || 0} Comments
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {postDetails.viewCount || 0} Views
                </div>
              </div>

              {/* Comments Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Comments</h3>
                
                {postDetails.comments && postDetails.comments.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {postDetails.comments.map((cmt) => (
                      <div key={cmt.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {cmt.author?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm">{cmt.author?.name}</p>
                                {cmt.author?.researcherProfile?.institution && (
                                  <p className="text-xs text-gray-500">{cmt.author.researcherProfile.institution}</p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(cmt.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">{cmt.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-6">No comments yet. Be the first to comment!</p>
                )}

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="space-y-3">
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    required
                  />
                  <Button type="submit">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Favorites Content Component
function FavoritesContent({ favorites }) {
  if (favorites.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
        <p className="text-gray-600">Items you favorite will appear here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => (
        <Card key={favorite.id} className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <span className="text-xs text-gray-500 uppercase">{favorite.type}</span>
              <h3 className="font-semibold text-lg mt-1">{favorite.title}</h3>
            </div>
            <Heart className="w-5 h-5 text-red-500 fill-current" />
          </div>
          <p className="text-gray-600 text-sm mb-3">{favorite.description}</p>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-1" />
            View
          </Button>
        </Card>
      ))}
    </div>
  );
}

// Profile Content Component
function ProfileContent({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    specialties: user.researcherProfile?.specialties?.join(', ') || '',
    institution: user.researcherProfile?.institution || '',
    location: user.researcherProfile?.location || '',
    bio: user.researcherProfile?.bio || '',
    researchInterests: user.researcherProfile?.researchInterests || '',
    availableForMeetings: user.researcherProfile?.availableForMeetings || false,
    meetingSchedule: user.researcherProfile?.meetingSchedule || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/researcher/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: formData.bio,
          institution: formData.institution,
          location: formData.location,
          specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
          researchInterests: formData.researchInterests,
          availableForMeetings: formData.availableForMeetings,
          meetingSchedule: formData.meetingSchedule
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
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Researcher Account
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties (comma-separated)
              </label>
              <Input
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="e.g., Oncology, Immunology"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
              <Input
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Your affiliated institution"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State/Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief professional biography"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Research Interests</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows={3}
                value={formData.researchInterests}
                onChange={(e) => setFormData({ ...formData, researchInterests: e.target.value })}
                placeholder="Your research interests and focus areas"
              />
            </div>

            {/* Meeting Schedule Section */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="availableForMeetings"
                  checked={formData.availableForMeetings}
                  onChange={(e) => setFormData({ ...formData, availableForMeetings: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="availableForMeetings" className="text-sm font-medium text-gray-700">
                  Available for Meetings
                </label>
              </div>
              
              {formData.availableForMeetings && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Schedule
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows={3}
                    value={formData.meetingSchedule}
                    onChange={(e) => setFormData({ ...formData, meetingSchedule: e.target.value })}
                    placeholder="e.g., Available Mon-Fri, 9 AM - 5 PM EST"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Let others know when you&apos;re available for meetings
                  </p>
                </div>
              )}
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
                    specialties: user.researcherProfile?.specialties?.join(', ') || '',
                    institution: user.researcherProfile?.institution || '',
                    location: user.researcherProfile?.location || '',
                    bio: user.researcherProfile?.bio || '',
                    researchInterests: user.researcherProfile?.researchInterests || '',
                    availableForMeetings: user.researcherProfile?.availableForMeetings || false,
                    meetingSchedule: user.researcherProfile?.meetingSchedule || ''
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Specialties</label>
              {user.researcherProfile?.specialties?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.researcherProfile.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-900">No specialties specified</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Institution</label>
              <p className="text-gray-900 text-lg">
                {user.researcherProfile?.institution || 'Not specified'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
              <p className="text-gray-900 text-lg">
                {user.researcherProfile?.location || 'Not specified'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
              <p className="text-gray-900 leading-relaxed">
                {user.researcherProfile?.bio || 'No bio provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Research Interests</label>
              <p className="text-gray-900 leading-relaxed">
                {user.researcherProfile?.researchInterests || 'No research interests specified'}
              </p>
            </div>

            {user.researcherProfile?.availableForMeetings && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <label className="block text-sm font-medium text-green-800 mb-2">
                  Available for Meetings
                </label>
                <p className="text-gray-900 whitespace-pre-line">
                  {user.researcherProfile?.meetingSchedule || 'Schedule not specified'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Publications</label>
              <p className="text-gray-900 text-lg">
                {user.researcherProfile?.publications?.length || 0} publications
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Clinical Trials</label>
              <p className="text-gray-900 text-lg">
                {user.researcherProfile?.clinicalTrials?.length || 0} trials
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
function NotificationsContent() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MEETING_REQUEST':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'NUDGE':
        return <UserPlus className="w-5 h-5 text-purple-600" />;
      case 'CONNECTION_REQUEST':
        return <Users className="w-5 h-5 text-green-600" />;
      case 'MESSAGE':
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No notifications yet</h3>
          <p className="text-gray-600">
            You&apos;ll see meeting requests, collaboration invites, and other updates here
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-gray-700 mt-1">{notification.message}</p>

                  {notification.metadata && (
                    <div className="mt-3 space-y-2">
                      {/* Patient Personal Details for MEETING_REQUEST and NUDGE */}
                      {(notification.type === 'MEETING_REQUEST' || notification.type === 'NUDGE') && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                          <h5 className="font-semibold text-gray-800 text-sm mb-2">
                            {notification.type === 'MEETING_REQUEST' ? 'Patient Details:' : 'Inviter Details:'}
                          </h5>
                          {(notification.metadata.requesterName || notification.metadata.senderName) && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Name:</span> {notification.metadata.requesterName || notification.metadata.senderName}
                            </p>
                          )}
                          {(notification.metadata.requesterEmail || notification.metadata.senderEmail) && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Email:</span> {notification.metadata.requesterEmail || notification.metadata.senderEmail}
                            </p>
                          )}
                          {notification.metadata.patientCondition && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Condition:</span> {notification.metadata.patientCondition}
                            </p>
                          )}
                          {notification.metadata.patientAge && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Age:</span> {notification.metadata.patientAge}
                            </p>
                          )}
                          {notification.metadata.patientGender && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Gender:</span> {notification.metadata.patientGender}
                            </p>
                          )}
                          {notification.metadata.patientLocation && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Location:</span> {notification.metadata.patientLocation}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Other metadata */}
                      <div className="text-sm text-gray-600 space-y-1">
                        {notification.metadata.preferredDate && (
                          <p className="font-medium text-gray-700">
                            Preferred Date: {new Date(notification.metadata.preferredDate).toLocaleDateString()}
                          </p>
                        )}
                        {notification.metadata.preferredTime && (
                          <p className="font-medium text-gray-700">
                            Preferred Time: {notification.metadata.preferredTime}
                          </p>
                        )}
                        {(notification.metadata.message || notification.metadata.customMessage) && (
                          <p className="italic text-gray-600 mt-2">
                            &quot;{notification.metadata.message || notification.metadata.customMessage}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </span>
                    {!notification.read && (
                      <span className="text-xs font-medium text-blue-600">New</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
