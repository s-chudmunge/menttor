import { NextResponse } from 'next/server';

interface CuratedRoadmap {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  is_featured: boolean;
  slug?: string;
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live';

  // Static routes
  const staticUrls = [
    { url: baseUrl, priority: '1.0', changefreq: 'weekly' },
    { url: `${baseUrl}/explore`, priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/help`, priority: '0.6', changefreq: 'monthly' },
    { url: `${baseUrl}/sitemap`, priority: '0.4', changefreq: 'monthly' },
    { url: `${baseUrl}/about`, priority: '0.5', changefreq: 'yearly' },
    { url: `${baseUrl}/privacy`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/terms`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/security`, priority: '0.3', changefreq: 'yearly' },
  ];

  let allUrls = [...staticUrls];

  try {
    // Fetch roadmaps from backend with short timeout for faster builds
    const response = await fetch('https://menttor-backend.onrender.com/curated-roadmaps/?per_page=100', {
      headers: {
        'Cache-Control': 'no-cache',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(2000), // 2 second timeout for faster builds
    });

    if (response.ok && response.status === 200) {
      const roadmaps: CuratedRoadmap[] = await response.json();
      
      if (Array.isArray(roadmaps) && roadmaps.length > 0) {
        // Add roadmap URLs
        const roadmapUrls = roadmaps.map((roadmap) => ({
          url: `${baseUrl}/explore/${roadmap.slug || roadmap.id}`,
          priority: roadmap.is_featured ? '0.8' : '0.7',
          changefreq: 'weekly'
        }));

        // Add category URLs
        const categories = [...new Set(roadmaps.map(r => r.category).filter(Boolean))];
        const categoryUrls = categories.map((category) => ({
          url: `${baseUrl}/explore?category=${encodeURIComponent(category)}`,
          priority: '0.6',
          changefreq: 'weekly'
        }));

        // Add difficulty URLs
        const difficulties = ['beginner', 'intermediate', 'advanced'];
        const difficultyUrls = difficulties.map((difficulty) => ({
          url: `${baseUrl}/explore?difficulty=${difficulty}`,
          priority: '0.6',
          changefreq: 'weekly'
        }));

        allUrls = [...staticUrls, ...roadmapUrls, ...categoryUrls, ...difficultyUrls];
        console.log(`Successfully loaded ${roadmaps.length} roadmaps for sitemap`);
      } else {
        console.warn('No roadmaps returned from API');
      }
    } else {
      console.warn(`Backend responded with status: ${response.status}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Sitemap generation: Backend request timed out');
      } else {
        console.error('Error fetching roadmaps for sitemap:', error.message);
      }
    } else {
      console.error('Unknown error fetching roadmaps for sitemap:', error);
    }
    // Continue with static URLs only
  }

  const currentDate = new Date().toISOString().split('T')[0]; // Use YYYY-MM-DD format

  // Generate XML manually with proper escaping
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
  xml += '        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
  xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';
  
  for (const urlData of allUrls) {
    xml += '  <url>\n';
    xml += `    <loc>${urlData.url.replace(/&/g, '&amp;')}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${urlData.changefreq}</changefreq>\n`;
    xml += `    <priority>${urlData.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  
  // Log sitemap stats
  console.log(`Generated sitemap with ${allUrls.length} URLs`);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600', // Shorter cache for better updates
      'Last-Modified': new Date().toUTCString(),
      'ETag': `"sitemap-${Date.now()}"`,
      'X-Robots-Tag': 'noindex', // Sitemap itself shouldn't be indexed
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  });
}