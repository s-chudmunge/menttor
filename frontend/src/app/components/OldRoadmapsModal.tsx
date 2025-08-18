'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { RoadmapData } from '@/lib/api';
import { useRoadmap } from '@/hooks/useRoadmap';

interface OldRoadmapsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadRoadmap: (roadmap: RoadmapData) => void;
}

export default function OldRoadmapsModal({ isOpen, onClose, onLoadRoadmap }: OldRoadmapsModalProps) {
    const { user } = useAuth();
    const { data: roadmaps, isLoading, error } = useRoadmap(user?.uid);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-11/12 max-w-2xl relative">
                <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold" onClick={onClose}>&times;</button>
                <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Your Past Roadmaps</h2>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center min-h-[100px]">
                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Loading roadmaps...</p>
                    </div>
                )}

                {error && (
                    <p className="text-red-500 text-center">Error: {error.message}</p>
                )}

                {roadmaps && roadmaps.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {roadmaps.map((roadmap) => (
                            <div key={roadmap.id} className="p-4 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{roadmap.title}</h3>
                                    {roadmap.description && <p className="text-sm text-gray-600">{roadmap.description}</p>}
                                </div>
                                <button
                                    onClick={() => {
                                        onLoadRoadmap(roadmap);
                                        onClose();
                                    }}
                                    className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                                >
                                    Load
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isLoading && !error && <p className="text-gray-600 text-center">No past roadmaps found.</p>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}