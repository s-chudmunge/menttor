import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live'
  const backendUrl = process.env.BACKEND_URL || 'https://menttor-backend.onrender.com'
  
  try {
    // Fetch roadmaps from backend
    const response = await fetch(`${backendUrl}/curated-roadmaps/?per_page=500`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NextJS-Sitemap-Generator'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`)
    }
    
    const roadmaps = await response.json()
    
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
      const priority = roadmap.is_featured ? '0.8' : '0.6'
      xml += `
  <url>
    <loc>${baseUrl}/explore/${roadmap.slug || roadmap.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    
    // Add category pages
    const categories = ['web-development', 'data-science', 'artificial-intelligence', 'cloud-computing', 'mobile-development']
    categories.forEach(category => {
      xml += `
  <url>
    <loc>${baseUrl}/explore?category=${category}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
    })
    
    xml += '\n</urlset>'
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
    
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error)
    
    // Return minimal sitemap on error
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/explore</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300'
      }
    })
  }
}