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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.vercel.app';

  // Static routes
  const staticUrls = [
    { url: baseUrl, priority: '1.0', changefreq: 'weekly' },
    { url: `${baseUrl}/explore`, priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/auth/signin`, priority: '0.5', changefreq: 'monthly' },
    { url: `${baseUrl}/help`, priority: '0.6', changefreq: 'monthly' },
    { url: `${baseUrl}/dashboard`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/journey`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/learn`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/quiz`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/visualize`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/performance-analysis`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/results`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/quiz/results`, priority: '0.6', changefreq: 'weekly' },
    { url: `${baseUrl}/profile`, priority: '0.5', changefreq: 'monthly' },
    { url: `${baseUrl}/auth/reset-password`, priority: '0.4', changefreq: 'yearly' },
    { url: `${baseUrl}/contact`, priority: '0.5', changefreq: 'yearly' },
    { url: `${baseUrl}/status`, priority: '0.5', changefreq: 'yearly' },
    { url: `${baseUrl}/privacy`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/terms`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/security`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/about`, priority: '0.4', changefreq: 'yearly' },
    { url: `${baseUrl}/careers`, priority: '0.4', changefreq: 'yearly' },
    { url: `${baseUrl}/blog`, priority: '0.6', changefreq: 'weekly' },
    { url: `${baseUrl}/press`, priority: '0.4', changefreq: 'yearly' },
    { url: `${baseUrl}/partnerships`, priority: '0.4', changefreq: 'yearly' },
  ];

  let allUrls = [...staticUrls];

  try {
    // Fetch roadmaps from backend
    const response = await fetch('https://menttor-backend.onrender.com/curated-roadmaps/?per_page=50', {
      headers: {
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const roadmaps: CuratedRoadmap[] = await response.json();

      // Add roadmap URLs
      const roadmapUrls = roadmaps.map((roadmap) => ({
        url: `${baseUrl}/explore/${roadmap.slug || roadmap.id}`,
        priority: roadmap.is_featured ? '0.8' : '0.7',
        changefreq: 'weekly'
      }));

      // Add category URLs
      const categories = [...new Set(roadmaps.map(r => r.category))];
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
    }
  } catch (error) {
    console.error('Error fetching roadmaps for sitemap:', error);
  }

  const currentDate = new Date().toISOString();

  // Generate XML manually to ensure clean output
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const urlData of allUrls) {
    xml += '  <url>\n';
    xml += `    <loc>${urlData.url}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${urlData.changefreq}</changefreq>\n`;
    xml += `    <priority>${urlData.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive, nocache',
      'Last-Modified': new Date().toUTCString(),
      'ETag': `"${Date.now()}"`,
      'Vary': 'User-Agent',
    },
  });
}