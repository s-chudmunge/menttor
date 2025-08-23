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

async function getRoadmapData(id: string): Promise<CuratedRoadmap | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/curated-roadmaps/${id}`, {
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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const roadmap = await getRoadmapData(params.id);
  
  if (!roadmap) {
    return {
      title: 'Roadmap Not Found | Menttor',
      description: 'The requested learning roadmap could not be found.',
    };
  }

  const title = `${roadmap.title} - ${roadmap.difficulty} Level | Menttor`;
  const description = `${roadmap.description} Learn with our expert-curated ${roadmap.difficulty} level roadmap. ${roadmap.estimated_hours ? `Estimated: ${roadmap.estimated_hours} hours.` : ''} Join ${roadmap.adoption_count}+ learners.`;
  const keywords = [
    roadmap.title,
    ...roadmap.tags,
    roadmap.category.replace('-', ' '),
    `${roadmap.difficulty} level`,
    'learning roadmap',
    'online course',
    'skill development',
    roadmap.target_audience || 'developers'
  ];

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.vercel.app';
  const url = `${baseUrl}/explore/${roadmap.id}`;

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
      canonical: `/explore/${roadmap.id}`,
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
          alt: 'Menttor - AI-Powered Learning Platform',
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
    },
  };
}

export default function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}