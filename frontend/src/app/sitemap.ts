import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.vercel.app'
  
  // Core static pages - guaranteed to work
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily', 
      priority: 0.9,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sitemap`,
      lastModified: new Date(), 
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly', 
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/security`, 
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Popular roadmap examples (static list)
  const popularRoadmaps: MetadataRoute.Sitemap = [
    'web-development',
    'data-science', 
    'machine-learning',
    'javascript',
    'python',
    'react',
    'nodejs',
    'programming-fundamentals',
  ].map((slug) => ({
    url: `${baseUrl}/explore/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Category and difficulty pages
  const categoryPages: MetadataRoute.Sitemap = [
    'programming',
    'web-development', 
    'data-science',
    'mobile-development',
  ].map((category) => ({
    url: `${baseUrl}/explore?category=${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const difficultyPages: MetadataRoute.Sitemap = [
    'beginner',
    'intermediate',
    'advanced',
  ].map((difficulty) => ({
    url: `${baseUrl}/explore?difficulty=${difficulty}`, 
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...popularRoadmaps,
    ...categoryPages,
    ...difficultyPages,
  ]
}