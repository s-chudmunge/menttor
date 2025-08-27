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

export const metadata: Metadata = {
  title: {
    default: 'Menttor - Smart Learning Platform',
    template: '%s | Menttor'
  },
  description: 'Master new skills with smart personalized learning roadmaps. Free interactive courses, expert-curated content, and adaptive paths for programming, data science, web development, and more. Start learning today!',
  keywords: [
    'free online learning',
    'programming courses',
    'web development training', 
    'data science courses',
    'machine learning tutorials',
    'smart learning platform',
    'personalized roadmaps',
    'interactive coding',
    'skill development',
    'career advancement',
    'tech education',
    'software engineering',
    'python programming',
    'javascript courses',
    'react tutorials',
    'node.js training'
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
    siteName: 'Menttor',
    title: 'Menttor - Free Smart Learning Platform | Programming & Tech Courses',
    description: 'Learn programming, web development, and data science with smart personalized roadmaps. Free interactive courses with quizzes, coding challenges, and career guidance.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Menttor - Smart Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Menttor - Free Programming & Tech Learning Platform',
    description: 'Smart personalized learning roadmaps for web development, data science & more. Start your tech career today!',
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
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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
                "url": "https://menttor.live/favicon.svg"
              },
              "description": "Smart learning platform offering free personalized roadmaps for programming, web development, and data science",
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
                    "name": "Web Development",
                    "description": "Learn HTML, CSS, JavaScript, React, and more"
                  },
                  {
                    "@type": "Course",
                    "name": "Data Science", 
                    "description": "Master Python, machine learning, and analytics"
                  },
                  {
                    "@type": "Course",
                    "name": "Programming Fundamentals",
                    "description": "Start your coding journey with core concepts"
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
        className={`antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
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