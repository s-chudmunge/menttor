import { useQuery } from '@tanstack/react-query';
import { BACKEND_URL } from '../config/config';

interface CuratedRoadmap {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  difficulty: string;
  is_featured: boolean;
  is_verified: boolean;
  view_count: number;
  adoption_count: number;
  average_rating: number;
  estimated_hours?: number;
  tags: string[];
  target_audience?: string;
  slug?: string;
}

export const useCuratedRoadmaps = (perPage: number = 1000) => {
  return useQuery<CuratedRoadmap[]>({
    queryKey: ['curated-roadmaps', perPage],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/?per_page=${perPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch roadmaps');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 20, // 20 minutes for roadmap lists
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCuratedRoadmapDetail = (slug: string) => {
  return useQuery<any>({
    queryKey: ['curated-roadmap-detail', slug],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/curated-roadmaps/slug/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch roadmap detail');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes for roadmap details
    gcTime: 1000 * 60 * 60 * 4, // 4 hours
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!slug,
  });
};