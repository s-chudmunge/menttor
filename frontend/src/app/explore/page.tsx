"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  ChevronUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Home,
  Menu,
  BarChart3
} from 'lucide-react';
import ProfileDropdown from '../../components/ProfileDropdown';
import Logo from '../../../components/Logo';

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

// Structured Data for SEO
const generateStructuredData = (roadmaps: CuratedRoadmap[]) => {
  const itemListElements = roadmaps.slice(0, 10).map((roadmap, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "Course",
      "name": roadmap.title,
      "description": roadmap.description,
      "provider": {
        "@type": "Organization",
        "name": "Menttor Labs",
        "url": process.env.NEXT_PUBLIC_SITE_URL || "https://menttor.live"
      },
      "courseCode": roadmap.slug || roadmap.id.toString(),
      "educationalLevel": roadmap.difficulty,
      "about": roadmap.category.replace('-', ' '),
      "keywords": roadmap.tags.join(', '),
      "aggregateRating": roadmap.average_rating > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": roadmap.average_rating,
        "ratingCount": roadmap.adoption_count
      } : undefined,
      "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live'}/explore/${roadmap.slug || roadmap.id}`
    }
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Expert-Curated Learning Roadmaps",
    "description": "Comprehensive collection of learning roadmaps for technology and professional skills development",
    "numberOfItems": roadmaps.length,
    "itemListElement": itemListElements
  };
};

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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'grouped'>('grouped');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);

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

  // Category grouping configuration
  const categoryGroups = {
    'web-development': {
      title: 'Web Development',
      description: 'Frontend, Backend, and Full-Stack Development',
      subcategories: ['frontend', 'backend', 'fullstack']
    },
    'data-science': {
      title: 'Data Science & Analytics', 
      description: 'Machine Learning, Data Analysis, and Statistics',
      subcategories: ['machine-learning', 'analytics']
    },
    'artificial-intelligence': {
      title: 'Artificial Intelligence',
      description: 'AI, Machine Learning, and Deep Learning',
      subcategories: ['generative-ai', 'computer-vision', 'nlp']
    },
    'cloud-computing': {
      title: 'Cloud & DevOps',
      description: 'Cloud Platforms, DevOps, and Infrastructure',
      subcategories: ['aws', 'azure', 'gcp']
    },
    'devops': {
      title: 'DevOps & Infrastructure',
      description: 'Containerization, CI/CD, and System Administration',
      subcategories: ['containerization', 'automation']
    },
    'mobile-development': {
      title: 'Mobile Development',
      description: 'iOS, Android, and Cross-Platform Development',
      subcategories: ['cross-platform', 'ios', 'android']
    },
    'competitive-exams': {
      title: 'Competitive Exams',
      description: 'JEE, NEET, UPSC, CAT, GATE preparation',
      subcategories: ['jee-mathematics', 'jee-physics', 'neet-biology', 'upsc-geography', 'upsc-history', 'upsc-polity', 'cat-quant', 'cat-reasoning', 'gate-cs', 'gate-ee']
    },
    'programming-languages': {
      title: 'Programming Languages',
      description: 'Language-specific mastery and systems programming',
      subcategories: ['backend', 'systems', 'functional']
    },
    'cybersecurity': {
      title: 'Cybersecurity',
      description: 'Ethical Hacking, Security Analysis, and Protection',
      subcategories: ['ethical-hacking', 'security-analysis']
    },
    'blockchain': {
      title: 'Blockchain & Web3',
      description: 'Cryptocurrency, Smart Contracts, and Decentralized Apps',
      subcategories: ['smart-contracts', 'defi']
    },
    'database': {
      title: 'Database & Data Engineering',
      description: 'Database Design, Data Pipelines, and Storage Solutions',
      subcategories: ['relational', 'nosql']
    },
    'data-engineering': {
      title: 'Data Engineering',
      description: 'Real-time Processing, ETL, and Big Data',
      subcategories: ['streaming', 'pipelines']
    },
    'machine-learning-ops': {
      title: 'MLOps',
      description: 'ML Model Deployment and Production Systems',
      subcategories: ['deployment', 'monitoring']
    },
    'game-development': {
      title: 'Game Development',
      description: 'Game Engines, Graphics, and Interactive Media',
      subcategories: ['unity', '2d', '3d']
    },
    'graphics-programming': {
      title: 'Graphics Programming',
      description: '3D Graphics, Shaders, and Visual Computing',
      subcategories: ['webgl', '3d', 'rendering']
    },
    'embedded-systems': {
      title: 'IoT & Embedded',
      description: 'Internet of Things, Microcontrollers, and Hardware',
      subcategories: ['iot', 'microcontrollers']
    },
    'quantum-computing': {
      title: 'Quantum Computing',
      description: 'Quantum Algorithms, Qiskit, and Advanced Computing',
      subcategories: ['programming', 'algorithms']
    },
    'extended-reality': {
      title: 'AR/VR Development',
      description: 'Augmented Reality, Virtual Reality, and Immersive Tech',
      subcategories: ['ar-vr', 'spatial-computing']
    },
    'creative-technology': {
      title: 'Creative Technology',
      description: 'Creative Coding, Generative Art, and Digital Art',
      subcategories: ['generative-art', 'interactive-design']
    },
    'entrepreneurship': {
      title: 'Entrepreneurship',
      description: 'Startup Development, Business Strategy, and Innovation',
      subcategories: ['startups', 'business-development']
    },
    'quality-assurance': {
      title: 'Quality Assurance',
      description: 'Testing, Automation, and Quality Engineering',
      subcategories: ['automation', 'testing']
    },
    'system-design': {
      title: 'System Design',
      description: 'Architecture, Scalability, and Distributed Systems',
      subcategories: ['architecture', 'scalability']
    }
  };

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

  // Group roadmaps by category for grouped view
  const groupedRoadmaps = useMemo(() => {
    const groups: { [key: string]: CuratedRoadmap[] } = {};
    
    filteredAndSortedRoadmaps.forEach(roadmap => {
      if (!groups[roadmap.category]) {
        groups[roadmap.category] = [];
      }
      groups[roadmap.category].push(roadmap);
    });
    
    return groups;
  }, [filteredAndSortedRoadmaps]);

  const toggleGroup = (category: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedGroups(newExpanded);
  };

  useEffect(() => {
    setActiveFiltersCount(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    fetchRoadmaps();
    fetchCategories();
  }, []);

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try static data first for faster loading
      try {
        const staticResponse = await fetch(`${BACKEND_URL}/static-data/curated-roadmaps`);
        if (staticResponse.ok) {
          const staticData = await staticResponse.json();
          if (staticData.roadmaps && staticData.roadmaps.length > 0) {
            setRoadmaps(staticData.roadmaps);
            setIsGenerating(false);
            console.info(`Loaded ${staticData.roadmaps.length} roadmaps from static cache`);
            return;
          }
        }
      } catch (staticError) {
        console.info('Static data not available, falling back to database');
      }

      // Fallback to database
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=100`);
      
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
            const pollResponse = await fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=100`);
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
        console.info(`Loaded ${data.length} roadmaps from database`);
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
      // Try static data first
      try {
        const staticResponse = await fetch(`${BACKEND_URL}/static-data/curated-roadmaps`);
        if (staticResponse.ok) {
          const staticData = await staticResponse.json();
          if (staticData.categories && Object.keys(staticData.categories).length > 0) {
            setCategories(staticData.categories);
            return;
          }
        }
      } catch (staticError) {
        console.info('Static categories not available, falling back to database');
      }

      // Fallback to database
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

  const handleViewRoadmap = (roadmap: CuratedRoadmap) => {
    router.push(`/explore/${roadmap.slug || roadmap.id}`);
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

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home, active: false },
    { href: '/explore', label: 'Explore', icon: BookOpen, active: true },
    { href: '/journey', label: 'Journey', icon: Target, active: false },
    { href: '/performance-analysis', label: 'Performance', icon: BarChart3, active: false },
  ];

  return (
    <>
      {/* Structured Data */}
      {filteredAndSortedRoadmaps.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData(filteredAndSortedRoadmaps))
          }}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-gray-900 dark:to-blue-950/20">
      {/* Navigation Bar */}
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 lg:h-20">
            {/* Logo and Hamburger */}
            <div className="flex items-center space-x-3">
              {/* Hamburger Menu for Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <Logo />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      item.active 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Search Bar and Profile */}
            <div className="flex items-center space-x-3">
              {/* Compact Search Bar */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search roadmaps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm"
                />
              </div>
              
              {/* Filter Toggle for Desktop */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden lg:flex items-center px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              
              {/* Profile Dropdown */}
              <ProfileDropdown />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-20 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        item.active 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                          : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              
              {/* Mobile Search */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search roadmaps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Expert-Curated Learning Paths
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-6">
              Learn {filteredAndSortedRoadmaps.length > 0 ? 
                `${filteredAndSortedRoadmaps[0]?.tags?.[0]?.charAt(0).toUpperCase() + filteredAndSortedRoadmaps[0]?.tags?.[0]?.slice(1) || 'Programming'}` : 'Programming'}, Web Development & More
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Master <strong>React, Python, AWS, Machine Learning</strong> and 50+ other in-demand skills with free, expert-verified roadmaps. 
              From beginner tutorials to advanced courses - find your perfect learning path for career advancement.
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

          {/* View Mode Controls - Mobile */}
          <div className="flex justify-center lg:hidden mb-6">
            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1">
              <button
                onClick={() => setViewMode('grouped')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grouped' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Grouped View"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Grid View"
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
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Left Sidebar Filters */}
      {showFilters && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setShowFilters(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    clearAllFilters();
                    setShowFilters(false);
                  }}
                  className="w-full mb-4 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors font-medium"
                >
                  Clear All Filters ({activeFiltersCount})
                </button>
              )}
              
              <div className="space-y-6">
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
          </div>
        </div>
      )}

      {/* Desktop Filters Sidebar */}
      <div className="hidden lg:block">
        {showFilters && (
          <div className="fixed left-0 top-20 bottom-0 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-r border-gray-200/50 dark:border-gray-700/50 shadow-lg z-20 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Clear All ({activeFiltersCount})
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
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

                {/* View Mode Toggle - Desktop */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    View Mode
                  </label>
                  <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 p-1">
                    <button
                      onClick={() => setViewMode('grouped')}
                      className={`flex-1 p-2 rounded-md transition-colors ${
                        viewMode === 'grouped' 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="Grouped View"
                    >
                      <BarChart3 className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 p-2 rounded-md transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="Grid View"
                    >
                      <Grid3X3 className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 p-2 rounded-md transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="List View"
                    >
                      <List className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ${showFilters ? 'lg:ml-80' : ''}`}>
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
          <div className={
            viewMode === 'grouped' ? "space-y-6" :
            viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
            "space-y-4"
          }>
            {[...Array(viewMode === 'grouped' ? 3 : viewMode === 'grid' ? 6 : 4)].map((_, i) => (
              <div key={i} className={
                viewMode === 'grouped' ? 
                  "bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-sm animate-pulse backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50" :
                viewMode === 'grid' 
                  ? "bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-sm animate-pulse backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                  : "bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-sm animate-pulse backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center space-x-4"
              }>
                {viewMode === 'grouped' ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </>
                ) : viewMode === 'grid' ? (
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
        ) : viewMode === 'grouped' ? (
          /* Grouped View */
          <>
            {/* Quick Category Overview */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Jump to Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {Object.entries(groupedRoadmaps).map(([category, categoryRoadmaps]) => {
                  const groupInfo = categoryGroups[category as keyof typeof categoryGroups];
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        document.getElementById(`category-${category}`)?.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start' 
                        });
                      }}
                      className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-left group"
                    >
                      <div className={`p-1.5 rounded-md ${categoryColors[category] || 'bg-gray-100 text-gray-600'}`}>
                        <span className="text-sm">{categoryIcons[category] || '📚'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {groupInfo?.title || category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {categoryRoadmaps.length} roadmap{categoryRoadmaps.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
          <div className="space-y-6">
            {Object.entries(groupedRoadmaps).map(([category, categoryRoadmaps]) => {
              const groupInfo = categoryGroups[category as keyof typeof categoryGroups];
              const isExpanded = expandedGroups.has(category);
              const displayedRoadmaps = isExpanded ? categoryRoadmaps : categoryRoadmaps.slice(0, 4);
              
              return (
                <div key={category} id={`category-${category}`} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${categoryColors[category] || 'bg-gray-100 text-gray-600'}`}>
                        <span className="text-2xl">{categoryIcons[category] || '📚'}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {groupInfo?.title || category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {groupInfo?.description || `${categoryRoadmaps.length} learning paths available`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {categoryRoadmaps.length} roadmap{categoryRoadmaps.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => toggleGroup(category)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Compact Roadmaps List */}
                  <div className="space-y-3">
                    {displayedRoadmaps.map((roadmap, index) => (
                      <div key={roadmap.id} className="group bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200/30 dark:border-gray-600/30 hover:border-blue-200 dark:hover:border-blue-700/50">
                        <div className="flex items-center gap-4">
                          {/* Left: Title and Description */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {roadmap.title}
                              </h4>
                              {roadmap.is_featured && <Award className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                              {roadmap.is_verified && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${difficultyColors[roadmap.difficulty]}`}>
                                {roadmap.difficulty}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-1 mb-2">
                              {roadmap.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
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
                          </div>
                          
                          {/* Right: Actions */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button
                              onClick={() => handleViewRoadmap(roadmap)}
                              className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm font-medium transition-colors"
                              title="Preview Roadmap"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAdoptRoadmap(roadmap.id, roadmap.title)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                            >
                              {user ? 'Start' : 'Sign In'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Show More/Less Button */}
                  {categoryRoadmaps.length > 4 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => toggleGroup(category)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Show Less
                            <ChevronUp className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Show All {categoryRoadmaps.length} Roadmaps
                            <ChevronDown className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </>
        ) : (
          /* Grid/List View */
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
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-3 flex-1">
                        <button
                          onClick={() => handleViewRoadmap(roadmap)}
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
                            onClick={() => handleViewRoadmap(roadmap)}
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
      
      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          title="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
    </>
  );
};

export default ExplorePage;