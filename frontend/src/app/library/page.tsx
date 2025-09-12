'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { BookOpen, Loader2, Search } from 'lucide-react';
import Logo from '../../../components/Logo';
import { BACKEND_URL } from '../../config/config';

interface LibraryItem {
  slug: string;
  title: string;
  subject?: string;
  goal?: string;
}

export default function LibraryPage() {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([]);

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
        setLoading(false);
      }
    };

    fetchLibraryItems();
  }, []);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(libraryItems);
    } else {
      const filtered = libraryItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.goal && item.goal.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredItems(filtered);
    }
  }, [libraryItems, searchQuery]);

  // Helper function to format titles
  const formatTitle = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-4">
              <Logo variant="dark" />
              <nav className="hidden md:flex items-center space-x-1">
                <Link 
                  href="/" 
                  className="px-2 py-1 rounded text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/explore" 
                  className="px-2 py-1 rounded text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Explore
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-6">
          {/* Spiral Logo */}
          <div className="flex justify-center mb-6">
            <svg viewBox="0 0 50 50" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
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

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Library</h1>
          <p className="text-sm text-gray-600 mb-6">
            Knowledge base with editable, regeneratable content
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search library content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Library Content */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-2 py-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? `No results found for "${searchQuery}"` : 'No library content available'}
              </div>
            ) : (
              filteredItems.map((item) => (
              <a 
                key={item.slug}
                href={`/library/${item.slug}`}
                className="block p-2 border border-gray-200 rounded hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {item.title || formatTitle(item.slug)}
                </h3>
                <p className="text-gray-600 text-xs">
                  {item.goal || item.subject || `Learn about ${formatTitle(item.slug).toLowerCase()}`}
                </p>
              </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}