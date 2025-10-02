"use client";

import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config/config';

interface VideoData {
  success: boolean;
  url?: string;
  prompt?: string;
  model?: string;
  concept?: string;
  duration?: number;
  quality?: string;
  type?: string;
  mime_type?: string;
  error?: string;
}

export default function LearningAnimationDemoPage() {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = async (theme: string = "dark") => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/video/generate-promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concept: "Menttor Smart Learning Platform",
          duration_seconds: 12,
          quality: "high",
          theme: theme
        }),
      });

      const data: VideoData = await response.json();
      
      if (data.success && data.url) {
        setVideoData(data);
      } else {
        setError(data.error || 'Video generation failed');
      }
    } catch (err) {
      setError('Failed to connect to video generation service');
      console.error('Video generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 flex items-center justify-center p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Menttor Promotional Video
          </h1>
          <p className="text-xl text-slate-600 dark:text-gray-300 mb-8">
            AI-generated promotional content featuring our tech-savvy cat mascot and brand
          </p>
          {!videoData && (
            <div className="text-sm text-slate-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/50 rounded-xl p-6 inline-block border border-slate-200 dark:border-gray-700">
              <strong className="text-slate-700 dark:text-gray-300">AI Video Generation:</strong><br/>
              <div className="mt-3 space-y-1 text-left">
                <div>🎬 <strong>Vertex AI Veo 3:</strong> Professional quality video generation</div>
                <div>🐱 <strong>Tech Cat Mascot:</strong> Featuring our AR goggle-wearing cat</div>
                <div>🎨 <strong>Brand Integration:</strong> Menttor logo and "Smart Learning" tagline</div>
                <div>⚡ <strong>12-second promo:</strong> Perfect for landing pages and social media</div>
                <div>🌟 <strong>Cinematic quality:</strong> Professional lighting and smooth camera work</div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-300 dark:border-gray-600">
                <em>AI-powered promotional content • Brand-focused • High-quality output</em>
              </div>
            </div>
          )}
          
          {/* Generate Video Buttons */}
          {!videoData && (
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => generateVideo("dark")}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating with Veo 3...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>🌙</span>
                    <span>Generate Dark Theme</span>
                  </div>
                )}
              </button>
              
              <button 
                onClick={() => generateVideo("light")}
                disabled={loading}
                className="bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating with Veo 3...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>☀️</span>
                    <span>Generate Light Theme</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                <span>⚠️</span>
                <strong>Error:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex justify-center mb-12">
          {videoData?.url ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-gray-700">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Generated Promotional Content
                </h3>
                <p className="text-slate-600 dark:text-gray-300">
                  AI-generated content featuring our tech cat mascot and Menttor branding
                </p>
              </div>
              
              <div className="relative max-w-2xl mx-auto">
                {videoData.mime_type?.startsWith('video/') ? (
                  <video 
                    src={videoData.url}
                    controls
                    autoPlay
                    loop
                    className="w-full h-auto rounded-xl shadow-lg"
                    style={{ aspectRatio: '16/9' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img 
                    src={videoData.url}
                    alt="Generated promotional content featuring Menttor's tech cat mascot"
                    className="w-full h-auto rounded-xl shadow-lg"
                    style={{ aspectRatio: '16/9' }}
                  />
                )}
              </div>
              
              {/* Video Details */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="font-semibold text-slate-700 dark:text-gray-300">Model</div>
                  <div className="text-slate-600 dark:text-gray-400">{videoData.model}</div>
                </div>
                <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="font-semibold text-slate-700 dark:text-gray-300">Duration</div>
                  <div className="text-slate-600 dark:text-gray-400">{videoData.duration}s</div>
                </div>
                <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="font-semibold text-slate-700 dark:text-gray-300">Quality</div>
                  <div className="text-slate-600 dark:text-gray-400">{videoData.quality}</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <button 
                  onClick={() => setVideoData(null)}
                  className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300"
                >
                  Generate New Image
                </button>
                <button 
                  onClick={() => window.open(videoData.url, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300"
                >
                  {videoData.mime_type?.startsWith('video/') ? 'Download Video' : 'Download Image'}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Features */}
        <div className="bg-white/70 dark:bg-gray-800/30 rounded-2xl p-8 text-center border border-slate-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">AI-Powered Video Generation</h3>
          <div className="grid md:grid-cols-4 gap-6 text-slate-600 dark:text-gray-300">
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-slate-200 dark:border-gray-600">
              <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-2">Vertex AI Veo 3</div>
              <div className="text-sm">State-of-the-art video generation with cinematic quality</div>
            </div>
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-slate-200 dark:border-gray-600">
              <div className="text-indigo-600 dark:text-indigo-400 font-bold text-lg mb-2">Brand Integration</div>
              <div className="text-sm">Seamless logo and mascot integration with professional styling</div>
            </div>
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-slate-200 dark:border-gray-600">
              <div className="text-green-600 dark:text-green-400 font-bold text-lg mb-2">Promo Ready</div>
              <div className="text-sm">Perfect for landing pages, social media, and marketing campaigns</div>
            </div>
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-slate-200 dark:border-gray-600">
              <div className="text-green-600 dark:text-green-400 font-bold text-lg mb-2">High Quality</div>
              <div className="text-sm">Professional 1080p HD output optimized for web delivery</div>
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="mt-8 bg-slate-100 dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Video Usage Scenarios</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-slate-700 dark:text-gray-300">Landing Page Hero:</div>
              <div className="text-slate-600 dark:text-gray-400">Eye-catching promotional content for homepage header</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-slate-700 dark:text-gray-300">Social Media:</div>
              <div className="text-slate-600 dark:text-gray-400">Branded content for Instagram, Twitter, LinkedIn campaigns</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-slate-700 dark:text-gray-300">About Page:</div>
              <div className="text-slate-600 dark:text-gray-400">Explain Menttor's mission with engaging visuals</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-slate-700 dark:text-gray-300">Product Demos:</div>
              <div className="text-slate-600 dark:text-gray-400">Showcase smart learning features and capabilities</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <button 
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={() => window.location.href = '/'}
          >
            🏠 Back to Main Page
          </button>
        </div>
      </div>
    </div>
  );
}
