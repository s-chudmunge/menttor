import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live'
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://menttor-backend.onrender.com'
  
  // Updated fallback roadmaps based on actual API data
  const knownRoadmaps = [
    'deep-learning-research-and-large-language-models',
    'advanced-mathematical-physics-and-theoretical-research',
    'python-mastery-for-data-science-and-ai-development',
    'generative-ai-and-large-language-models',
    'climate-science-and-earth-system-modeling',
    'python-data-science-and-machine-learning',
    'entrepreneurship-and-startup-strategy',
    'computational-biology-and-bioinformatics-research',
    'system-design-for-large-scale-applications',
    'financial-analysis-and-investment-strategy',
    'typescript-full-stack-development',
    'complete-react-development-with-typescript',
    'quantum-computing-research-and-algorithm-development',
    'c-modern-systems-programming-and-performance',
    'digital-marketing-strategy-and-analytics',
    'advanced-neuroscience-research-and-computational-modeling',
    'mlops-and-model-deployment-at-scale',
    'jee-physics-mastery-mechanics-and-electromagnetism',
    'strategic-management-and-business-planning',
    'gate-computer-science-algorithms-and-data-structures'
  ]
  
  let roadmaps = []
  
  try {
    // Try to fetch from backend with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch(`${backendUrl}/curated-roadmaps/?per_page=100`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NextJS-Sitemap-Generator'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      roadmaps = await response.json()
      console.log(`✅ Fetched ${roadmaps.length} roadmaps from API`)
    } else {
      console.warn(`⚠️ API returned ${response.status}, using fallback`)
      throw new Error(`API returned ${response.status}`)
    }
  } catch (error) {
    console.error('❌ API fetch failed, using static fallback:', error instanceof Error ? error.message : String(error))
    // Use static fallback
    roadmaps = knownRoadmaps.map(slug => ({ slug, is_featured: true }))
  }
  
  // Generate XML sitemap
  const currentDate = new Date().toISOString()
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/explore</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`

  // Add each roadmap
  roadmaps.forEach((roadmap: any) => {
    const slug = roadmap.slug || roadmap.id
    const priority = roadmap.is_featured ? '0.8' : '0.6'
    xml += `
  <url>
    <loc>${baseUrl}/explore/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
  })
  
  // Add category pages
  const categories = [
    'web-development', 'data-science', 'artificial-intelligence', 'cloud-computing', 
    'mobile-development', 'cybersecurity', 'devops', 'blockchain', 'game-development'
  ]
  categories.forEach(category => {
    xml += `
  <url>
    <loc>${baseUrl}/explore?category=${category}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
  })
  
  // Add difficulty pages
  const difficulties = ['beginner', 'intermediate', 'advanced']
  difficulties.forEach(difficulty => {
    xml += `
  <url>
    <loc>${baseUrl}/explore?difficulty=${difficulty}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`
  })
  
  xml += '\n</urlset>'
  
  console.log(`📄 Generated sitemap with ${roadmaps.length} roadmaps + ${categories.length} categories + ${difficulties.length} difficulties`)
  
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600' // 30min cache, 1hr edge cache
    }
  })
}