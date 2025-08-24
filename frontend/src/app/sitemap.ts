import { MetadataRoute } from 'next';
import { BACKEND_URL } from '../config/config';

interface CuratedRoadmap {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  is_featured: boolean;
  slug?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.vercel.app';

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  try {
    // Fetch roadmaps for dynamic routes - always use production backend for sitemap
    const backendUrl = 'https://menttor-backend.onrender.com';
    const response = await fetch(`${backendUrl}/curated-roadmaps/?per_page=50`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`Failed to fetch roadmaps for sitemap: ${response.status} ${response.statusText}`);
      return staticRoutes;
    }

    const roadmaps: CuratedRoadmap[] = await response.json();

    // Dynamic roadmap routes - use slug for SEO-friendly URLs
    const roadmapRoutes = roadmaps.map((roadmap) => ({
      url: `${baseUrl}/explore/${roadmap.slug || roadmap.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: roadmap.is_featured ? 0.8 : 0.7,
    }));

    // Category-based routes
    const categories = [...new Set(roadmaps.map(r => r.category))];
    const categoryRoutes = categories.map((category) => ({
      url: `${baseUrl}/explore?category=${encodeURIComponent(category)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Difficulty-based routes
    const difficulties = ['beginner', 'intermediate', 'advanced'];
    const difficultyRoutes = difficulties.map((difficulty) => ({
      url: `${baseUrl}/explore?difficulty=${difficulty}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [
      ...staticRoutes,
      ...roadmapRoutes,
      ...categoryRoutes,
      ...difficultyRoutes,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error instanceof Error ? error.message : error);
    // Return static routes as fallback
    return staticRoutes;
  }
}