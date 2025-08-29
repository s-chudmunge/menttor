'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useAIState } from '@/store/aiState';
import { ArrowLeft, RefreshCw, Download, AlertTriangle, Maximize, Minimize } from 'lucide-react';
import { api } from '../../lib/api';
import Logo from '@rootComponents/Logo';

function VisualizationPageContent() {
    const searchParams = useSearchParams();
    const description = searchParams.get('d') || searchParams.get('description');
    const model = searchParams.get('m') || searchParams.get('model') || 'gemini-2.5-flash-lite';
    
    const [htmlContent, setHtmlContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    
    const { user } = useAuth();
    const { isGenerating, startGeneration, endGeneration, currentModel } = useAIState();

    useEffect(() => {
        if (description) {
            const fetch3DVisualization = async () => {
                setIsLoading(true);
                setError(null);
                setLoadingProgress(0);
                
                const modelToUse = `vertexai:${model}`;
                startGeneration(modelToUse);
                
                // Simulate progress updates
                const progressInterval = setInterval(() => {
                    setLoadingProgress(prev => Math.min(prev + Math.random() * 15, 90));
                }, 1000);
                
                try {
                    // Use the configured API client which includes authentication
                    const response = await api.get('/visualize', {
                        params: {
                            description: description,
                            model: model
                        }
                    });

                    setHtmlContent(response.data.html_content);
                    setLoadingProgress(100);
                    
                } catch (error: any) {
                    console.error('3D Visualization Error:', error);
                    // Handle different types of errors
                    if (error.response) {
                        // API responded with error status
                        const errorMessage = error.response.data?.detail || 
                                           error.response.data?.message || 
                                           `HTTP ${error.response.status}: Failed to generate visualization`;
                        setError(errorMessage);
                    } else if (error.request) {
                        // Network error
                        setError('Network error: Unable to connect to the visualization service');
                    } else {
                        // Other error
                        setError(error.message || 'An unexpected error occurred');
                    }
                } finally {
                    clearInterval(progressInterval);
                    setIsLoading(false);
                    endGeneration();
                }
            };

            fetch3DVisualization();
        }
    }, [description, model, user, startGeneration, endGeneration]);

    const handleRetry = () => {
        window.location.reload();
    };

    const handleDownload = () => {
        if (htmlContent) {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `3d-visualization-${Date.now()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    if (isGenerating || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-indigo-600">{Math.round(loadingProgress)}%</span>
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        🎨 Creating Your 3D Visualization
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        AI is generating an interactive 3D model using {currentModel || model}
                    </p>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                        <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {description ? `Topic: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}` : 'Loading...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Visualization Failed
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {error}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'min-h-screen bg-gray-100 dark:bg-gray-900'}`}>
            {/* Header Controls */}
            {!isFullscreen && (
                <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-4 flex-1">
                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        </div>
                        
                        {/* Center Logo */}
                        <div className="flex-1 flex justify-center">
                            <Logo />
                        </div>
                        
                        <div className="flex items-center gap-2 flex-1 justify-end">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Download HTML file"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Toggle fullscreen"
                            >
                                <Maximize className="w-4 h-4" />
                                Fullscreen
                            </button>
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Regenerate visualization"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Regenerate
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Fullscreen Controls */}
            {isFullscreen && (
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={toggleFullscreen}
                        className="flex items-center gap-2 px-3 py-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-lg transition-colors"
                    >
                        <Minimize className="w-4 h-4" />
                        Exit Fullscreen
                    </button>
                </div>
            )}
            
            {/* Visualization Container */}
            <div className={`${isFullscreen ? 'h-full' : 'h-[calc(100vh-80px)]'} relative`}>
                <iframe
                    key={htmlContent}
                    srcDoc={htmlContent}
                    className="w-full h-full border-none"
                    title="3D Visualization"
                    sandbox="allow-scripts allow-downloads"
                    onLoad={() => setIsLoading(false)}
                    onError={() => { 
                        setError('Failed to load 3D visualization content. The generated HTML may contain errors.'); 
                        setIsLoading(false); 
                    }}
                />
                
                {/* Loading overlay for iframe */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Loading visualization...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VisualizationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VisualizationPageContent />
        </Suspense>
    );
}
