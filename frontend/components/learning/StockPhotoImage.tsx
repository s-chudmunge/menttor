'use client';

import React, { useState, useEffect } from 'react';
import SmartImage from './SmartImage';

interface StockPhotoImageProps {
  query: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
  };
}

const StockPhotoImage: React.FC<StockPhotoImageProps> = ({ 
  query, 
  alt, 
  className = '', 
  width = 400, 
  height = 300 
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [attribution, setAttribution] = useState<{ name: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStockPhoto();
  }, [query]);

  const fetchStockPhoto = async () => {
    setLoading(true);
    setError('');

    try {
      // Try multiple free photo sources
      const sources = [
        () => fetchUnsplashPhoto(query),
        () => fetchPixabayPhoto(query)
      ];

      for (const source of sources) {
        try {
          const result = await source() as any;
          if (result.url) {
            setImageUrl(result.url);
            setAttribution(result.attribution);
            setLoading(false);
            return;
          }
        } catch (sourceError) {
          console.warn('Source failed:', sourceError);
          continue;
        }
      }

      // If all sources fail, use a generated placeholder
      const placeholder = generateTopicPlaceholder(query, width, height);
      setImageUrl(placeholder);
      setAttribution(null);
    } catch (err) {
      setError('Failed to load image');
      console.error('Stock photo error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnsplashPhoto = async (searchQuery: string) => {
    // For a truly dynamic system, we'll skip hardcoded mappings
    // and go straight to fallback since we don't have API keys
    throw new Error('Unsplash API requires authentication');
  };

  const fetchPixabayPhoto = async (searchQuery: string) => {
    // Skip API calls since we don't have keys - go to fallback
    throw new Error('Pixabay API requires authentication');
  };

  const generateTopicPlaceholder = (topic: string, w: number, h: number): string => {
    // Create a data URL with SVG placeholder
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="20" y="20" width="${w-40}" height="${h-40}" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2" rx="8"/>
        <text x="50%" y="40%" text-anchor="middle" dy="0.3em" font-family="system-ui" font-size="18" fill="#6b7280">
          📚 ${topic}
        </text>
        <text x="50%" y="60%" text-anchor="middle" dy="0.3em" font-family="system-ui" font-size="14" fill="#9ca3af">
          Educational Content
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg`} style={{ width, height }}>
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-sm text-gray-500">Loading image...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50 border border-red-200 rounded-lg`} style={{ width, height }}>
        <div className="text-center text-red-600">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <SmartImage
        src={imageUrl}
        alt={alt}
        className={className}
        fallbackText={`${query} illustration`}
      />
      {attribution && (
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          📷 {attribution.name}
        </div>
      )}
    </div>
  );
};

export default StockPhotoImage;