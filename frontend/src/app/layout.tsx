import type { Metadata } from "next/types";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { BehavioralProvider } from "./context/BehavioralContext";
import { QueryClientProviderWrapper } from "./context/QueryClientProviderWrapper";
import SpiralMark from "../../components/SpiralMark";
import ModelStatusIndicator from "../../components/ModelStatusIndicator";
import BehavioralNotifications from "../components/behavioral/BehavioralNotifications";
import MilestoneSystem from "../components/behavioral/MilestoneSystem";
import RewardSystemManager from "../components/behavioral/RewardSystemManager";
import { ThemeProvider } from "./components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import Script from 'next/script';
import PageTracker from "../components/PageTracker";
import SessionTracker from "../components/SessionTracker";
import FaviconUpdater from "../components/FaviconUpdater";

export const metadata: Metadata = {
  title: {
    default: 'Menttor - Smart Learning Platform | Free Courses & Personalized Education',
    template: '%s | Menttor - Smart Learning Platform'
  },
  description: 'Master diverse subjects with smart personalized learning roadmaps. 500+ free courses in programming, Python, JavaScript, React, web development, data science, machine learning, cybersecurity, business, science, language learning & more. Expert-curated content, interactive practice, and adaptive learning paths.',
  keywords: [
    'free online courses',
    'personalized learning platform',
    'smart learning roadmap',
    'online education',
    'skill development',
    'career advancement',
    'free programming courses',
    'business training',
    'language learning',
    'science courses',
    'professional development',
    'learn new skills',
    'online training',
    'educational platform',
    'course platform',
    'learning path',
    'skill building',
    'career skills',
    'professional training',
    'web development bootcamp',
    'data science training',
    'machine learning course',
    'programming tutorial',
    'coding bootcamp',
    'python programming course',
    'javascript tutorial',
    'react training',
    'business skills',
    'leadership training',
    'communication skills',
    'project management',
    'digital marketing',
    'finance courses',
    'design courses',
    'creative skills',
    'study guide',
    'exam preparation',
    'certification training',
    'continuing education'
  ],
  authors: [{ name: 'Menttor Labs' }],
  creator: 'Menttor Labs',
  publisher: 'Menttor Labs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://menttor.live'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://menttor.live',
    siteName: 'Menttor - Smart Learning Platform',
    title: 'Free Online Courses & Smart Learning Platform | Master Any Subject',
    description: 'Master diverse subjects with smart personalized learning roadmaps. 500+ free courses in programming, Python, JavaScript, React, web development, data science, machine learning, cybersecurity, business, science, language learning & more. Interactive practice with expert-curated content.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Menttor Smart Learning Platform - Free Programming Courses & Tech Training',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Programming Courses & Smart Learning Platform | Menttor',
    description: 'Learn coding with smart personalized roadmaps. Free courses in Python, JavaScript, React, data science & web development. Start your tech career today!',
    images: ['/og-image.png'],
    creator: '@menttorlabs',
    site: '@menttorlabs',
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
  icons: {
    icon: [{ url: '/favicon_io (2)/favicon-16x16.png', sizes: '16x16', type: 'image/png' }, { url: '/favicon_io (2)/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
    shortcut: '/favicon_io (2)/favicon.ico',
    apple: '/favicon_io (2)/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || 'bwivA76TNvzcdQVasoFFwoZZfGA1PycT2g1CJTAW8Gw',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon_io (2)/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon_io (2)/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon_io (2)/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon_io (2)/apple-touch-icon.png" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap" rel="stylesheet" />
        
        {/* Security Headers */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' blob:; object-src 'none'; frame-src 'self' https:; connect-src 'self' https: wss:;" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=()" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "Menttor Labs",
              "url": "https://menttor.live",
              "logo": {
                "@type": "ImageObject",
                "url": "https://menttor.live/favicon_io (2)/android-chrome-512x512.png",
                "width": 512,
                "height": 512
              },
              "description": "Smart learning platform offering free personalized roadmaps across diverse subjects including programming, business, science, languages, and professional skills",
              "sameAs": [
                "https://github.com/mountain-snatcher"
              ],
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "category": "Educational Services"
              },
              "areaServed": "Worldwide",
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Learning Courses",
                "itemListElement": [
                  {
                    "@type": "Course",
                    "name": "Programming & Web Development",
                    "description": "Learn Python, JavaScript, React, and full-stack development"
                  },
                  {
                    "@type": "Course",
                    "name": "Business & Professional Skills", 
                    "description": "Master leadership, project management, and business strategy"
                  },
                  {
                    "@type": "Course",
                    "name": "Science & Mathematics",
                    "description": "Explore physics, chemistry, mathematics, and scientific methods"
                  },
                  {
                    "@type": "Course",
                    "name": "Language Learning",
                    "description": "Master new languages with structured learning paths"
                  }
                ]
              }
            })
          }}
        />
        
        {/* Google Analytics - placed in head for Search Console verification */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1YCW8BNWQX"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-1YCW8BNWQX', {
                page_title: document.title,
                page_location: window.location.href,
                anonymize_ip: true,
                allow_google_signals: false
              });
            `,
          }}
        />
      </head>
      <body
        className={`antialiased bg-white dark:bg-zinc-950`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <FaviconUpdater />
          <AuthProvider>
            <QueryClientProviderWrapper>
              <BehavioralProvider>
                <ModelStatusIndicator />
                <BehavioralNotifications />
                <MilestoneSystem />
                <RewardSystemManager />
                <PageTracker />
                <SessionTracker />
                {children}
                <Analytics />
              </BehavioralProvider>
            </QueryClientProviderWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}