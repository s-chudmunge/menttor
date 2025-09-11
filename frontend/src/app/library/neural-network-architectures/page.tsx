'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Home, 
  BookOpen, 
  Edit3, 
  Eye,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import Logo from '../../../../components/Logo';
import LibraryContentRenderer from '../../../components/library/LibraryContentRenderer';
import { BACKEND_URL } from '../../../config/config';

// Type definition for library content with optional resources
interface LibraryContent {
  title: string;
  subject: string;
  goal: string;
  lastUpdated: string;
  content: any[];
  resources?: Array<{
    title: string;
    url: string;
    type: string;
    description: string;
  }>;
}

export default function NeuralNetworkArchitecturesPage() {
  const [editMode, setEditMode] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [content, setContent] = useState<LibraryContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch content from backend API
  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BACKEND_URL}/library/neural-network-architectures/content`);
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`);
      }
      const contentData = await response.json();
      setContent(contentData);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
      // Fallback to static content if API fails
      import('../../../content/neural-network-architectures.json').then(fallbackContent => {
        setContent(fallbackContent.default as LibraryContent);
      }).catch(() => {
        console.error('Failed to load fallback content');
      });
    } finally {
      setLoading(false);
    }
  };

  // Load content on mount
  useEffect(() => {
    fetchContent();
  }, []);

  // Keyboard shortcut for edit mode toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        setEditMode(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll spy for TOC active highlighting
  useEffect(() => {
    if (!content) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    // Observe all heading elements
    const headings = content.content.filter(block => block.type === 'heading');
    headings.forEach((heading: any) => {
      const slug = heading.data.text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') || '';
      const id = `heading-${slug}`;
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading: any) => {
        const slug = heading.data.text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') || '';
        const id = `heading-${slug}`;
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [content]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-6">
                <Logo variant="dark" />
                <nav className="hidden md:flex items-center space-x-1">
                  <Link 
                    href="/" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </Link>
                  <Link 
                    href="/explore" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Explore</span>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !content) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-6">
                <Logo variant="dark" />
                <nav className="hidden md:flex items-center space-x-1">
                  <Link 
                    href="/" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </Link>
                  <Link 
                    href="/explore" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Explore</span>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Content</h2>
            <p className="text-gray-600 mb-4">{error || 'Unable to load library content'}</p>
            <button
              onClick={fetchContent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-6">
              <Logo variant="dark" />
              <nav className="hidden md:flex items-center space-x-1">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
                <Link 
                  href="/explore" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore</span>
                </Link>
              </nav>
            </div>

          </div>
        </div>
      </header>

      {/* Subheader */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Link href="/library" className="hover:text-blue-800 font-medium">Library</Link>
              <ChevronLeft className="w-4 h-4 rotate-180" />
              <span className="text-blue-800">Neural Network Architectures</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Neural Network Architectures</h1>
            <p className="text-gray-700 text-sm max-w-3xl">
              Comprehensive guide to neural network architectures in deep learning research, covering feedforward networks, CNNs, RNNs, and Transformers.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-12">
          {/* Table of Contents - Desktop */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contents</h3>
              <nav className="space-y-1">
                {content.content
                  .filter(block => block.type === 'heading')
                  .map((heading: any, index) => {
                    const slug = heading.data.text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') || '';
                    const id = `heading-${slug}`;
                    const isActive = activeHeadingId === id;
                    return (
                      <a
                        key={index}
                        href={`#${id}`}
                        className={`block py-1 text-sm transition-colors border-l-2 ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border-blue-500 font-medium' 
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        } ${
                          heading.data.level === 1 ? '' : heading.data.level === 2 ? 'pl-3' : 'pl-6'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {heading.data.text}
                      </a>
                    );
                  })
                }
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-none">
            <article className="prose prose-gray max-w-none">
              <LibraryContentRenderer 
                content={content.content}
                resources={content.resources}
                subject={content.subject}
                subtopic={content.title}
                editMode={editMode}
                pageSlug="neural-network-architectures"
                onContentUpdated={fetchContent}
              />
            </article>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between items-center text-sm text-gray-500">
                <div>
                  <p>Last updated: {new Date(content.lastUpdated).toLocaleDateString()}</p>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center space-x-4">
                  <p>Part of Menttor Library</p>
                  {/* Edit Mode Toggle - Small */}
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      editMode 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title={`${editMode ? 'Exit' : 'Enter'} edit mode (Ctrl+E)`}
                  >
                    {editMode ? 'Exit Edit' : 'Edit'}
                  </button>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}