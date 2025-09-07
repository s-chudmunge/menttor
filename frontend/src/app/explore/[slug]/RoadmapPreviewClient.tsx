"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useCuratedRoadmapDetail } from '../../../hooks/useCuratedRoadmaps';
import { BACKEND_URL } from '../../../config/config';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Star, 
  Award, 
  CheckCircle, 
  Target,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Play,
  Loader2,
  AlertCircle,
  Eye,
  Calendar,
  Badge,
  Zap,
  TrendingUp,
  Download,
  Home
} from 'lucide-react';
import Link from 'next/link';
import SimpleShareButton from '../../../../components/SimpleShareButton';
import PreviewHeader from '../../../components/PreviewHeader';
import PreviewFooter from '../../../components/PreviewFooter';

interface RoadmapModule {
  title: string;
  description: string;
  topics: RoadmapTopic[];
}

interface RoadmapTopic {
  title: string;
  description: string;
  subtopics: RoadmapSubtopic[];
}

interface RoadmapSubtopic {
  id: string;
  title: string;
  description: string;
  learn: boolean;
  quiz: boolean;
  code: boolean;
}

interface CuratedRoadmapDetail {
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
  roadmap_plan: RoadmapModule[];
  estimated_hours?: number;
  prerequisites: string[];
  learning_outcomes: string[];
  tags: string[];
  target_audience?: string;
  slug?: string;
}

interface LearningResource {
  id: number;
  title: string;
  url: string;
  type: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

// Generate structured data for SEO
const generateRoadmapStructuredData = (roadmap: CuratedRoadmapDetail) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live';
  
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": roadmap.title,
    "description": roadmap.description,
    "provider": {
      "@type": "Organization",
      "name": "Menttor Labs",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/favicon_io_dark/android-chrome-512x512.png`,
        "width": 512,
        "height": 512
      }
    },
    "url": `${baseUrl}/explore/${roadmap.slug || roadmap.id}`,
    "image": [
      `${baseUrl}/og-roadmap-${roadmap.category}.png`,
      `${baseUrl}/og-image.png`
    ],
    "courseCode": roadmap.slug || roadmap.id.toString(),
    "educationalLevel": roadmap.difficulty,
    "about": roadmap.category.replace('-', ' '),
    "teaches": roadmap.learning_outcomes || [],
    "coursePrerequisites": roadmap.prerequisites || [],
    "keywords": roadmap.tags.join(', '),
    "audience": {
      "@type": "Audience",
      "audienceType": roadmap.target_audience || "Developers and tech professionals"
    },
    "timeRequired": roadmap.estimated_hours ? `PT${roadmap.estimated_hours}H` : undefined,
    "numberOfLessons": roadmap.roadmap_plan?.reduce((acc: number, module: RoadmapModule) => 
      acc + module.topics.reduce((topicAcc: number, topic: RoadmapTopic) => topicAcc + topic.subtopics.length, 0), 0
    ) || 0,
    "aggregateRating": roadmap.average_rating > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": roadmap.average_rating,
      "ratingCount": roadmap.adoption_count,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
    },
    "hasPart": roadmap.roadmap_plan?.map((module, moduleIndex) => ({
      "@type": "LearningResource",
      "name": module.title,
      "description": module.description,
      "position": moduleIndex + 1,
      "hasPart": module.topics.map((topic, topicIndex) => ({
        "@type": "LearningResource",
        "name": topic.title,
        "description": topic.description,
        "position": topicIndex + 1,
        "numberOfLessons": topic.subtopics.length
      }))
    })) || [],
    "isAccessibleForFree": true,
    "inLanguage": "en",
    "learningResourceType": "Course",
    "educationalUse": "Professional development",
    "typicalAgeRange": "18-65",
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "publisher": {
      "@type": "Organization",
      "name": "Menttor Labs",
      "url": baseUrl
    }
  };
};

// Generate breadcrumb structured data
const generateBreadcrumbStructuredData = (roadmap: CuratedRoadmapDetail) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live';
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Explore Roadmaps",
        "item": `${baseUrl}/explore`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": roadmap.category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        "item": `${baseUrl}/explore?category=${encodeURIComponent(roadmap.category)}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": roadmap.title,
        "item": `${baseUrl}/explore/${roadmap.slug || roadmap.id}`
      }
    ]
  };
};

