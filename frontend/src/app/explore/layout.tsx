import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Learning Roadmaps | Menttor - Expert-Curated Skill Development',
  description: 'Discover expert-curated learning roadmaps for web development, data science, AI, cloud computing and more. Start your personalized learning journey with verified, comprehensive skill development paths.',
  keywords: [
    'learning roadmaps',
    'skill development',
    'web development',
    'data science',
    'artificial intelligence',
    'cloud computing',
    'programming tutorials',
    'career development',
    'online learning',
    'tech skills',
    'coding bootcamp',
    'professional development'
  ],
  authors: [{ name: 'Menttor Labs' }],
  creator: 'Menttor Labs',
  publisher: 'Menttor Labs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.vercel.app'),
  alternates: {
    canonical: '/explore',
  },
  openGraph: {
    title: 'Explore Learning Roadmaps | Menttor - Expert-Curated Skill Development',
    description: 'Discover expert-curated learning roadmaps for web development, data science, AI, cloud computing and more. Start your personalized learning journey today.',
    url: '/explore',
    siteName: 'Menttor',
    images: [
      {
        url: '/og-explore.png',
        width: 1200,
        height: 630,
        alt: 'Menttor Explore Page - Expert-Curated Learning Roadmaps',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Learning Roadmaps | Menttor',
    description: 'Discover expert-curated learning roadmaps for tech skills. Start your personalized learning journey today.',
    images: ['/og-explore.png'],
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || 'kFUej4a7Quzt-eKOn429EZlre02HHBqpe6Ri4OMxi7o',
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}