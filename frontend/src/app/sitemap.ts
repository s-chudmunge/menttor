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

    let roadmaps: CuratedRoadmap[] = [];

    if (response.ok) {
      roadmaps = await response.json();
    } else {
      console.warn(`Failed to fetch roadmaps for sitemap: ${response.status} ${response.statusText}`);
      // Fallback to static roadmap list for SEO while backend is down
      roadmaps = [
        { id: 30, title: 'TypeScript Advanced Programming', category: 'programming-languages', difficulty: 'intermediate', is_featured: false, slug: 'typescript-advanced-programming' },
        { id: 26, title: 'Swift iOS App Development', category: 'mobile-development', difficulty: 'beginner', is_featured: true, slug: 'swift-ios-app-development' },
        { id: 14, title: 'FastAPI Modern Python Web Framework', category: 'web-development', difficulty: 'beginner', is_featured: false, slug: 'fastapi-modern-python-web-framework' },
        { id: 11, title: 'Django REST API Development', category: 'web-development', difficulty: 'intermediate', is_featured: false, slug: 'django-rest-api-development' },
        { id: 17, title: 'Figma to Code Design Implementation', category: 'design', difficulty: 'intermediate', is_featured: false, slug: 'figma-to-code-design-implementation' },
        { id: 3, title: 'AWS Cloud Solutions Architect', category: 'cloud-computing', difficulty: 'intermediate', is_featured: true, slug: 'aws-cloud-solutions-architect' },
        { id: 31, title: 'MERN Stack Full Development', category: 'web-development', difficulty: 'intermediate', is_featured: true, slug: 'mern-stack-full-development' },
        { id: 36, title: 'Generative AI and Large Language Models', category: 'artificial-intelligence', difficulty: 'intermediate', is_featured: true, slug: 'generative-ai-and-large-language-models' },
        { id: 28, title: 'Kotlin Android Development', category: 'mobile-development', difficulty: 'beginner', is_featured: true, slug: 'kotlin-android-development' },
        { id: 13, title: 'System Design for Senior Engineers', category: 'system-design', difficulty: 'advanced', is_featured: true, slug: 'system-design-for-senior-engineers' },
      ];
    }

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