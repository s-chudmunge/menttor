import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live'
  const currentDate = new Date()
  
  // Core static pages with SEO-optimized priorities
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: currentDate,
      changeFrequency: 'hourly', 
      priority: 0.9,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sitemap`,
      lastModified: currentDate, 
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // High-demand programming topics for SEO
  const popularRoadmaps: MetadataRoute.Sitemap = [
    'python-programming',
    'web-development', 
    'javascript-fundamentals',
    'react-development',
    'data-science',
    'machine-learning',
    'nodejs-backend',
    'full-stack-development',
    'programming-fundamentals',
    'cybersecurity',
    'cloud-computing',
    'mobile-development',
    'devops',
    'blockchain',
    'game-development',
    'competitive-programming',
  ].map((slug) => ({
    url: `${baseUrl}/explore/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Category pages for different programming fields
  const categoryPages: MetadataRoute.Sitemap = [
    'web-development',
    'data-science', 
    'mobile-development',
    'cloud-computing',
    'cybersecurity',
    'devops',
    'machine-learning',
    'blockchain',
    'game-development',
    'programming-languages',
    'database',
    'system-design',
    'competitive-programming',
  ].map((category) => ({
    url: `${baseUrl}/explore?category=${category}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Skill level pages for better targeting
  const difficultyPages: MetadataRoute.Sitemap = [
    'beginner',
    'intermediate', 
    'advanced',
  ].map((difficulty) => ({
    url: `${baseUrl}/explore?difficulty=${difficulty}`, 
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  // Try to fetch real roadmaps for dynamic sitemap
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://menttor-backend.onrender.com'
    console.log('Fetching roadmaps from:', backendUrl)
    
    const response = await fetch(`${backendUrl}/curated-roadmaps/?per_page=500`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NextJS-Sitemap-Generator'
      }
    })
    
    console.log('Sitemap fetch response status:', response.status)
    
    if (response.ok) {
      const roadmaps = await response.json()
      console.log(`Found ${roadmaps.length} roadmaps for sitemap`)
      
      const dynamicRoadmapRoutes: MetadataRoute.Sitemap = roadmaps.map((roadmap: any) => ({
        url: `${baseUrl}/explore/${roadmap.slug || roadmap.id}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: roadmap.is_featured ? 0.8 : 0.6,
      }))

      console.log('Generated', dynamicRoadmapRoutes.length, 'dynamic roadmap routes')

      return [
        ...staticPages,
        ...popularRoadmaps,
        ...categoryPages,
        ...difficultyPages,
        ...dynamicRoadmapRoutes,
      ]
    } else {
      console.error('Failed to fetch roadmaps, status:', response.status, await response.text())
    }
  } catch (error) {
    console.error('Error fetching dynamic roadmaps for sitemap:', error)
  }

  return [
    ...staticPages,
    ...popularRoadmaps,
    ...categoryPages,
    ...difficultyPages,
  ]
}