"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
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
import RoadmapShareButton from '../../../../components/RoadmapShareButton';

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
        "url": `${baseUrl}/favicon.svg`
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
    "numberOfLessons": roadmap.roadmap_plan?.reduce((acc, module) => 
      acc + module.topics.reduce((topicAcc, topic) => topicAcc + topic.subtopics.length, 0), 0
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
        "name": roadmap.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
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

const RoadmapPreviewPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const roadmapSlug = params.slug as string;
  
  const [roadmap, setRoadmap] = useState<CuratedRoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adopting, setAdopting] = useState(false);

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

  const difficultyColors: { [key: string]: string } = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  useEffect(() => {
    fetchRoadmap();
  }, [roadmapSlug]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to fetch by slug
      let response = await fetch(`${BACKEND_URL}/curated-roadmaps/slug/${roadmapSlug}`);
      
      // If slug fails and the parameter looks like a numeric ID, try the old ID endpoint for backward compatibility
      if (!response.ok && /^\d+$/.test(roadmapSlug)) {
        response = await fetch(`${BACKEND_URL}/curated-roadmaps/${roadmapSlug}`);
        
        if (response.ok) {
          const data = await response.json();
          // Redirect to slug-based URL if we found it by ID
          if (data.slug) {
            router.replace(`/explore/${data.slug}`);
            return;
          }
          setRoadmap(data);
        } else {
          setError('Roadmap not found');
        }
        return;
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Roadmap not found');
        } else {
          setError('Failed to fetch roadmap details');
        }
        return;
      }
      
      const data = await response.json();
      setRoadmap(data);
      console.info(`Loaded roadmap from database: ${data.title}`);
    } catch (err) {
      setError('Failed to load roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const totalSubtopics = roadmap?.roadmap_plan?.reduce((acc, module) => 
    acc + module.topics.reduce((topicAcc, topic) => topicAcc + topic.subtopics.length, 0), 0
  ) || 0;

  const totalTopics = roadmap?.roadmap_plan?.reduce((acc, module) => acc + module.topics.length, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-gray-900 dark:to-blue-950/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-8 w-1/3"></div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-8 mb-8">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-2/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-gray-900 dark:to-blue-950/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Roadmap Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
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
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-gray-900 dark:to-blue-950/20">
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
            {roadmap.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

        {/* Clean Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${categoryColors[roadmap.category] || 'bg-gray-100 text-gray-600'}`}>
              <span className="mr-2">{categoryIcons[roadmap.category] || '📚'}</span>
              {roadmap.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {roadmap.is_featured && (
              <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-md text-sm font-medium">
                <Award className="w-3 h-3 mr-1" />
                Featured
              </span>
            )}
            {roadmap.is_verified && (
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-md text-sm font-medium">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </span>
            )}
            <span className={`px-3 py-1 text-sm font-medium rounded-md ${difficultyColors[roadmap.difficulty]}`}>
              {roadmap.difficulty.charAt(0).toUpperCase() + roadmap.difficulty.slice(1)}
            </span>
          </div>
          
          {/* Title and Description */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {roadmap.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {roadmap.description}
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span className="font-medium">{formatNumber(roadmap.adoption_count)} students</span>
            </div>
            {roadmap.estimated_hours && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span className="font-medium">{roadmap.estimated_hours} hours</span>
              </div>
            )}
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="font-medium">{totalSubtopics} lessons</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleAdoptRoadmap}
              disabled={adopting}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adopting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {adopting ? 'Starting...' : user ? 'Start Learning' : 'Sign In to Start'}
            </button>
            <RoadmapShareButton 
              roadmap={roadmap} 
              variant="button"
            />
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clean Learning Path */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Course Content</h2>
              
              {roadmap.roadmap_plan?.map((module, moduleIndex) => (
                <div key={moduleIndex} className="mb-6 last:mb-0">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold mr-4">
                      {moduleIndex + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{module.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{module.description}</p>
                    </div>
                  </div>
                  
                  <div className="ml-12 space-y-3">
                    {module.topics.map((topic, topicIndex) => (
                      <div key={topicIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{topic.title}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {topic.subtopics.length} lessons
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{topic.description}</p>
                        
                        {topic.subtopics.length > 0 && (
                          <div className="space-y-2">
                            {topic.subtopics.slice(0, 3).map((subtopic, subtopicIndex) => (
                              <div key={subtopicIndex} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{subtopic.title}</span>
                                <div className="flex items-center space-x-1">
                                  {subtopic.learn && <BookOpen className="w-3 h-3 text-blue-500" />}
                                  {subtopic.quiz && <Badge className="w-3 h-3 text-green-500" />}
                                  {subtopic.code && <Play className="w-3 h-3 text-purple-500" />}
                                </div>
                              </div>
                            ))}
                            {topic.subtopics.length > 3 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                +{topic.subtopics.length - 3} more lessons
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prerequisites */}
            {roadmap.prerequisites?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prerequisites</h3>
                <ul className="space-y-2">
                  {roadmap.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Learning Outcomes */}
            {roadmap.learning_outcomes?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What You'll Learn</h3>
                <ul className="space-y-2">
                  {roadmap.learning_outcomes.map((outcome, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technologies */}
            {roadmap.tags?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technologies & Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {roadmap.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Target Audience */}
            {roadmap.target_audience && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Perfect For</h3>
                <p className="text-gray-600 dark:text-gray-400">{roadmap.target_audience}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Roadmaps Section for Internal Linking */}
        <div className="mt-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Explore More {roadmap.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Roadmaps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dynamic Links Based on Category and Difficulty */}
            <Link 
              href={`/explore?category=${roadmap.category}`}
              className="group p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    All {roadmap.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Courses
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Browse {roadmap.category.replace('-', ' ')} learning paths
                  </p>
                </div>
              </div>
            </Link>

            <Link 
              href={`/explore?difficulty=${roadmap.difficulty}`}
              className="group p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                    {roadmap.difficulty.charAt(0).toUpperCase() + roadmap.difficulty.slice(1)} Level Courses
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Perfect for your skill level
                  </p>
                </div>
              </div>
            </Link>

            <Link 
              href={`/explore`}
              className="group p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Featured Roadmaps
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Most popular learning paths
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Skill-based internal links */}
          {roadmap.tags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learn Related Skills:</h3>
              <div className="flex flex-wrap gap-2">
                {roadmap.tags.slice(0, 6).map((tag, index) => (
                  <Link
                    key={index}
                    href={`/explore?q=${encodeURIComponent(tag)}`}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 text-sm rounded-lg font-medium transition-colors"
                  >
                    {tag} courses
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default RoadmapPreviewPage;