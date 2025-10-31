import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface CuratedRoadmapDetail {
  id: number;
  title: string;
  description: string;
  category: string;
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://menttor-backend.onrender.com'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live'
  
  try {
    // Try to fetch roadmap by slug first
    let response = await fetch(`${backendUrl}/curated-roadmaps/slug/${params.slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    // Fallback to ID if slug fails and param looks numeric
    if (!response.ok && /^\d+$/.test(params.slug)) {
      response = await fetch(`${backendUrl}/curated-roadmaps/${params.slug}`)
    }
    
    if (!response.ok) {
      return {
        title: 'Roadmap Not Found | Menttor Smart Learning Platform',
        description: 'The requested learning roadmap could not be found. Explore our collection of free programming courses and tech training paths.',
      }
    }
    
    const roadmap: CuratedRoadmapDetail = await response.json()
    
    // Generate SEO-optimized title and description
    const categoryName = roadmap.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    const difficultyLevel = roadmap.difficulty.charAt(0).toUpperCase() + roadmap.difficulty.slice(1)
    
    const title = `${roadmap.title} | Free ${categoryName} Course & Learning Roadmap`
    const description = `Learn ${categoryName.toLowerCase()} with this ${difficultyLevel.toLowerCase()} level roadmap. ${roadmap.description} Free course with ${roadmap.estimated_hours || 'expert-designed'} hours of content, interactive practice, and certification.`
    
    // Extract main skills for keywords
    const skillKeywords = roadmap.tags.map(tag => [
      `${tag} course`,
      `learn ${tag}`,
      `${tag} tutorial`,
      `${tag} training`
    ]).flat()
    
    const keywords = [
      ...skillKeywords,
      `${categoryName.toLowerCase()} course`,
      `${categoryName.toLowerCase()} training`,
      `${categoryName.toLowerCase()} tutorial`,
      `${categoryName.toLowerCase()} roadmap`,
      `learn ${categoryName.toLowerCase()}`,
      `free ${categoryName.toLowerCase()} course`,
      `${difficultyLevel.toLowerCase()} ${categoryName.toLowerCase()}`,
      'programming course',
      'coding tutorial',
      'tech training',
      'smart learning',
      'personalized roadmap',
      'interactive course',
      'free programming',
      'coding practice'
    ]
    
    return {
      title,
      description,
      keywords: keywords.slice(0, 50), // Limit keywords
      openGraph: {
        title: `${roadmap.title} - Free ${categoryName} Course`,
        description,
        url: `${baseUrl}/explore/${roadmap.slug || roadmap.id}`,
        type: 'article',
        images: [
          {
            url: `/og-roadmap-${roadmap.category}.png`,
            width: 1200,
            height: 630,
            alt: `${roadmap.title} - ${categoryName} Learning Roadmap`,
          },
          {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: 'Menttor Smart Learning Platform',
          },
        ],
        publishedTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        section: categoryName,
        tags: roadmap.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${roadmap.title} | Free ${categoryName} Course`,
        description: `Learn ${categoryName.toLowerCase()} with this comprehensive roadmap. ${roadmap.estimated_hours || 'Expert-designed'} hours of content, practice exercises & more!`,
        images: [`/og-roadmap-${roadmap.category}.png`],
      },
      alternates: {
        canonical: `/explore/${roadmap.slug || roadmap.id}`,
      },
      other: {
        'course:category': categoryName,
        'course:difficulty': difficultyLevel,
        'course:hours': roadmap.estimated_hours?.toString() || '0',
        'course:rating': roadmap.average_rating.toString(),
        'course:students': roadmap.adoption_count.toString(),
      },
    }
  } catch (error) {
    console.error('Error generating metadata for roadmap:', error)
    return {
      title: 'Programming Course | Menttor Smart Learning Platform',
      description: 'Explore free programming courses and tech training roadmaps. Learn coding with smart personalized learning paths.',
    }
  }
}