"use client";

import { useState, useEffect } from 'react';
import { X, Mail, Building2, Award, BookOpen, Beaker, Users, Link as LinkIcon, Globe } from 'lucide-react';
import { Button } from './ui/Button';

export default function ResearcherProfileModal({ researcher, isOpen, onClose, onConnect, onFollow }) {
  const [publications, setPublications] = useState([]);
  const [trials, setTrials] = useState([]);
  const [loadingPubs, setLoadingPubs] = useState(false);
  const [loadingTrials, setLoadingTrials] = useState(false);

  useEffect(() => {
    console.log('Modal props changed - isOpen:', isOpen, 'researcher:', researcher);
  }, [isOpen, researcher]);

  useEffect(() => {
    const fetchData = async () => {
      if (!researcher || !isOpen) return;
      
      // Use cached data if available
      if (researcher.publications && researcher.publications.length > 0) {
        setPublications(researcher.publications);
      } else {
        setLoadingPubs(true);
      }
      
      if (researcher.clinicalTrials && researcher.clinicalTrials.length > 0) {
        setTrials(researcher.clinicalTrials);
      } else {
        setLoadingTrials(true);
      }
      
      // Fetch publications and trials in parallel for speed
      try {
        const [pubsResult, trialsResult] = await Promise.all([
          fetchPublications(),
          fetchTrials()
        ]);
        
        if (pubsResult) setPublications(pubsResult);
        if (trialsResult) setTrials(trialsResult);
      } catch (err) {
        console.error('Error fetching researcher data:', err);
      } finally {
        setLoadingPubs(false);
        setLoadingTrials(false);
      }
    };
    
    const fetchPublications = async () => {
      if (!researcher) return [];
      
      try {
        let pubs = [];
        
        if (researcher.isInternalResearcher && researcher.id) {
          // For internal researchers, use researcherId
          const url = `/api/publications?researcherId=${researcher.id}&limit=5`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            pubs = data.publications || [];
          }
        } else if (researcher.source === 'ORCID' && researcher.orcidId) {
          // For ORCID researchers, fetch from ORCID API with caching
          const cacheKey = `orcid-pubs-${researcher.orcidId}`;
          const cached = sessionStorage.getItem(cacheKey);
          
          if (cached) {
            return JSON.parse(cached);
          }
          
          const response = await fetch(`https://pub.orcid.org/v3.0/${researcher.orcidId}/works`, {
            headers: { 'Accept': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            pubs = (data.group || []).slice(0, 5).map((group, index) => {
              const work = group['work-summary']?.[0];
              return {
                id: `orcid-work-${work?.['put-code'] || index}`,
                title: work?.title?.title?.value || 'Untitled',
                journal: work?.['journal-title']?.value || 'Unknown',
                publishedDate: work?.['publication-date']?.year?.value || 'Unknown',
                source: 'ORCID'
              };
            });
            
            // Cache for 5 minutes
            sessionStorage.setItem(cacheKey, JSON.stringify(pubs));
          }
        } else {
          // For other external researchers, search by name with caching
          const cacheKey = `researcher-pubs-${researcher.name}`;
          const cached = sessionStorage.getItem(cacheKey);
          
          if (cached) {
            return JSON.parse(cached);
          }
          
          const url = `/api/publications?keyword=${encodeURIComponent(researcher.name)}&limit=5`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            pubs = data.publications || [];
            
            // Cache for 5 minutes
            sessionStorage.setItem(cacheKey, JSON.stringify(pubs));
          }
        }
        
        return pubs;
      } catch (err) {
        console.error('Error fetching publications', err);
        return [];
      }
    };

    const fetchTrials = async () => {
      if (!researcher) return [];
      
      try {
        let url;
        if (researcher.isInternalResearcher && researcher.id) {
          // For internal researchers, use researcherId
          url = `/api/clinical-trials?researcherId=${researcher.id}&limit=5`;
        } else {
          // For external researchers, search by name with caching
          const cacheKey = `researcher-trials-${researcher.name}`;
          const cached = sessionStorage.getItem(cacheKey);
          
          if (cached) {
            return JSON.parse(cached);
          }
          
          const searchTerm = researcher.name;
          url = `/api/clinical-trials?keyword=${encodeURIComponent(searchTerm)}&limit=5`;
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const trials = data.trials || [];
          
          // Cache external trials
          if (!researcher.isInternalResearcher) {
            const cacheKey = `researcher-trials-${researcher.name}`;
            sessionStorage.setItem(cacheKey, JSON.stringify(trials));
          }
          
          return trials;
        }
        
        return [];
      } catch (err) {
        console.error('Error fetching trials', err);
        return [];
      }
    };

    if (isOpen && researcher) {
      fetchData();
    }
  }, [isOpen, researcher]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-20" onClick={onClose}>
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {researcher ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-start justify-between z-10">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                  {researcher.name?.charAt(0).toUpperCase() || 'R'}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold">{researcher.name}</h2>
                  <p className="text-blue-100 text-base">{researcher.specialty || researcher.affiliation || 'Researcher'}</p>
                  {researcher.institution && (
                    <p className="text-blue-50 text-sm mt-1 flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {researcher.institution}
                    </p>
                  )}
                  {!researcher.isInternalResearcher && (
                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 text-white text-xs rounded-full">
                      External Researcher • {researcher.source || 'API Source'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Contact & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {researcher.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <a href={`mailto:${researcher.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {researcher.email}
                  </a>
                </div>
              </div>
            )}
            {researcher.institution && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Institution</p>
                  <p className="text-sm font-medium">{researcher.institution}</p>
                </div>
              </div>
            )}
            {researcher.researchGateUrl && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <LinkIcon className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">ResearchGate</p>
                  <a href={researcher.researchGateUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-purple-600 hover:underline">
                    View Profile
                  </a>
                </div>
              </div>
            )}
            {researcher.googleScholarUrl && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Globe className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Google Scholar</p>
                  <a href={researcher.googleScholarUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-orange-600 hover:underline">
                    View Profile
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Bio */}
          {researcher.bio && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                About
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">{researcher.bio}</p>
            </div>
          )}

          {/* Specialties */}
          {researcher.specialties && researcher.specialties.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {researcher.specialties.map((specialty, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Publications */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-600" />
              Publications {(researcher.publicationCount || publications.length > 0) && `(${researcher.publicationCount || publications.length})`}
            </h3>
            {loadingPubs ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Loading publications...</span>
              </div>
            ) : publications.length > 0 ? (
              <div className="grid gap-4">
                {publications.filter(pub => pub && pub.title).slice(0, 5).map((pub, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 bg-gradient-to-r from-green-50 to-emerald-50">
                    <h4 className="font-semibold text-base text-gray-800 mb-2 line-clamp-2">{pub.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Authors:</span> {
                        Array.isArray(pub.authors) 
                          ? pub.authors.join(', ') 
                          : (pub.authors || 'Authors unknown')
                      }
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      {pub.journal && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {pub.journal}
                        </span>
                      )}
                      <span>📅 {pub.publishedDate?.substring(0, 4) || pub.publicationDate?.substring(0, 4) || 'Unknown'}</span>
                    </div>
                    <div className="flex gap-2">
                      {pub.doi && (
                        <a
                          href={`https://doi.org/${pub.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 transition-colors"
                        >
                          🔗 DOI: {pub.doi}
                        </a>
                      )}
                      {pub.pmid && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 transition-colors"
                        >
                          📚 PubMed
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No publications found for this researcher</p>
              </div>
            )}
          </div>

          {/* Clinical Trials */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Beaker className="w-6 h-6 text-orange-600" />
              Clinical Trials {trials.length > 0 && `(${trials.length})`}
            </h3>
            {loadingTrials ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-gray-600">Loading clinical trials...</span>
              </div>
            ) : trials.length > 0 ? (
              <div className="grid gap-4">
                {trials.filter(trial => trial && trial.title).slice(0, 5).map((trial, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-base text-gray-800 flex-1 line-clamp-2">{trial.title}</h4>
                      <span className={`ml-3 text-xs px-3 py-1 rounded-full font-medium ${
                        trial.status === 'RECRUITING' || trial.status === 'Recruiting' ? 'bg-green-100 text-green-700' :
                        trial.status === 'ACTIVE_NOT_RECRUITING' || trial.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                        trial.status === 'COMPLETED' || trial.status === 'Completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {trial.status?.replace(/_/g, ' ') || 'Unknown'}
                      </span>
                    </div>
                    {trial.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{trial.description || trial.briefSummary}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      {(trial.location || trial.locations) && (
                        <span className="flex items-center gap-1">
                          📍 {trial.location || (Array.isArray(trial.locations) ? trial.locations[0] : trial.locations)}
                        </span>
                      )}
                      {trial.phase && (
                        <span className="flex items-center gap-1">
                          🔬 Phase {trial.phase}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {trial.nctId && (
                        <a
                          href={`https://clinicaltrials.gov/ct2/show/${trial.nctId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full hover:bg-orange-200 transition-colors"
                        >
                          🔗 ClinicalTrials.gov
                        </a>
                      )}
                      {trial.url && (
                        <a
                          href={trial.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 transition-colors"
                        >
                          🌐 View Details
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Beaker className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No clinical trials found for this researcher</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            {researcher.isInternalResearcher ? (
              <>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  onClick={() => {
                    onConnect?.(researcher.id);
                    onClose();
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Connect
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    onFollow?.(researcher.id);
                    onClose();
                  }}
                >
                  Follow
                </Button>
              </>
            ) : (
              <div className="flex-1 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  💡 This researcher is not registered on our platform yet.
                </p>
              </div>
            )}
            <Button
              variant="outline"
              className="px-6"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
          </>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-semibold">Researcher profile</h3>
            <p className="text-sm text-gray-600 mt-2">No researcher data was provided. This modal opened correctly — the click handler and modal state are working.</p>
            <div className="mt-4">
              <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
