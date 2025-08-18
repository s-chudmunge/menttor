// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { LearningContentResponse, getSavedLearningContent } from '@/lib/api';
import { 
  BookOpen, 
  Calendar, 
  ExternalLink, 
  Share2, 
  BookmarkCheck,
  X,
  Search,
  Filter
} from 'lucide-react';

interface OldLearnPagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadLearningContent: (content: LearningContentResponse) => void;
}

export default function OldLearnPagesModal({ isOpen, onClose, onLoadLearningContent }: OldLearnPagesModalProps) {
    const { user } = useAuth();
    const [savedContent, setSavedContent] = useState<LearningContentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'saved' | 'shared'>('saved');

    // Fetch saved content when modal opens
    useEffect(() => {
        if (isOpen && user) {
            setIsLoading(true);
            setError(null);
            getSavedLearningContent()
                .then(response => {
                    setSavedContent(response.data);
                })
                .catch(err => {
                    setError(err.response?.data?.detail || 'Failed to load saved learning content');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isOpen, user]);

    // Filter content based on search term and filter type
    const filteredContent = savedContent.filter(content => {
        // Text search
        const matchesSearch = searchTerm === '' || 
            content.subtopic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content.goal?.toLowerCase().includes(searchTerm.toLowerCase());

        // Filter type (only saved content is fetched, so filter by sharing status)
        const matchesFilter = 
            (filterType === 'saved' && content.is_saved) ||
            (filterType === 'shared' && content.is_public);

        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <BookmarkCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Saved Learning Pages</h2>
                            <p className="text-sm text-gray-500">Content you've explicitly saved</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by topic, subject, or goal..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter */}
                        <div className="relative">
                            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as 'saved' | 'shared')}
                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="saved">Saved Pages</option>
                                <option value="shared">Shared Pages</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-600">Loading saved content...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <X className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-red-600 text-center">{error}</p>
                        </div>
                    )}

                    {!isLoading && !error && filteredContent.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                {searchTerm || filterType !== 'saved' ? 'No matching content found' : 'No saved pages yet'}
                            </h3>
                            <p className="text-gray-500 text-center max-w-md">
                                {searchTerm || filterType !== 'saved'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Save some learning content to see it here'
                                }
                            </p>
                        </div>
                    )}

                    {!isLoading && !error && filteredContent.length > 0 && (
                        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                            {filteredContent.map((content) => (
                                <div key={content.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                    {content.subtopic || 'Untitled'}
                                                </h3>
                                                <div className="flex items-center space-x-1">
                                                    {content.is_saved && (
                                                        <BookmarkCheck className="w-4 h-4 text-blue-500" title="Saved" />
                                                    )}
                                                    {content.is_public && (
                                                        <Share2 className="w-4 h-4 text-green-500" title="Shared publicly" />
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {content.subject && (
                                                <p className="text-sm text-gray-600 mb-1">
                                                    <span className="font-medium">Subject:</span> {content.subject}
                                                </p>
                                            )}
                                            
                                            {content.goal && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    <span className="font-medium">Goal:</span> {content.goal}
                                                </p>
                                            )}
                                            
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Saved {formatDate(content.updated_at)}</span>
                                                </div>
                                                {content.content && (
                                                    <span>{content.content.length} sections</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => {
                                                onLoadLearningContent(content);
                                                onClose();
                                            }}
                                            className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            <span>Open</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
