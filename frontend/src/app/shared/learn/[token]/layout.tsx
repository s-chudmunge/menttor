import type { Metadata } from 'next';
import { BACKEND_URL } from '../../../../config/config';

interface SharedContent {
  subtopic: string;
  topic: string;
  title: string;
  created_at: string;
  updated_at: string;
}

async function getSharedContentData(token: string): Promise<SharedContent | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/shared/learn/${token}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch shared content for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const content = await getSharedContentData(params.token);
  
  if (!content) {
    return {
      title: 'Shared Learning Content | Menttor',
      description: 'Access shared learning content on Menttor.',
    };
  }

  const title = `${content.subtopic || content.topic || content.title} - Shared Learning | Menttor`;
  const description = `Learn about ${content.subtopic || content.topic || content.title}. Shared learning content from Menttor's interactive learning platform.`;
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live';
  const url = `${baseUrl}/shared/learn/${params.token}`;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      url,
      siteName: 'Menttor',
      images: [
        {
          url: '/og-shared-content.png',
          width: 1200,
          height: 630,
          alt: `${content.subtopic || content.title} - Shared Learning Content`,
        },
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Menttor - Smart Learning Platform',
        },
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      images: ['/og-shared-content.png'],
    },
  };
}

export default function SharedLearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}