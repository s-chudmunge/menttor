'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Share2, Calendar, BookOpen, ExternalLink, Home } from 'lucide-react';
import Link from 'next/link';
import LearningContentRenderer from '../../../../../components/learning/LearningContentRenderer';
import { getSharedContent, LearningContentResponse } from '../../../../lib/api';

const SharedLearnPage = () => {
  const params = useParams();
  const token = params.token as string;
  
  const [content, setContent] = useState<LearningContentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      setError(null);
      
      getSharedContent(token)
        .then(response => {
          setContent(response.data);
        })
        .catch(err => {
          setError(err.response?.data?.detail || 'Failed to load shared content');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [token]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Content Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No content found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-blue-600 font-medium">Shared Learning Content</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {content.subtopic || 'Learning Content'}
              </h1>
              {content.subject && (
                <p className="text-sm text-gray-600 mt-1">
                  Subject: {content.subject}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Shared {formatDate(content.updated_at)}</span>
                </div>
              </div>
              
              <Link 
                href="/"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Visit Menttor</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {content.goal && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-1">Learning Goal</h3>
            <p className="text-blue-800">{content.goal}</p>
          </div>
        )}
        
        <div className="prose prose-lg max-w-none">
          <LearningContentRenderer 
            content={content.content} 
            subject={content.subject}
            subtopic={content.subtopic}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600 font-medium">Powered by Menttor</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Create your own personalized learning content
            </p>
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Start Learning for Free</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedLearnPage;