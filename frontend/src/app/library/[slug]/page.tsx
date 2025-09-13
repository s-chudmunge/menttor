'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useParams } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  Edit3, 
  Eye,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import Logo from '../../../../components/Logo';
import { BACKEND_URL } from '../../../config/config';
import { cleanMarkdownText } from '../../journey/utils/textFormatting';

// Lazy load the content renderer for better performance
const LibraryContentRenderer = lazy(() => import('../../../components/library/LibraryContentRenderer'));

// Skeleton components
const ContentSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
    </div>
  </div>
);

const TOCSkeleton = () => (
  <div className="animate-pulse space-y-2">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 ml-4"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3 ml-4"></div>
    <div className="h-4 bg-gray-200 rounded w-3/5"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 ml-4"></div>
  </div>
);

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

export default function DynamicLibraryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [editMode, setEditMode] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [content, setContent] = useState<LibraryContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch content from backend API
  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BACKEND_URL}/library/${slug}/content`);
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`);
      }
      const contentData = await response.json();
      setContent(contentData);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
      
      // Fallback to static content if API fails
      try {
        const fallbackContent = await import(`../../../content/${slug}.json`);
        setContent(fallbackContent.default as LibraryContent);
      } catch (fallbackErr) {
        console.error('Failed to load fallback content:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load content on mount
  useEffect(() => {
    if (slug) {
      fetchContent();
    }
  }, [slug]);
  
  // Handle initial loading with skeleton delay
  useEffect(() => {
    if (content && isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        setLoading(false);
      }, 400); // Slightly longer delay for content pages
      return () => clearTimeout(timer);
    }
  }, [content, isInitialLoad]);

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
      const headingSlug = heading.data.text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') || '';
      const id = `heading-${headingSlug}`;
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading: any) => {
        const headingSlug = heading.data.text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') || '';
        const id = `heading-${headingSlug}`;
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [content]);

  // Helper function to format title for display
  const formatTitle = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Show loading state with skeleton
  if (loading || isInitialLoad) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div className="flex items-center space-x-4 sm:space-x-6">
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
                    href="/library" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Library</span>
                  </Link>
                </nav>
              </div>
              <div className="md:hidden">
                <Link 
                  href="/library"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </Link>
              </div>
            </div>
          </div>
        </header>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="lg:flex lg:gap-8">
            {/* Desktop TOC Skeleton */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="h-5 bg-gray-200 rounded mb-4 w-3/4 animate-pulse"></div>
                  <TOCSkeleton />
                </div>
              </div>
            </aside>

            {/* Mobile TOC Skeleton */}
            <div className="lg:hidden mb-6">
              <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <main className="lg:flex-1 lg:min-w-0 w-full">
              <article className="prose prose-gray max-w-none lg:max-w-none">
                <ContentSkeleton />
              </article>
            </main>
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
      <Head>
        <title>{cleanMarkdownText(content.title)} - Menttor Library</title>
        <meta name="description" content={cleanMarkdownText(content.goal)} />
        <meta name="keywords" content={`${content.title}, ${content.subject}, learning, education, menttor`} />
        <meta name="author" content="MenttorLabs" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph meta tags */}
        <meta property="og:title" content={`${cleanMarkdownText(content.title)} - Menttor Library`} />
        <meta property="og:description" content={cleanMarkdownText(content.goal)} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://menttor.live/library/${slug}`} />
        <meta property="og:site_name" content="Menttor" />
        <meta property="og:image" content="https://menttor.live/og-image.png" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${cleanMarkdownText(content.title)} - Menttor Library`} />
        <meta name="twitter:description" content={cleanMarkdownText(content.goal)} />
        <meta name="twitter:image" content="https://menttor.live/og-image.png" />
        
        {/* Article meta tags */}
        <meta property="article:published_time" content={content.lastUpdated} />
        <meta property="article:modified_time" content={content.lastUpdated} />
        <meta property="article:section" content={content.subject} />
        <meta property="article:tag" content={content.title} />
        
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": cleanMarkdownText(content.title),
              "description": cleanMarkdownText(content.goal),
              "author": {
                "@type": "Organization",
                "name": "MenttorLabs",
                "url": "https://menttor.live"
              },
              "publisher": {
                "@type": "Organization",
                "name": "MenttorLabs",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://menttor.live/logo.png"
                }
              },
              "datePublished": content.lastUpdated,
              "dateModified": content.lastUpdated,
              "url": `https://menttor.live/library/${slug}`,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://menttor.live/library/${slug}`
              },
              "articleSection": content.subject,
              "keywords": `${content.title}, ${content.subject}, learning, education`
            })
          }}
        />
      </Head>
      
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Logo variant="dark" />
              
              {/* Desktop Navigation */}
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
                <Link 
                  href="/library" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Library</span>
                </Link>
              </nav>
            </div>

            {/* Mobile Back Button */}
            <div className="md:hidden">
              <Link 
                href="/library" 
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Library</span>
              </Link>
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
              <span className="text-blue-800">{cleanMarkdownText(content.title)}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{cleanMarkdownText(content.title)}</h1>
            <p className="text-gray-700 text-sm max-w-3xl">
              {cleanMarkdownText(content.goal)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="lg:flex lg:gap-12">
          {/* Table of Contents - Desktop Only */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contents</h3>
              <nav className="space-y-1">
                {content.content
                  .filter(block => block.type === 'heading')
                  .map((heading: any, index) => {
                    const headingSlug = heading.data.text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') || '';
                    const id = `heading-${headingSlug}`;
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
                        {cleanMarkdownText(heading.data.text)}
                      </a>
                    );
                  })
                }
              </nav>
            </div>
          </aside>

          {/* Mobile Table of Contents */}
          <div className="lg:hidden mb-6">
            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="font-semibold text-gray-900 cursor-pointer flex items-center justify-between">
                <span>Table of Contents</span>
                <svg className="w-5 h-5 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <nav className="mt-3 space-y-2">
                {content.content
                  .filter(block => block.type === 'heading')
                  .map((heading: any, index) => {
                    const headingSlug = heading.data.text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') || '';
                    const id = `heading-${headingSlug}`;
                    return (
                      <a
                        key={index}
                        href={`#${id}`}
                        className={`block py-2 px-3 text-sm rounded transition-colors ${
                          heading.data.level === 1 ? 'font-medium text-gray-900' : 
                          heading.data.level === 2 ? 'text-gray-700 pl-6' : 'text-gray-600 pl-9'
                        } hover:bg-gray-100`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {cleanMarkdownText(heading.data.text)}
                      </a>
                    );
                  })
                }
              </nav>
            </details>
          </div>

          {/* Main Content */}
          <main className="lg:flex-1 lg:min-w-0 w-full">
            <article className="prose prose-gray max-w-none lg:max-w-none">
              <Suspense fallback={<ContentSkeleton />}>
                <LibraryContentRenderer 
                  content={content.content}
                  resources={content.resources}
                  subject={content.subject}
                  subtopic={content.title}
                  editMode={editMode}
                  pageSlug={slug}
                  onContentUpdated={fetchContent}
                />
              </Suspense>
            </article>

            {/* Footer */}
            <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-sm text-gray-500 space-y-3 sm:space-y-0">
                <div>
                  <p>Last updated: {new Date(content.lastUpdated).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <p>Part of Menttor Library</p>
                  {/* Edit Mode Toggle - Larger for mobile */}
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`text-sm px-3 py-2 rounded transition-colors min-h-[44px] ${
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