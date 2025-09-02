import React from 'react';
import RoadmapPreviewClient from './RoadmapPreviewClient';

// ISR: Generate static params for common roadmaps (build-time safe)
export async function generateStaticParams() {
  // Return empty array to enable ISR without build-time fetching
  // This allows all roadmap pages to be generated on-demand with revalidation
  return [];
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

interface PageProps {
  params: {
    slug: string;
  };
}

export default function RoadmapPreviewPage({ params }: PageProps) {
  return <RoadmapPreviewClient slug={params.slug} />;
}