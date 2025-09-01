import type { Metadata } from 'next';
import { BACKEND_URL } from '../../../config/config';

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

async function getRoadmapData(slug: string): Promise<CuratedRoadmap | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/curated-roadmaps/slug/${slug}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch roadmap for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const roadmap = await getRoadmapData(params.slug);
  
  if (!roadmap) {
    return {
      title: 'Roadmap Not Found | Menttor',
      description: 'The requested learning roadmap could not be found.',
    };
  }

  const title = `${roadmap.title} - ${roadmap.difficulty} Level Learning Path | Menttor`;
  const description = `Master ${roadmap.tags.slice(0, 3).join(', ')} with our expert-curated ${roadmap.difficulty} level roadmap. ${roadmap.description} ${roadmap.estimated_hours ? `Complete in ${roadmap.estimated_hours} hours.` : ''} Join ${roadmap.adoption_count}+ learners today.`;
  
  // Enhanced keywords for better search visibility
  const keywords = [
    roadmap.title,
    ...roadmap.tags,
    roadmap.category.replace('-', ' '),
    `${roadmap.difficulty} level`,
    `${roadmap.category.replace('-', ' ')} tutorial`,
    `${roadmap.category.replace('-', ' ')} course`,
    `learn ${roadmap.tags[0] || roadmap.category.replace('-', ' ')}`,
    `${roadmap.tags[0] || roadmap.category.replace('-', ' ')} roadmap`,
    `${roadmap.tags[0] || roadmap.category.replace('-', ' ')} ${roadmap.difficulty}`,
    'learning roadmap',
    'online course',
    'skill development',
    'career advancement',
    'professional development',
    roadmap.target_audience || 'developers',
    'step by step guide',
    'comprehensive tutorial'
  ];

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live';
  const url = `${baseUrl}/explore/${roadmap.slug || roadmap.id}`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'Menttor Labs' }],
    creator: 'Menttor Labs',
    publisher: 'Menttor Labs',
    category: roadmap.category.replace('-', ' '),
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/explore/${roadmap.slug || roadmap.id}`,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Menttor',
      images: [
        {
          url: `/og-roadmap-${roadmap.category}.png`, // We can create category-specific OG images
          width: 1200,
          height: 630,
          alt: `${roadmap.title} - Learning Roadmap on Menttor`,
        },
        {
          url: '/og-image.png', // Fallback
          width: 1200,
          height: 630,
          alt: 'Menttor - Smart Learning Platform',
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      section: roadmap.category.replace('-', ' '),
      tags: roadmap.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      images: [`/og-roadmap-${roadmap.category}.png`],
      creator: '@menttorlabs',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'article:author': 'Menttor Labs',
      'article:section': roadmap.category.replace('-', ' '),
      'article:tag': roadmap.tags.join(', '),
      'course:difficulty': roadmap.difficulty,
      'course:duration': roadmap.estimated_hours ? `${roadmap.estimated_hours} hours` : 'Variable',
      'course:students': roadmap.adoption_count.toString(),
      'course:rating': roadmap.average_rating.toString(),
      // Structured Data for better search visibility
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: roadmap.title,
        description: roadmap.description,
        provider: {
          '@type': 'Organization',
          name: 'Menttor Labs',
          url: baseUrl,
          logo: `${baseUrl}/favicon_io_dark/android-chrome-512x512.png`
        },
        educationalLevel: roadmap.difficulty,
        about: roadmap.category.replace('-', ' '),
        keywords: roadmap.tags.join(', '),
        courseCode: roadmap.slug || roadmap.id.toString(),
        url: url,
        timeRequired: roadmap.estimated_hours ? `PT${roadmap.estimated_hours}H` : undefined,
        aggregateRating: roadmap.average_rating > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: roadmap.average_rating,
          ratingCount: roadmap.adoption_count,
          bestRating: 5,
          worstRating: 1
        } : undefined,
        audience: {
          '@type': 'EducationalAudience',
          educationalRole: roadmap.target_audience || 'student'
        },
        teaches: roadmap.tags,
        inLanguage: 'en',
        isAccessibleForFree: true,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        publisher: {
          '@type': 'Organization',
          name: 'Menttor Labs'
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url
        }
      })
    },
  };
}

export default function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}