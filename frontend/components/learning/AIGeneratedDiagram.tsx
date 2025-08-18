'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { api } from '../../src/lib/api';

interface AIGeneratedDiagramProps {
  concept: string;
  subject: string;
  content: string;
  width?: number;
  height?: number;
  className?: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
  concept: string;
  subject: string;
}

const AIGeneratedDiagram: React.FC<AIGeneratedDiagramProps> = ({
  concept,
  subject,
  content,
  width = 512,
  height = 512,
  className = ''
}) => {
  const [imageData, setImageData] = useState<GeneratedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string>('');

  // Simple cache key for this concept + content
  const cacheKey = `diagram_${concept}_${subject}_${content}`.substring(0, 100);
  
  // Check if we have cached image data
  const checkCache = () => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        setImageData(cachedData);
        setLoading(false);
        setInitialLoad(false);
        return true;
      }
    } catch (e) {
      // Ignore cache errors
    }
    return false;
  };

  useEffect(() => {
    // Check cache first
    if (checkCache()) {
      return;
    }

    // Show immediate skeleton, then start generation after page loads
    const timer = setTimeout(() => {
      setInitialLoad(false);
      generateDiagram();
    }, 100); // Small delay to let the page render first

    return () => clearTimeout(timer);
  }, [concept, subject, content]);

  const generateDiagram = async () => {
    setLoading(true);
    setError('');

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Image generation timeout')), 45000); // 45 second timeout
    });

    try {
      const apiPromise = api.post('/images/generate-diagram', {
        concept,
        subject,
        content,
        width,
        height
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);

      if (response.data) {
        setImageData(response.data);
        // Cache the successful result
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
        } catch (e) {
          // Ignore cache storage errors
        }
      } else {
        throw new Error('No image data received');
      }
    } catch (err: any) {
      console.error('Error generating diagram:', err);
      
      if (err.message === 'Image generation timeout') {
        setError('Image generation is taking longer than expected. The content is still loading in the background.');
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Network connection issue. Please check your internet connection and try again.');
      } else if (err.response?.status === 503) {
        setError('Image generation service temporarily unavailable. Please try again in a moment.');
      } else if (err.response?.status === 401) {
        setError('Authentication issue. Please refresh the page and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error during image generation. This may be due to API configuration.');
      } else {
        setError(`Failed to generate educational diagram: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const retryGeneration = () => {
    generateDiagram();
  };

  // Immediate skeleton for instant page load
  if (initialLoad) {
    return (
      <div className={`${className} bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse`} style={{ width, height }}>
        <div className="h-4/5 bg-gray-200"></div>
        <div className="p-4 bg-gray-50">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-6`} style={{ width, height }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <h4 className="text-base font-semibold text-gray-700 mb-2">🎨 AI Creating Diagram</h4>
          <p className="text-sm text-gray-600 mb-2">Generating: <strong>{concept}</strong></p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-xs text-blue-700 mb-2">💡 <strong>Keep reading!</strong> The diagram will appear here when ready.</p>
            <p className="text-xs text-gray-500">Usually takes 10-30 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-lg p-8`} style={{ width, height }}>
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h4 className="text-lg font-semibold text-red-800 mb-2">Generation Failed</h4>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={retryGeneration}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            Retry Generation
          </button>
        </div>
      </div>
    );
  }

  if (!imageData) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg p-8`} style={{ width, height }}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm">No diagram available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white border border-gray-200 rounded-lg overflow-hidden`}>
      {/* Image */}
      <div className="relative">
        <img
          src={imageData.url}
          alt={`Educational diagram for ${concept}`}
          className="w-full h-auto"
          style={{ maxWidth: width, maxHeight: height }}
        />
        
        {/* Overlay with diagram info */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          🤖 AI Generated
        </div>
      </div>
      
      {/* Diagram metadata */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h4 className="font-semibold text-gray-800 text-sm mb-1">{imageData.concept}</h4>
        <p className="text-xs text-gray-600 mb-2">Subject: {imageData.subject}</p>
        
        {/* Generated prompt (collapsible for debugging) */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Generated with AI prompt</summary>
          <div className="mt-1 p-2 bg-gray-100 rounded text-xs break-words prose prose-xs max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                div: ({ className, children, ...props }) => {
                  if (className === 'math math-display') {
                    return <div className="math-display my-2 text-center" {...props}>{children}</div>;
                  }
                  return <div className={className} {...props}>{children}</div>;
                },
                span: ({ className, children, ...props }) => {
                  if (className === 'math math-inline') {
                    return <span className="math-inline" {...props}>{children}</span>;
                  }
                  return <span className={className} {...props}>{children}</span>;
                },
                p: ({ children }) => <span>{children}</span>, // Inline paragraphs for compact display
              }}
            >
              {imageData.prompt}
            </ReactMarkdown>
          </div>
          <p className="mt-1 text-xs">Model: {imageData.model}</p>
        </details>
        
        {/* Regenerate button */}
        <button
          onClick={retryGeneration}
          className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          🔄 Generate Different Version
        </button>
      </div>
    </div>
  );
};

export default AIGeneratedDiagram;