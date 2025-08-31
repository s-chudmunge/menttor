'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { RoadmapData, api } from '@/lib/api';
import { useRoadmap } from '@/hooks/useRoadmap';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  Target, 
  Trash2, 
  CheckSquare, 
  Square,
  AlertTriangle,
  BookOpen,
  Zap
} from 'lucide-react';

interface OldRoadmapsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadRoadmap: (roadmap: RoadmapData) => void;
}

export default function OldRoadmapsModal({ isOpen, onClose, onLoadRoadmap }: OldRoadmapsModalProps) {
    const { user } = useAuth();
    const { data: roadmaps, isLoading, error } = useRoadmap(user?.uid);
    const queryClient = useQueryClient();
    
    const [selectedRoadmaps, setSelectedRoadmaps] = useState<Set<number>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const toggleSelection = (roadmapId: number) => {
        const newSelected = new Set(selectedRoadmaps);
        if (newSelected.has(roadmapId)) {
            newSelected.delete(roadmapId);
        } else {
            newSelected.add(roadmapId);
        }
        setSelectedRoadmaps(newSelected);
    };

    const selectAll = () => {
        if (roadmaps) {
            setSelectedRoadmaps(new Set(roadmaps.map(r => r.id)));
        }
    };

    const clearSelection = () => {
        setSelectedRoadmaps(new Set());
    };

    const handleDelete = async () => {
        if (selectedRoadmaps.size === 0) return;
        
        setIsDeleting(true);
        try {
            // Delete each selected roadmap
            for (const roadmapId of selectedRoadmaps) {
                await api.delete(`/roadmaps/${roadmapId}`);
            }
            
            // Refresh the roadmaps list
            queryClient.invalidateQueries({ queryKey: ['userRoadmap'] });
            
            // Clear selection and close confirmation
            setSelectedRoadmaps(new Set());
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Error deleting roadmaps:', error);
        } finally {
            setIsDeleting(false);
        }
    };


    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-3xl max-h-[85vh] overflow-hidden"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Roadmaps</h2>
                            <button 
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {isLoading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-3"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading roadmaps...</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-8">
                                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                <p className="text-red-600 dark:text-red-400 text-sm">Error loading roadmaps: {error.message}</p>
                            </div>
                        )}

                        {roadmaps && roadmaps.length > 0 ? (
                            <div className="space-y-3">
                                {/* Selection Controls */}
                                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded border">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {selectedRoadmaps.size} of {roadmaps.length} selected
                                        </span>
                                        <button
                                            onClick={selectAll}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={clearSelection}
                                            className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    
                                    {selectedRoadmaps.size > 0 && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            <span>Delete</span>
                                        </button>
                                    )}
                                </div>

                                {/* Roadmaps List */}
                                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                                    {roadmaps.map((roadmap, index) => (
                                        <div
                                            key={roadmap.id}
                                            className={`relative p-3 bg-white dark:bg-gray-800 rounded border transition-all ${
                                                selectedRoadmaps.has(roadmap.id) 
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                                            }`}
                                        >
                                            {/* Selection Checkbox */}
                                            <button
                                                onClick={() => toggleSelection(roadmap.id)}
                                                className="absolute top-3 left-3"
                                            >
                                                {selectedRoadmaps.has(roadmap.id) ? (
                                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                                                )}
                                            </button>

                                            <div className="flex items-center justify-between pl-8">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {roadmap.title || roadmap.subject}
                                                    </h3>
                                                    
                                                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {roadmap.time_value && roadmap.time_unit && (
                                                            <span className="flex items-center space-x-1">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{roadmap.time_value} {roadmap.time_unit}</span>
                                                            </span>
                                                        )}
                                                        <span>ID: {roadmap.id}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        onLoadRoadmap(roadmap);
                                                        onClose();
                                                    }}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                                >
                                                    Load
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            !isLoading && !error && (
                                <div className="text-center py-8">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No roadmaps yet</h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Create your first roadmap to see it here!</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-sm transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 m-4 max-w-sm w-full">
                                <div className="flex items-center space-x-2 mb-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Confirm Deletion
                                    </h3>
                                </div>
                                
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                                    Delete {selectedRoadmaps.size} roadmap{selectedRoadmaps.size > 1 ? 's' : ''}? This cannot be undone.
                                </p>
                                
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-xs transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors disabled:opacity-50"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}