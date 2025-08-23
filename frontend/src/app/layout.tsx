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
import SmartNudgeSystem from "../components/behavioral/SmartNudgeSystem";
import RewardSystemManager from "../components/behavioral/RewardSystemManager";
import { ThemeProvider } from "./components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import Script from 'next/script';
import PageTracker from "../components/PageTracker";
import SessionTracker from "../components/SessionTracker";

export const metadata: Metadata = {
  title: {
    default: 'Menttor - AI-Powered Learning Platform',
    template: '%s | Menttor'
  },
  description: 'Master new skills with AI-powered, personalized learning roadmaps. Interactive courses, expert-curated content, and adaptive learning paths for web development, data science, AI, and more.',
  keywords: [
    'online learning platform',
    'AI-powered education',
    'personalized learning',
    'skill development',
    'web development courses',
    'data science training',
    'programming tutorials',
    'career advancement',
    'interactive learning',
    'adaptive learning paths'
  ],
  authors: [{ name: 'Menttor Labs' }],
  creator: 'Menttor Labs',
  publisher: 'Menttor Labs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://menttor.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://menttor.vercel.app',
    siteName: 'Menttor',
    title: 'Menttor - AI-Powered Learning Platform',
    description: 'Master new skills with AI-powered, personalized learning roadmaps. Interactive courses and expert-curated content.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Menttor - AI-Powered Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Menttor - AI-Powered Learning Platform',
    description: 'Master new skills with AI-powered, personalized learning roadmaps.',
    images: ['/og-image.png'],
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
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1YCW8BNWQX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1YCW8BNWQX');
          `}
        </Script>
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
                <SmartNudgeSystem />
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