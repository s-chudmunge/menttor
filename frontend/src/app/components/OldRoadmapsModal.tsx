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
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Your Learning Roadmaps</h2>
                                <p className="text-indigo-100">Manage and access your previous roadmaps</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isLoading && (
                            <motion.div 
                                className="flex flex-col items-center justify-center min-h-[200px]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading your roadmaps...</p>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div 
                                className="text-center py-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <p className="text-red-600 dark:text-red-400">Error loading roadmaps: {error.message}</p>
                            </motion.div>
                        )}

                        {roadmaps && roadmaps.length > 0 ? (
                            <div className="space-y-4">
                                {/* Selection Controls */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {selectedRoadmaps.size} of {roadmaps.length} selected
                                        </span>
                                        <button
                                            onClick={selectAll}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
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
                                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Delete Selected</span>
                                        </button>
                                    )}
                                </div>

                                {/* Roadmaps Grid */}
                                <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
                                    {roadmaps.map((roadmap, index) => (
                                        <motion.div
                                            key={roadmap.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`relative p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 transition-all hover:shadow-lg ${
                                                selectedRoadmaps.has(roadmap.id) 
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                                            }`}
                                        >
                                            {/* Selection Checkbox */}
                                            <button
                                                onClick={() => toggleSelection(roadmap.id)}
                                                className="absolute top-4 left-4 p-1"
                                            >
                                                {selectedRoadmaps.has(roadmap.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-400 hover:text-indigo-600" />
                                                )}
                                            </button>

                                            <div className="flex items-start justify-between pl-10">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {roadmap.title || roadmap.subject}
                                                        </h3>
                                                    </div>
                                                    
                                                    {roadmap.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                                            {roadmap.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                                        {roadmap.time_value && roadmap.time_unit && (
                                                            <div className="flex items-center space-x-1">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{roadmap.time_value} {roadmap.time_unit}</span>
                                                            </div>
                                                        )}
                                                        {roadmap.model && (
                                                            <div className="flex items-center space-x-1">
                                                                <Target className="w-3 h-3" />
                                                                <span>{roadmap.model}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center space-x-1">
                                                            <BookOpen className="w-3 h-3" />
                                                            <span>ID: {roadmap.id}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        onLoadRoadmap(roadmap);
                                                        onClose();
                                                    }}
                                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                                                >
                                                    <Zap className="w-4 h-4" />
                                                    <span>Load</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            !isLoading && !error && (
                                <motion.div 
                                    className="text-center py-12"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No roadmaps yet</h3>
                                    <p className="text-gray-600 dark:text-gray-400">Create your first roadmap to see it here!</p>
                                </motion.div>
                            )
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
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
                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 m-4 max-w-md w-full"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                            >
                                <div className="flex items-center space-x-3 mb-4">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Confirm Deletion
                                    </h3>
                                </div>
                                
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Are you sure you want to delete {selectedRoadmaps.size} roadmap{selectedRoadmaps.size > 1 ? 's' : ''}? This action cannot be undone.
                                </p>
                                
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}