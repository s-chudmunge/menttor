'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Loader2 } from 'lucide-react';
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

  // Helper function to format titles
  const formatTitle = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-white">
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="text-sm text-gray-600">
            Knowledge base with editable, regeneratable content
          </p>
        </div>

        {/* Library Content */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-2 py-2">
            {libraryItems.map((item) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}