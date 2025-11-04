'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Users, 
  Briefcase,
  Mail,
  Filter,
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function ExpertsPage() {
  const router = useRouter();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    specialty: '',
    location: '',
    availableForMeetings: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  const specialties = [
    'Oncology',
    'Cardiology',
    'Neurology',
    'Immunology',
    'Clinical Trials',
    'Genetics',
    'Pediatrics',
    'All Specialties'
  ];

  // Fetch user data and auto-search based on their conditions
  useEffect(() => {
    const fetchUserAndExperts = async () => {
      try {
        // Get user data to find their conditions
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          
          // Auto-search based on patient's conditions
          if (userData.user?.patientProfile?.conditions?.length > 0) {
            const condition = userData.user.patientProfile.conditions[0];
            setSearchQuery(condition);
            // Auto-search for experts in this condition
            await performSearch(condition);
          } else {
            // If no conditions, just load all experts
            await performSearch('');
          }
        } else {
          // Not logged in or error, just load all experts
          await performSearch('');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // On error, just load all experts
        await performSearch('');
      }
    };

    fetchUserAndExperts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = async (query = searchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (filters.specialty && filters.specialty !== 'All Specialties') {
        params.append('specialty', filters.specialty);
      }
      if (filters.location) params.append('location', filters.location);
      if (filters.availableForMeetings) params.append('available', 'true');

      const response = await fetch(`/api/experts?${params.toString()}`);
      const data = await response.json();
      setExperts(data.experts || []);
    } catch (error) {
      console.error('Error fetching experts:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchExperts = async () => {
    await performSearch();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchExperts();
  };

  const clearFilters = () => {
    setFilters({
      specialty: '',
      location: '',
      availableForMeetings: false,
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/patient/dashboard')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-7 h-7 mr-2 text-blue-600" />
              Expert Directory
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Auto-filter Notice */}
        {user?.patientProfile?.conditions?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Smart Search:</span> Showing experts matched to your condition: <strong>{user.patientProfile.conditions[0]}</strong>
              {user.patientProfile.city && ` near ${user.patientProfile.city}`}. You can search for different specialties below.
            </p>
          </motion.div>
        )}

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, specialty, or research interest..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-lg"
                  />
                </div>
                <Button type="submit" className="h-12 px-8">
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-12 px-6 flex items-center"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialty
                      </label>
                      <select
                        value={filters.specialty}
                        onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Specialties</option>
                        {specialties.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <Input
                        type="text"
                        placeholder="City or country"
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        className="h-10"
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.availableForMeetings}
                          onChange={(e) => setFilters({ ...filters, availableForMeetings: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Available for meetings</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={clearFilters}
                      className="flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>
          </Card>
        </motion.div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            {loading ? 'Searching...' : `${experts.length} expert${experts.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        )}

        {/* Experts Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && experts.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No experts found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </Card>
        )}
      </main>
    </div>
  );
}

function ExpertCard({ expert }) {
  const router = useRouter();

  return (
    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group" onClick={() => router.push(`/experts/${expert.id}`)}>
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {expert.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {expert.name}
          </h3>
          
          {expert.researcherProfile?.institution && (
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <Briefcase className="w-4 h-4 mr-1" />
              {expert.researcherProfile.institution}
            </p>
          )}
        </div>

        {expert.researcherProfile?.availableForMeetings && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Available
            </span>
          </div>
        )}
      </div>

      {/* Specialties */}
      {expert.researcherProfile?.specialties && expert.researcherProfile.specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {expert.researcherProfile.specialties.slice(0, 3).map((specialty, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
            >
              {specialty}
            </span>
          ))}
          {expert.researcherProfile.specialties.length > 3 && (
            <span className="text-xs text-gray-500">
              +{expert.researcherProfile.specialties.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Bio */}
      {expert.researcherProfile?.bio && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {expert.researcherProfile.bio}
        </p>
      )}

      {/* Research Interests */}
      {expert.researcherProfile?.researchInterests && expert.researcherProfile.researchInterests.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Research Interests:</p>
          <p className="text-sm text-gray-700 line-clamp-1">
            {expert.researcherProfile.researchInterests.join(', ')}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          {expert.email && (
            <Mail className="w-4 h-4" />
          )}
          {expert.researcherProfile?.orcidId && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">ORCID</span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/experts/${expert.id}`);
          }}
        >
          View Profile
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
