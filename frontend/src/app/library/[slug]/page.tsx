import React, { Suspense, lazy } from 'react';
import Link from 'next/link';
import { 
  Home, 
  BookOpen, 
  ChevronLeft
} from 'lucide-react';
import Logo from '../../../../components/Logo';
import { BACKEND_URL } from '../../../config/config';
import { cleanMarkdownText } from '../../journey/utils/textFormatting';
import { Metadata } from 'next';

// Lazy load the content renderer for better performance
const LibraryContentRenderer = lazy(() => import('../../../components/library/LibraryContentRenderer'));

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

// Generate static params for library pages (limited for faster builds)
export async function generateStaticParams() {
  // Return empty array to enable ISR without build-time generation
  // This allows pages to be generated on-demand with caching benefits
  return [];
}

// Generate metadata for each page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const response = await fetch(`${BACKEND_URL}/library/${params.slug}/content`);
    if (!response.ok) {
      return {
        title: 'Library - Menttor',
        description: 'Learning content from Menttor Library'
      };
    }
    
    const content: LibraryContent = await response.json();
    
    return {
      title: `${cleanMarkdownText(content.title)} - Menttor Library`,
      description: cleanMarkdownText(content.goal),
      keywords: `${content.title}, ${content.subject}, learning, education, menttor`,
      authors: [{ name: 'MenttorLabs' }],
      openGraph: {
        title: `${cleanMarkdownText(content.title)} - Menttor Library`,
        description: cleanMarkdownText(content.goal),
        type: 'article',
        url: `https://menttor.live/library/${params.slug}`,
        siteName: 'Menttor',
        images: [{
          url: 'https://menttor.live/og-image.png',
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${cleanMarkdownText(content.title)} - Menttor Library`,
        description: cleanMarkdownText(content.goal),
        images: ['https://menttor.live/og-image.png'],
      },
    };
  } catch (error) {
    return {
      title: 'Library - Menttor',
      description: 'Learning content from Menttor Library'
    };
  }
}

// Fetch content at build time
async function getLibraryContent(slug: string): Promise<LibraryContent | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/library/${slug}/content`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching library content:', error);
    return null;
  }
}

// Static page component
// Enable static generation with 30 minute revalidation
export const revalidate = 1800;

export default async function LibraryPage({ params }: { params: { slug: string } }) {
  const content = await getLibraryContent(params.slug);
  
  if (!content) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-4">This library page could not be found.</p>
          <Link href="/library" className="text-blue-600 hover:text-blue-800">
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
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
      <div className="bg-blue-50 border-b border-blue-200">
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
                    return (
                      <a
                        key={index}
                        href={`#${id}`}
                        className={`block py-1 text-sm transition-colors border-l-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 ${
                          heading.data.level === 1 ? '' : heading.data.level === 2 ? 'pl-3' : 'pl-6'
                        }`}
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
              <Suspense fallback={<div>Loading...</div>}>
                <LibraryContentRenderer 
                  content={content.content}
                  resources={content.resources}
                  subject={content.subject}
                  subtopic={content.title}
                />
              </Suspense>
            </article>

            {/* Footer */}
            <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-sm text-gray-500 dark:text-gray-400 space-y-3 sm:space-y-0">
                <div>
                  <p>Last updated: {new Date(content.lastUpdated).toLocaleDateString()}</p>
                </div>
                <div>
                  <p>Part of Menttor Library</p>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}