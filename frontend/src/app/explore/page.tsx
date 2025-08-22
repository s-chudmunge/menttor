"use client";

import React, { useState, useEffect } from 'react';
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
  Play
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
    'devops': '⚙️'
  };

  useEffect(() => {
    fetchRoadmaps();
    fetchCategories();
  }, [searchQuery, selectedCategory, selectedDifficulty, featuredOnly, sortBy]);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (featuredOnly) params.append('featured_only', 'true');
      params.append('sort_by', sortBy);
      params.append('per_page', '20');
      
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch roadmaps');
      }
      
      const data = await response.json();
      setRoadmaps(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Roadmaps</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Expert-Curated Learning Paths
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Explore Premium Roadmaps
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover high-quality, expert-verified learning paths designed to take you from beginner to professional
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search roadmaps, technologies, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Categories</option>
                      {Object.keys(categories).map(category => (
                        <option key={category} value={category}>
                          {categoryIcons[category] || '📚'} {category.replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="popularity">Most Popular</option>
                      <option value="rating">Highest Rated</option>
                      <option value="recent">Most Recent</option>
                      <option value="alphabetical">Alphabetical</option>
                    </select>
                  </div>

                  {/* Featured Only */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={featuredOnly}
                      onChange={(e) => setFeaturedOnly(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Featured Only
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Roadmaps Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No roadmaps found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <div key={roadmap.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{categoryIcons[roadmap.category] || '📚'}</span>
                    {roadmap.is_featured && (
                      <Badge className="w-4 h-4 text-yellow-500" />
                    )}
                    {roadmap.is_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyColors[roadmap.difficulty]}`}>
                    {roadmap.difficulty}
                  </span>
                </div>

                {/* Title and Description */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {roadmap.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {roadmap.description}
                </p>

                {/* Stats */}
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {roadmap.view_count}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {roadmap.adoption_count}
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
                <div className="flex flex-wrap gap-1 mb-4">
                  {roadmap.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                  {roadmap.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                      +{roadmap.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewRoadmap(roadmap.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleAdoptRoadmap(roadmap.id, roadmap.title)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {user ? 'Adopt' : 'Login'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;