interface RoadmapPreviewClientProps {
  slug: string;
}

// Simplified preview page with collapsible course content, simple link lists, and compact header
const RoadmapPreviewClient: React.FC<RoadmapPreviewClientProps> = ({ slug: roadmapSlug }) => {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [adopting, setAdopting] = useState(false);
  const [learningResources, setLearningResources] = useState<LearningResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]); // First module expanded by default
  
  // Use optimized hook for roadmap detail fetching
  const { 
    data: roadmap, 
    isLoading: loading, 
    error: queryError,
    isFetching 
  } = useCuratedRoadmapDetail(roadmapSlug);
  
  const error = queryError?.message || null;

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
    'web-development': 'bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white',
    'data-science': 'bg-purple-100 text-purple-800 dark:bg-purple-600 dark:text-white',
    'cloud-computing': 'bg-sky-100 text-sky-800 dark:bg-sky-600 dark:text-white',
    'computer-science': 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white',
    'mobile-development': 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-white',
    'devops': 'bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-white',
    'artificial-intelligence': 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-white',
    'cybersecurity': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-600 dark:text-white',
    'blockchain': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white',
    'game-development': 'bg-pink-100 text-pink-800 dark:bg-pink-600 dark:text-white',
    'database': 'bg-teal-100 text-teal-800 dark:bg-teal-600 dark:text-white',
    'system-design': 'bg-violet-100 text-violet-800 dark:bg-violet-600 dark:text-white',
    'competitive-programming': 'bg-amber-100 text-amber-800 dark:bg-amber-600 dark:text-white',
    'design': 'bg-rose-100 text-rose-800 dark:bg-rose-600 dark:text-white',
    'programming-languages': 'bg-lime-100 text-lime-800 dark:bg-lime-600 dark:text-white',
    'data-engineering': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-600 dark:text-white',
    'product-management': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-600 dark:text-white'
  };

  const difficultyColors: { [key: string]: string } = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-white',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-white'
  };

  // Fetch learning resources for this roadmap
  const fetchLearningResources = async (roadmapId: number) => {
    setLoadingResources(true);
    try {
      const response = await fetch(`${BACKEND_URL}/learning-resources/${roadmapId}`);
      if (response.ok) {
        const data = await response.json();
        setLearningResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to fetch learning resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  // Handle legacy ID-based URLs by redirecting to slug-based URLs
  useEffect(() => {
    if (roadmap && roadmap.slug && /^\d+$/.test(roadmapSlug) && roadmap.slug !== roadmapSlug) {
      router.replace(`/explore/${roadmap.slug}`);
    }
  }, [roadmap, roadmapSlug, router]);

  // Fetch learning resources when roadmap is loaded
  useEffect(() => {
    if (roadmap?.id) {
      fetchLearningResources(roadmap.id);
    }
  }, [roadmap?.id]);

  const handleAdoptRoadmap = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    try {
      setAdopting(true);
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/${roadmap?.id}/adopt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          curated_roadmap_id: roadmap?.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Clear any cached roadmap data to force refresh
        sessionStorage.removeItem('currentRoadmap');
        
        // Store the new roadmap ID to ensure it loads first
        sessionStorage.setItem('newlyAdoptedRoadmapId', result.personal_roadmap_id.toString());
        
        // Invalidate React Query cache to fetch fresh roadmap data
        queryClient.invalidateQueries({ queryKey: ['userRoadmap'] });
        
        router.push('/journey');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to adopt roadmap');
      }
    } catch (err) {
      alert('Failed to adopt roadmap. Please try again.');
    } finally {
      setAdopting(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const totalSubtopics = roadmap?.roadmap_plan?.reduce((acc: number, module: RoadmapModule) => 
    acc + module.topics.reduce((topicAcc: number, topic: RoadmapTopic) => topicAcc + topic.subtopics.length, 0), 0
  ) || 0;

  const totalTopics = roadmap?.roadmap_plan?.reduce((acc: number, module: RoadmapModule) => acc + module.topics.length, 0) || 0;

  const toggleModule = (moduleIndex: number) => {
    if (expandedModules.includes(moduleIndex)) {
      setExpandedModules(expandedModules.filter(index => index !== moduleIndex));
    } else {
      setExpandedModules([...expandedModules, moduleIndex]);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-8 w-1/3"></div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 mb-8">
              <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-6 w-2/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Roadmap Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/explore')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  const relatedRoadmaps = [
    { slug: `${roadmap?.category}-fundamentals`, title: `${roadmap?.category.replace('-', ' ')} Fundamentals`, category: roadmap?.category || '' },
    { slug: `advanced-${roadmap?.category}`, title: `Advanced ${roadmap?.category.replace('-', ' ')}`, category: roadmap?.category || '' },
    { slug: `${roadmap?.category}-projects`, title: `${roadmap?.category.replace('-', ' ')} Projects`, category: roadmap?.category || '' }
  ].filter(r => r.slug !== (roadmap?.slug || roadmap?.id?.toString()))

  return (
    <>
      {/* Structured Data for SEO */}
      {roadmap && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateRoadmapStructuredData(roadmap))
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateBreadcrumbStructuredData(roadmap))
            }}
          />
        </>
      )}
      
      <PreviewHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/explore" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Explore Roadmaps
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link 
            href={`/explore?category=${encodeURIComponent(roadmap.category)}`} 
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {roadmap.category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 dark:text-white font-medium truncate">
            {roadmap.title}
          </span>
        </nav>
        
        {/* Back Button (Secondary) */}
        <button
          onClick={() => router.push('/explore')}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Explore
        </button>

        {/* Compact Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 mb-6 border border-gray-200 dark:border-gray-700">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${categoryColors[roadmap.category] || 'bg-gray-100 text-gray-600'}`}>
              <span className="mr-1">{categoryIcons[roadmap.category] || '📚'}</span>
              {roadmap.category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </span>
            {roadmap.is_featured && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded text-xs font-medium">
                <Award className="w-3 h-3 mr-1" />
                Featured
              </span>
            )}
            {roadmap.is_verified && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded text-xs font-medium">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded ${difficultyColors[roadmap.difficulty]}`}>
              {roadmap.difficulty.charAt(0).toUpperCase() + roadmap.difficulty.slice(1)}
            </span>
          </div>
          
          {/* Title and Description */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
            {roadmap.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {roadmap.description}
          </p>
          
          {/* Quick Stats and CTA in one row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                <span>{formatNumber(roadmap.adoption_count)} students</span>
              </div>
              {roadmap.estimated_hours && (
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{roadmap.estimated_hours}h</span>
                </div>
              )}
              <div className="flex items-center">
                <BookOpen className="w-3 h-3 mr-1" />
                <span>{totalSubtopics} lessons</span>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdoptRoadmap}
                disabled={adopting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adopting ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Download className="w-3 h-3 mr-1" />
                )}
                {adopting ? 'Starting...' : user ? 'Start' : 'Sign In'}
              </button>
              <SimpleShareButton
                title={roadmap.title}
                text={`Learn ${roadmap.title} - ${roadmap.difficulty} level ${roadmap.category.replace('-', ' ')} roadmap`}
                url={`${window.location.origin}/explore/${roadmap.slug || roadmap.id}`}
                variant="button"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clean Learning Path */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Course Content</h2>
              
              {roadmap.roadmap_plan?.map((module: RoadmapModule, moduleIndex: number) => {
                const isExpanded = expandedModules.includes(moduleIndex);
                
                return (
                  <div key={moduleIndex} className="mb-6 last:mb-0">
                    <button
                      onClick={() => toggleModule(moduleIndex)}
                      className="w-full flex items-start mb-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold mr-4">
                        {moduleIndex + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-2">{module.title}</h3>
                          <div className="flex items-center ml-4">
                            <span className="text-xs text-gray-500 dark:text-gray-300 mr-2">
                              {module.topics.length} topics
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-200 text-sm leading-relaxed">{module.description}</p>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-12 space-y-3">
                        {module.topics.map((topic, topicIndex) => (
                          <div key={topicIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-black dark:text-white">{topic.title}</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-300">
                                {topic.subtopics.length} lessons
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-200 mb-3">{topic.description}</p>
                            
                            {topic.subtopics.length > 0 && (
                              <div className="space-y-2">
                                {topic.subtopics.slice(0, 3).map((subtopic, subtopicIndex) => (
                                  <div key={subtopicIndex} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{subtopic.title}</span>
                                    <div className="flex items-center space-x-1">
                                      {subtopic.learn && <BookOpen className="w-3 h-3 text-blue-500" />}
                                      {subtopic.quiz && <Badge className="w-3 h-3 text-green-500" />}
                                      {subtopic.code && <Play className="w-3 h-3 text-purple-500" />}
                                    </div>
                                  </div>
                                ))}
                                {topic.subtopics.length > 3 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-300 text-center py-2">
                                    +{topic.subtopics.length - 3} more lessons
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prerequisites */}
            {roadmap.prerequisites?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Prerequisites</h3>
                <ul className="space-y-2">
                  {roadmap.prerequisites.map((prereq: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-200">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Learning Outcomes */}
            {roadmap.learning_outcomes?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">What You'll Learn</h3>
                <ul className="space-y-2">
                  {roadmap.learning_outcomes.map((outcome: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-200">
                      <Target className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technologies */}
            {roadmap.tags?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Technologies & Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {roadmap.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm rounded-lg font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Target Audience */}
            {roadmap.target_audience && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Perfect For</h3>
                <p className="text-gray-600 dark:text-gray-200">{roadmap.target_audience}</p>
              </div>
            )}

            {/* Learning Resources */}
            {learningResources.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Learning Resources</h3>
                <div className="space-y-1">
                  {learningResources.slice(0, 5).map((resource) => (
                    <div key={resource.id}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        title={resource.description}
                      >
                        {resource.title}
                      </a>
                      <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                        ({resource.type})
                      </span>
                    </div>
                  ))}
                  {learningResources.length > 5 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      +{learningResources.length - 5} more resources below
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complete Learning Resources Section */}
        {learningResources.length > 0 && (
          <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
              Learning Resources
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Curated external resources to enhance your learning journey with {roadmap.title.toLowerCase()}.
            </p>
            
            <div className="space-y-2">
              {learningResources.map((resource) => (
                <div key={resource.id}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    title={resource.description}
                  >
                    {resource.title}
                  </a>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                    ({resource.type})
                  </span>
                  {resource.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {resource.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Roadmaps Section for Internal Linking */}
        <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
            Explore More {roadmap.category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Roadmaps
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Discover more learning paths in this category:
            </p>
            <div className="space-y-1">
              <div>
                <Link 
                  href={`/explore?category=${roadmap.category}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  All {roadmap.category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Courses
                </Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                  - Browse {roadmap.category.replace('-', ' ')} learning paths
                </span>
              </div>
              
              <div>
                <Link 
                  href={`/explore?difficulty=${roadmap.difficulty}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {roadmap.difficulty.charAt(0).toUpperCase() + roadmap.difficulty.slice(1)} Level Courses
                </Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                  - Perfect for your skill level
                </span>
              </div>
              
              <div>
                <Link 
                  href={`/explore`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Featured Roadmaps
                </Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                  - Top-rated learning paths
                </span>
              </div>
              
              <div>
                <Link 
                  href={`/explore?category=${roadmap.category}&difficulty=beginner`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Beginner {roadmap.category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                  - Start from the basics
                </span>
              </div>
              
              <div>
                <Link 
                  href={`/explore?category=${roadmap.category}&difficulty=advanced`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Advanced {roadmap.category.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Link>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                  - Master advanced concepts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <PreviewFooter />
    </>
  );
};

export default RoadmapPreviewClient;