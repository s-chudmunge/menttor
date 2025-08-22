"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../../config/config';
import { 
  BookOpen, 
  Star, 
  Users, 
  Clock, 
  Search, 
  Filter,
  ChevronDown,
  Eye,
  Download,
  Badge,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Play,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  Award,
  Target,
  Calendar,
  Zap,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface CuratedRoadmap {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  difficulty: string;
  is_featured: boolean;
  is_verified: boolean;
  view_count: number;
  adoption_count: number;
  average_rating: number;
  estimated_hours?: number;
  tags: string[];
  target_audience?: string;
  slug?: string;
}

interface Categories {
  [key: string]: string[];
}

const ExplorePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [roadmaps, setRoadmaps] = useState<CuratedRoadmap[]>([]);
  const [categories, setCategories] = useState<Categories>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Enhanced filtering
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const difficultyColors: { [key: string]: string } = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  const categoryIcons: { [key: string]: string } = {
    'web-development': '🌐',
    'data-science': '📊',
    'cloud-computing': '☁️',
    'computer-science': '💻',
    'mobile-development': '📱',
    'devops': '⚙️',
    'artificial-intelligence': '🤖',
    'cybersecurity': '🔐',
    'blockchain': '⛓️',
    'game-development': '🎮',
    'database': '🗃️',
    'system-design': '🏗️',
    'competitive-programming': '🏆',
    'design': '🎨',
    'programming-languages': '⌨️',
    'data-engineering': '🔧',
    'product-management': '📋'
  };

  const categoryColors: { [key: string]: string } = {
    'web-development': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'data-science': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'cloud-computing': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    'computer-science': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    'mobile-development': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'devops': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'artificial-intelligence': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'cybersecurity': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    'blockchain': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'game-development': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    'database': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    'system-design': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    'competitive-programming': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'design': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    'programming-languages': 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
    'data-engineering': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    'product-management': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  };

  // Calculate active filters count
  const activeFilters = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory) count++;
    if (selectedDifficulty) count++;
    if (featuredOnly) count++;
    return count;
  }, [searchQuery, selectedCategory, selectedDifficulty, featuredOnly]);

  // Filter and sort roadmaps client-side for better UX
  const filteredAndSortedRoadmaps = useMemo(() => {
    let filtered = [...roadmaps];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(roadmap => 
        roadmap.title.toLowerCase().includes(query) ||
        roadmap.description.toLowerCase().includes(query) ||
        roadmap.tags.some(tag => tag.toLowerCase().includes(query)) ||
        roadmap.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(roadmap => roadmap.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(roadmap => roadmap.difficulty === selectedDifficulty);
    }

    // Apply featured filter
    if (featuredOnly) {
      filtered = filtered.filter(roadmap => roadmap.is_featured);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.adoption_count - a.adoption_count;
        case 'rating':
          return b.average_rating - a.average_rating;
        case 'recent':
          return b.id - a.id; // Assuming higher ID means more recent
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [roadmaps, searchQuery, selectedCategory, selectedDifficulty, featuredOnly, sortBy]);

  useEffect(() => {
    setActiveFiltersCount(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    fetchRoadmaps();
    fetchCategories();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch roadmaps');
      }
      
      const data = await response.json();
      
      // If no roadmaps, show generation state
      if (data.length === 0) {
        setIsGenerating(true);
        // Poll for roadmaps every 10 seconds
        const pollInterval = setInterval(async () => {
          try {
            const pollResponse = await fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=50`);
            if (pollResponse.ok) {
              const pollData = await pollResponse.json();
              if (pollData.length > 0) {
                setRoadmaps(pollData);
                setIsGenerating(false);
                clearInterval(pollInterval);
              }
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        }, 10000);

        // Clear interval after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 300000);
      } else {
        setRoadmaps(data);
        setIsGenerating(false);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsGenerating(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/categories/all`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleAdoptRoadmap = async (roadmapId: number, title: string) => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/${roadmapId}/adopt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          curated_roadmap_id: roadmapId
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to the user's journey page
        router.push(`/journey`);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to adopt roadmap');
      }
    } catch (err) {
      alert('Failed to adopt roadmap. Please try again.');
    }
  };

  const handleViewRoadmap = (roadmapId: number) => {
    router.push(`/explore/${roadmapId}`);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setFeaturedOnly(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unable to Load Roadmaps</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button 
            onClick={fetchRoadmaps}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-gray-900 dark:to-blue-950/20">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Expert-Curated Learning Paths
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-6">
              Discover Your Next Skill
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Master in-demand skills with AI-powered, expert-verified roadmaps. From beginner to professional, 
              we've curated the perfect learning path for your career growth.
            </p>
            
            {/* Stats Banner */}
            <div className="flex items-center justify-center space-x-8 mt-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-yellow-500" />
                <span>{filteredAndSortedRoadmaps.filter(r => r.is_verified).length} Expert-Verified</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                <span>{filteredAndSortedRoadmaps.filter(r => r.is_featured).length} Featured</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-500" />
                <span>{formatNumber(filteredAndSortedRoadmaps.reduce((acc, r) => acc + r.adoption_count, 0))} Learners</span>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Controls */}
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search roadmaps, technologies, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-medium rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Enhanced Filters Panel */}
            {showFilters && (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Roadmaps</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Clear All ({activeFiltersCount})
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Categories</option>
                      {Object.keys(categories).map(category => (
                        <option key={category} value={category}>
                          {categoryIcons[category] || '📚'} {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Difficulty Level
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Levels</option>
                      <option value="beginner">🌱 Beginner</option>
                      <option value="intermediate">🚀 Intermediate</option>
                      <option value="advanced">⭐ Advanced</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="popularity">📈 Most Popular</option>
                      <option value="rating">⭐ Highest Rated</option>
                      <option value="recent">🆕 Most Recent</option>
                      <option value="alphabetical">🔤 Alphabetical</option>
                    </select>
                  </div>

                  {/* Special Filters */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Special Filters
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={featuredOnly}
                          onChange={(e) => setFeaturedOnly(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                          ⭐ Featured Only
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredAndSortedRoadmaps.length} Learning Path{filteredAndSortedRoadmaps.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {activeFiltersCount > 0 ? 'Filtered results' : 'All available roadmaps'}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
            "space-y-4"
          }>
            {[...Array(viewMode === 'grid' ? 6 : 4)].map((_, i) => (
              <div key={i} className={
                viewMode === 'grid' 
                  ? "bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-sm animate-pulse backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                  : "bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-sm animate-pulse backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center space-x-4"
              }>
                {viewMode === 'grid' ? (
                  <>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : isGenerating ? (
          /* Generation State */
          <div className="text-center py-16">
            <div className="max-w-lg mx-auto">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Generating Premium Roadmaps
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Our AI is crafting personalized, expert-verified learning paths just for you. 
                This usually takes 2-3 minutes to complete.
              </p>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, generationProgress + (Date.now() % 10000) / 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please wait while we prepare your learning journey...
              </p>
            </div>
          </div>
        ) : filteredAndSortedRoadmaps.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No roadmaps found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search terms or filters to discover new learning paths.
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          /* Roadmaps Display */
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : 
            "space-y-6"
          }>
            {filteredAndSortedRoadmaps.map((roadmap) => (
              <div key={roadmap.id} className={
                viewMode === 'grid' 
                  ? "group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-700/50 hover:-translate-y-1"
                  : "group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-700/50 flex items-start space-x-4"
              }>
                {viewMode === 'grid' ? (
                  /* Grid View Card */
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${categoryColors[roadmap.category] || 'bg-gray-100 text-gray-600'}`}>
                          <span className="text-lg">{categoryIcons[roadmap.category] || '📚'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {roadmap.is_featured && (
                            <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                              <Award className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                            </div>
                          )}
                          {roadmap.is_verified && (
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${difficultyColors[roadmap.difficulty]}`}>
                        {roadmap.difficulty}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {roadmap.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {roadmap.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {formatNumber(roadmap.view_count)}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {formatNumber(roadmap.adoption_count)}
                      </div>
                      {roadmap.estimated_hours && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {roadmap.estimated_hours}h
                        </div>
                      )}
                      {roadmap.average_rating > 0 && (
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          {roadmap.average_rating.toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {roadmap.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs rounded-lg font-medium">
                          {tag}
                        </span>
                      ))}
                      {roadmap.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs rounded-lg font-medium">
                          +{roadmap.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleViewRoadmap(roadmap.id)}
                        className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm font-semibold transition-all duration-200"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleAdoptRoadmap(roadmap.id, roadmap.title)}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {user ? 'Start Learning' : 'Sign In'}
                      </button>
                    </div>
                  </>
                ) : (
                  /* List View Card */
                  <>
                    <div className={`p-3 rounded-xl ${categoryColors[roadmap.category] || 'bg-gray-100 text-gray-600'}`}>
                      <span className="text-2xl">{categoryIcons[roadmap.category] || '📚'}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {roadmap.title}
                        </h3>
                        <div className="flex items-center space-x-2 ml-4">
                          {roadmap.is_featured && <Award className="w-4 h-4 text-yellow-500" />}
                          {roadmap.is_verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${difficultyColors[roadmap.difficulty]}`}>
                            {roadmap.difficulty}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {roadmap.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {formatNumber(roadmap.adoption_count)}
                          </div>
                          {roadmap.estimated_hours && (
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {roadmap.estimated_hours}h
                            </div>
                          )}
                          {roadmap.average_rating > 0 && (
                            <div className="flex items-center">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              {roadmap.average_rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewRoadmap(roadmap.id)}
                            className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm font-medium transition-colors"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAdoptRoadmap(roadmap.id, roadmap.title)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                          >
                            <Target className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;