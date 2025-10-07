'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { BookOpen, Loader2, Search } from 'lucide-react';
import Logo from '../../../components/Logo';
import { BACKEND_URL } from '../../config/config';
import { cleanMarkdownText } from '../journey/utils/textFormatting';

// Skeleton component for library items
const LibraryItemSkeleton = () => (
  <div className="block p-4 border border-gray-200 rounded-lg min-h-[60px] animate-pulse">
    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
    <div className="h-3 bg-gray-200 rounded w-full"></div>
  </div>
);

// Skeleton grid for loading state
const LibraryGridSkeleton = () => (
  <div className="grid gap-3 py-4 px-2 sm:px-0">
    {Array.from({ length: 12 }, (_, i) => (
      <LibraryItemSkeleton key={i} />
    ))}
  </div>
);

interface LibraryItem {
  slug: string;
  title: string;
  subject?: string;
  goal?: string;
}

// Library item component with aggressive prefetching
const LibraryItem = React.memo(({ item }: { item: LibraryItem }) => {
  const handleMouseEnter = () => {
    // Prefetch the static page content
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/library/${item.slug}`;
    link.as = 'document';
    document.head.appendChild(link);
  };
  
  const formatTitle = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <Link 
      href={`/library/${item.slug}`}
      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all min-h-[60px] touch-manipulation"
      onMouseEnter={handleMouseEnter}
      prefetch={true}
    >
      <h3 className="text-base sm:text-sm font-medium text-gray-900 mb-2 leading-tight">
        {cleanMarkdownText(item.title) || formatTitle(item.slug)}
      </h3>
      <p className="text-gray-600 text-sm sm:text-xs leading-relaxed">
        {cleanMarkdownText(item.goal) || cleanMarkdownText(item.subject) || `Learn about ${formatTitle(item.slug).toLowerCase()}`}
      </p>
    </Link>
  );
});

LibraryItem.displayName = 'LibraryItem';

export default function LibraryPage() {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch available library content
  useEffect(() => {
    const fetchLibraryItems = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/library/available`);
        if (response.ok) {
          const data = await response.json();
          setLibraryItems(data);
        } else {
          // Fallback to hardcoded items if API fails
          setLibraryItems([
            {
              slug: 'neural-network-architectures',
              title: 'Neural Network Architectures',
              goal: 'Comprehensive guide to neural network architectures in deep learning research'
            },
            {
              slug: 'backpropagation-and-gradient-descent-variants',
              title: 'Backpropagation and Gradient Descent Variants',
              goal: 'Learn about the fundamental algorithms that enable deep learning models to learn and optimize'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch library items:', error);
        // Fallback to hardcoded items
        setLibraryItems([
          {
            slug: 'neural-network-architectures',
            title: 'Neural Network Architectures',
            goal: 'Comprehensive guide to neural network architectures in deep learning research'
          },
          {
            slug: 'backpropagation-and-gradient-descent-variants',
            title: 'Backpropagation and Gradient Descent Variants',
            goal: 'Learn about the fundamental algorithms that enable deep learning models to learn and optimize'
          }
        ]);
      } finally {
        if (!isInitialLoad) {
          setLoading(false);
        }
      }
    };

    fetchLibraryItems();
  }, []);

  // Memoized filtered items for better performance
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return libraryItems;
    }
    return libraryItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.goal && item.goal.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [libraryItems, searchQuery]);
  
  // Add a brief delay for skeleton to show on first load
  useEffect(() => {
    if (libraryItems.length > 0 && isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [libraryItems, isInitialLoad]);


  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Library - Learning Content | Menttor</title>
        <meta name="description" content="Explore comprehensive learning content covering topics from programming to data science. Interactive lessons, visualizations, and resources for effective learning." />
        <meta name="keywords" content="learning library, educational content, programming tutorials, data science, machine learning, interactive learning, menttor library" />
        <meta name="author" content="MenttorLabs" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph meta tags */}
        <meta property="og:title" content="Library - Learning Content | Menttor" />
        <meta property="og:description" content="Explore comprehensive learning content covering topics from programming to data science." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://menttor.live/library" />
        <meta property="og:site_name" content="Menttor" />
        <meta property="og:image" content="https://menttor.live/og-image.png" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Library - Learning Content | Menttor" />
        <meta name="twitter:description" content="Explore comprehensive learning content covering topics from programming to data science." />
        <meta name="twitter:image" content="https://menttor.live/og-image.png" />
        
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": "Menttor Library",
              "description": "Comprehensive learning content covering various topics in technology and education",
              "url": "https://menttor.live/library",
              "mainEntity": {
                "@type": "ItemList",
                "name": "Learning Content Library",
                "description": "Collection of educational content"
              },
              "publisher": {
                "@type": "Organization",
                "name": "MenttorLabs",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://menttor.live/logo.png"
                }
              }
            })
          }}
        />
      </Head>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4">
              <Logo variant="dark" />
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link 
                  href="/" 
                  className="px-3 py-2 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/explore" 
                  className="px-3 py-2 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Explore
                </Link>
              </nav>
            </div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Link 
                href="/" 
                className="px-3 py-2 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-h-[44px] flex items-center"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-4 sm:py-6">
          {/* Spiral Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <svg viewBox="0 0 50 50" className="w-12 h-12 sm:w-16 sm:h-16" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#2563eb', stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:'#1d4ed8', stopOpacity:1}} />
                </linearGradient>
                <filter id="organic-glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <style>
                {`
                  @keyframes fractal-zoom {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                  }
                  @keyframes quantum-flicker {
                    0%, 100% { opacity: 1; transform: translateX(0); }
                    25% { opacity: 0.7; transform: translateX(-0.5px); }
                    50% { opacity: 0.3; transform: translateX(0.5px); }
                    75% { opacity: 0.8; transform: translateX(-0.2px); }
                  }
                  .fractal-element {
                    animation: fractal-zoom 4s ease-in-out infinite;
                  }
                  .quantum-element {
                    animation: quantum-flicker 3s ease-in-out infinite;
                  }
                `}
              </style>

              <g className="fractal-element">
                <circle cx="25" cy="25" r="22" fill="none" stroke="url(#spiralGradient)" strokeWidth="1.5" opacity="0.3"/>
                
                <path d="M 25 5 
                         Q 40 10, 42 25
                         Q 40 40, 25 42
                         Q 10 40, 8 25
                         Q 10 15, 18 13
                         Q 28 15, 30 25
                         Q 28 32, 22 34
                         Q 18 32, 17 28
                         Q 18 25, 21 24
                         Q 24 25, 25 27" 
                      fill="none" 
                      stroke="url(#spiralGradient)" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                      filter="url(#organic-glow)"
                      className="quantum-element"/>

                <circle cx="25" cy="27" r="2" fill="url(#spiralGradient)" className="quantum-element"/>

                <g opacity="0.4">
                  <line x1="15" y1="12" x2="18" y2="15" stroke="#2563eb" strokeWidth="0.8"/>
                  <line x1="35" y1="12" x2="32" y2="15" stroke="#2563eb" strokeWidth="0.8"/>
                  <circle cx="15" cy="12" r="1" fill="#2563eb"/>
                  <circle cx="35" cy="12" r="1" fill="#2563eb"/>
                </g>
              </g>
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Library</h1>
          <p className="text-sm text-gray-600 mb-4 sm:mb-6 px-4 sm:px-0">
            Knowledge base with editable, regeneratable content
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative px-2 sm:px-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search library content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Search className="w-4 h-4" />
              </button>
            </div>
            
            {/* Page Count Display */}
            {!loading && !isInitialLoad && (
              <div className="text-center mt-3">
                <p className="text-sm text-gray-500">
                  {searchQuery ? (
                    <>Showing {filteredItems.length} of {libraryItems.length} pages</>
                  ) : (
                    <>{libraryItems.length} pages available</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Library Content */}
        <Suspense fallback={<LibraryGridSkeleton />}>
          {(loading || isInitialLoad) ? (
            <LibraryGridSkeleton />
          ) : (
            <div className="grid gap-3 py-4 px-2 sm:px-0">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? `No results found for "${searchQuery}"` : 'No library content available'}
                </div>
              ) : (
                filteredItems.map((item) => (
                  <LibraryItem key={item.slug} item={item} />
                ))
              )}
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}