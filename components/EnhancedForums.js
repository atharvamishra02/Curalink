'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  MessageSquare, 
  Plus, 
  X, 
  Send,
  Award,
  CheckCircle,
  Clock,
  Eye,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

export default function EnhancedForums({ forums: initialForums, currentUser, isResearcher }) {
  const [forums, setForums] = useState(initialForums || []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: []
  });
  const [answer, setAnswer] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Memoize categories to prevent recreation on every render
  const categories = useMemo(() => [
    { value: 'all', label: 'All Categories', color: 'gray' },
    { value: 'general', label: 'General Discussion', color: 'gray' },
    { value: 'research', label: 'Research & Methodology', color: 'blue' },
    { value: 'qa', label: 'Questions & Answers', color: 'yellow' },
    { value: 'collaboration', label: 'Collaboration', color: 'pink' }
  ], []);

  // Auto-refresh forums every 10 seconds for near real-time updates
  useEffect(() => {
    if (!initialForums) return;
    
    const refreshInterval = setInterval(() => {
      // Refresh would be handled by parent component
      // This is just a placeholder for future WebSocket integration
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [initialForums]);

  const getCategoryColor = (category) => {
    if (!category) return 'bg-gray-100 text-gray-700 border-gray-200';
    
    const categoryName = typeof category === 'object' 
      ? (category?.name || category?.slug || '').toLowerCase() 
      : (category || '').toLowerCase();
    
    const colors = {
      'general': 'bg-gray-100 text-gray-700 border-gray-200',
      'research': 'bg-blue-100 text-blue-700 border-blue-200',
      'clinical-trials': 'bg-green-100 text-green-700 border-green-200',
      'clinical trials': 'bg-green-100 text-green-700 border-green-200',
      'publications': 'bg-purple-100 text-purple-700 border-purple-200',
      'qa': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'questions & answers': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'collaboration': 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[categoryName] || colors['general'];
  };

  const handleCreatePost = useCallback(async (e) => {
    e.preventDefault();
    setCreating(true);

    // Create optimistic post
    const optimisticPost = {
      id: `temp-${Date.now()}`,
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      author: {
        id: currentUser?.id,
        name: currentUser?.name || 'You',
        role: currentUser?.role
      },
      commentCount: 0,
      viewCount: 0,
      isPinned: false,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    try {
      // Optimistic update - add post immediately
      setForums(prev => [optimisticPost, ...prev]);
      setShowCreateModal(false);
      
      // Reset form
      const postData = { ...newPost };
      setNewPost({ title: '', content: '', category: 'general', tags: [] });
      
      // Then send to server in background
      const response = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic post with real post
        setForums(prev => prev.map(p => 
          p.id === optimisticPost.id ? { ...data.post, isOptimistic: false } : p
        ));
      } else {
        // Remove optimistic post on error
        setForums(prev => prev.filter(p => p.id !== optimisticPost.id));
        const error = await response.json();
        console.error('Failed to create post:', error);
        alert('Failed to create post. Please try again.');
      }
    } catch (error) {
      // Remove optimistic post on error
      setForums(prev => prev.filter(p => p.id !== optimisticPost.id));
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [newPost, currentUser, forums]);

  const handleViewPost = useCallback(async (postId) => {
    try {
      // Show modal immediately with loading state
      setShowPostDetail(true);
      setSelectedPost({ loading: true });
      
      const response = await fetch(`/api/forums/${postId}`);
      const data = await response.json();
      setSelectedPost(data.post);
    } catch (error) {
      console.error('Error:', error);
      setShowPostDetail(false);
    }
  }, []);

  const handleAddAnswer = useCallback(async (e) => {
    e.preventDefault();
    if (!answer.trim() || !selectedPost) return;

    // Optimistic comment
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      content: answer,
      author: {
        id: currentUser?.id,
        name: currentUser?.name || 'You',
        researcherProfile: currentUser?.researcherProfile
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    try {
      // Optimistic update
      setSelectedPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), optimisticComment],
        commentCount: (prev.commentCount || 0) + 1
      }));
      
      const answerText = answer;
      setAnswer(''); // Clear immediately

      // Send to server
      const response = await fetch(`/api/forums/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: answerText })
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic comment with real one
        setSelectedPost(prev => ({
          ...prev,
          comments: prev.comments.map(c => 
            c.id === optimisticComment.id ? data.comment : c
          )
        }));
      } else {
        // Remove optimistic comment on error
        setSelectedPost(prev => ({
          ...prev,
          comments: prev.comments.filter(c => c.id !== optimisticComment.id),
          commentCount: (prev.commentCount || 1) - 1
        }));
        alert('Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      // Remove optimistic comment on error
      setSelectedPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== optimisticComment.id),
        commentCount: (prev.commentCount || 1) - 1
      }));
      alert('Error adding comment. Please try again.');
    }
  }, [answer, selectedPost, currentUser]);

  // Memoize filtered forums to prevent recalculation on every render
  const filteredForums = useMemo(() => forums.filter(forum => {
    if (!forum) return false;
    
    // Search filter
    const matchesSearch = !searchQuery || 
      (forum.title && forum.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (forum.content && forum.content.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Category filter - normalize category to string value
    let forumCategory = 'general'; // default
    
    if (forum.category) {
      if (typeof forum.category === 'object') {
        // If category is an object, try slug, name, or value
        forumCategory = (forum.category.slug || forum.category.name || forum.category.value || 'general').toLowerCase();
      } else if (typeof forum.category === 'string') {
        // If category is a string, normalize it
        const cat = forum.category.toLowerCase();
        
        // Map label names to values
        const labelToValue = {
          'general discussion': 'general',
          'general': 'general',
          'research & methodology': 'research',
          'research': 'research',
          'clinical trials': 'clinical-trials',
          'clinical-trials': 'clinical-trials',
          'publications': 'publications',
          'questions & answers': 'qa',
          'qa': 'qa',
          'collaboration': 'collaboration',
          'collaboration opportunities': 'collaboration'
        };
        
        forumCategory = labelToValue[cat] || cat;
      }
    }
    
    // Normalize filter value
    const normalizedFilter = categoryFilter.toLowerCase();
    
    // Check if category matches
    const matchesCategory = normalizedFilter === 'all' || forumCategory === normalizedFilter;
    
    // Collaboration filter - only show collaboration posts to collaborators
    if (forumCategory === 'collaboration' && isResearcher) {
      // Check if current user is a collaborator with the post author
      // For now, we'll show all collaboration posts to researchers
      // TODO: Add actual collaborator check when API is ready
      return matchesSearch && matchesCategory;
    }
    
    return matchesSearch && matchesCategory;
  }), [forums, searchQuery, categoryFilter, isResearcher]);

  // Debug log (only in development)
  if (process.env.NODE_ENV === 'development' && forums.length > 0) {
    // Show what categories exist in the forums
    const categoryCounts = {};
    const normalizedCounts = {};
    
    forums.forEach(f => {
      if (f && f.category) {
        const rawCat = typeof f.category === 'string' ? f.category : JSON.stringify(f.category);
        categoryCounts[rawCat] = (categoryCounts[rawCat] || 0) + 1;
        
        // Show normalized version too
        if (typeof f.category === 'string') {
          const cat = f.category.toLowerCase();
          const labelToValue = {
            'general discussion': 'general',
            'general': 'general',
            'research & methodology': 'research',
            'research': 'research',
            'clinical trials': 'clinical-trials',
            'clinical-trials': 'clinical-trials',
            'publications': 'publications',
            'questions & answers': 'qa',
            'qa': 'qa',
            'collaboration': 'collaboration',
            'collaboration opportunities': 'collaboration'
          };
          const normalized = labelToValue[cat] || cat;
          normalizedCounts[normalized] = (normalizedCounts[normalized] || 0) + 1;
        }
      }
    });
    
    console.log('🔍 FORUM CATEGORIES DEBUG:');
    console.log('Filter:', categoryFilter);
    console.log('Raw categories in DB:', categoryCounts);
    console.log('Normalized categories:', normalizedCounts);
    console.log('Filtered results:', filteredForums.length, '/', forums.length);
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Discussion
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const isActive = categoryFilter === cat.value;
          let buttonClass = 'px-4 py-2 rounded-lg text-sm font-medium transition-all ';
          
          if (isActive) {
            // Active state colors
            switch(cat.color) {
              case 'blue': buttonClass += 'bg-blue-600 text-white shadow-md'; break;
              case 'green': buttonClass += 'bg-green-600 text-white shadow-md'; break;
              case 'purple': buttonClass += 'bg-purple-600 text-white shadow-md'; break;
              case 'yellow': buttonClass += 'bg-yellow-600 text-white shadow-md'; break;
              case 'pink': buttonClass += 'bg-pink-600 text-white shadow-md'; break;
              default: buttonClass += 'bg-gray-600 text-white shadow-md';
            }
          } else {
            // Inactive state colors
            switch(cat.color) {
              case 'blue': buttonClass += 'bg-blue-100 text-blue-700 hover:bg-blue-200'; break;
              case 'green': buttonClass += 'bg-green-100 text-green-700 hover:bg-green-200'; break;
              case 'purple': buttonClass += 'bg-purple-100 text-purple-700 hover:bg-purple-200'; break;
              case 'yellow': buttonClass += 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'; break;
              case 'pink': buttonClass += 'bg-pink-100 text-pink-700 hover:bg-pink-200'; break;
              default: buttonClass += 'bg-gray-100 text-gray-700 hover:bg-gray-200';
            }
          }
          
          return (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={buttonClass}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Forums List */}
      {filteredForums.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Discussions Found</h3>
          <p className="text-gray-500 mb-6">Start a conversation with the community</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Post
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredForums.map((forum, index) => (
              <motion.div
                key={forum.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 hover:border-l-blue-500"
                  onClick={() => handleViewPost(forum.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Author Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {forum.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(forum.category)}`}>
                          {forum.category ? (typeof forum.category === 'object' ? forum.category?.name || 'General' : forum.category) : 'General'}
                        </span>
                        {forum.isPinned && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                            📌 Pinned
                          </span>
                        )}
                        {forum.isAnswered && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                            ✓ Answered
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                        {forum.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {forum.content}
                      </p>

                      {/* Tags */}
                      {forum.tags && forum.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {forum.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                              #{tag}
                            </span>
                          ))}
                          {forum.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                              +{forum.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats and Author Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-gray-500">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-medium">{forum.commentCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{forum.viewCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(forum.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium">{forum.author?.name || 'Anonymous'}</span>
                          {forum.author?.researcherProfile?.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Discussion</h2>
                  <button 
                    onClick={() => setShowCreateModal(false)} 
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreatePost} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="What would you like to discuss?"
                    required
                    className="text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    required
                  >
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={10}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Share your thoughts, questions, or insights with the community..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma-separated)</label>
                  <Input
                    value={newPost.tags.join(', ')}
                    onChange={(e) => setNewPost({ 
                      ...newPost, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                    })}
                    placeholder="e.g., oncology, immunotherapy, clinical-research"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? 'Creating...' : 'Create Discussion'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateModal(false)} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {showPostDetail && selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPostDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(selectedPost.category)}`}>
                      {typeof selectedPost.category === 'object' ? selectedPost.category?.name || 'General' : selectedPost.category}
                    </span>
                    {selectedPost.isPinned && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                        📌 Pinned
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowPostDetail(false)} 
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedPost.title}</h2>
              </div>

              <div className="p-6">
                {/* Author Info */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {selectedPost.author?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg">{selectedPost.author?.name}</p>
                      {selectedPost.author?.researcherProfile?.verified && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    {selectedPost.author?.researcherProfile?.institution && (
                      <p className="text-sm text-gray-600">{selectedPost.author.researcherProfile.institution}</p>
                    )}
                    {selectedPost.author?.researcherProfile?.specialties && (
                      <p className="text-xs text-gray-500">{selectedPost.author.researcherProfile.specialties.join(', ')}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{new Date(selectedPost.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{new Date(selectedPost.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                </div>

                {/* Tags */}
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedPost.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm rounded-full font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-8 pb-6 border-b">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-semibold">{selectedPost.comments?.length || 0} Answers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    <span>{selectedPost.viewCount || 0} Views</span>
                  </div>
                </div>

                {/* Answers Section */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    Answers ({selectedPost.comments?.length || 0})
                  </h3>
                  
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    <div className="space-y-4 mb-8">
                      {selectedPost.comments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                              {comment.author?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-gray-900">{comment.author?.name}</p>
                                    {comment.author?.researcherProfile?.verified && (
                                      <CheckCircle className="w-4 h-4 text-blue-500" />
                                    )}
                                    {isResearcher && comment.author?.id === currentUser?.id && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  {comment.author?.researcherProfile?.institution && (
                                    <p className="text-xs text-gray-600">{comment.author.researcherProfile.institution}</p>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl mb-8">
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No answers yet</p>
                      <p className="text-gray-400 text-sm">Be the first to share your insights!</p>
                    </div>
                  )}

                  {/* Add Answer Form - Prominent for Researchers */}
                  {isResearcher ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Award className="w-6 h-6 text-blue-600" />
                        <h4 className="text-lg font-bold text-gray-900">Share Your Expert Answer</h4>
                      </div>
                      <form onSubmit={handleAddAnswer} className="space-y-4">
                        <textarea
                          className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={5}
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Share your professional insights and expertise..."
                          required
                        />
                        <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                          <Send className="w-4 h-4 mr-2" />
                          Post Answer
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <form onSubmit={handleAddAnswer} className="space-y-4">
                        <textarea
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Share your thoughts..."
                          required
                        />
                        <Button type="submit" className="w-full">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Add Comment
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
