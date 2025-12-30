// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Logo from '@rootComponents/Logo';
import { 
  BookOpen, 
  Brain, 
  Target, 
  Clock,
  Menu,
  X,
  ArrowRight,
  Loader,
} from 'lucide-react';
import { RoadmapData, RoadmapItem, api } from '../lib/api';
import { useAIState } from '@/store/aiState';

interface GenerateRoadmapRequest {
  subject: string;
  goal: string;
  time_value: number;
  time_unit: string;
  model: string;
}

// A simple spinner component for the loading state
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const MenttorLabsMainPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    time_value: 4,
    time_unit: 'weeks',
    model: 'gemini-2.5-flash',
  });
  const { isGenerating, startGeneration, endGeneration } = useAIState();
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'time_value' ? parseInt(value) : value,
    }));
  };

  const generateRoadmapMutation = useMutation<RoadmapData, Error, GenerateRoadmapRequest>({
    mutationFn: async (requestData) => {
      const response = await api.post('/roadmaps/generate', requestData);
      return response.data;
    },
    onSuccess: (data) => {
      setRoadmapData(data);
      sessionStorage.setItem('currentRoadmap', JSON.stringify(data));
      endGeneration();
      // Scroll to the roadmap section after generation
      document.getElementById('roadmap-output')?.scrollIntoView({ behavior: 'smooth' });
    },
    onError: (error) => {
      setRoadmapData({ error: error.message });
      endGeneration();
    },
  });

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.goal || !formData.time_value) {
      alert('Please fill in all fields');
      return;
    }

    startGeneration(formData.model);
    setRoadmapData(null);
    generateRoadmapMutation.mutate({
      subject: formData.subject,
      goal: formData.goal,
      time_value: formData.time_value,
      time_unit: formData.time_unit,
      model: formData.model,
    });
  };

  return (
    <div className="bg-background min-h-screen font-sans">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Logo />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-text-secondary hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="#generate" className="text-text-secondary hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Create</a>
              </div>
            </div>
            <div className="flex items-center">
              {!loading && (
                user ? (
                  <Link href="/dashboard" className="text-sm font-medium text-text-secondary hover:text-primary">
                    Dashboard
                  </Link>
                ) : (
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    Sign In
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="py-16 sm:py-24">
        <div className="text-center px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-tight">
            Generate Your Learning Roadmap
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">
            Tell us what you want to learn, and our AI will create a personalized, step-by-step roadmap for you.
          </p>
        </div>

        {/* Roadmap Generation Form */}
        <section id="generate" className="mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-surface p-8 rounded-xl border border-border shadow-md">
              <form onSubmit={generateRoadmap} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Subject */}
                <div className="md:col-span-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-1">
                    What do you want to learn?
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g., Quantum Computing, React Native, or Product Management"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {/* Goal */}
                <div className="md:col-span-2">
                  <label htmlFor="goal" className="block text-sm font-medium text-text-primary mb-1">
                    What is your goal?
                  </label>
                  <textarea
                    id="goal"
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="e.g., 'Build a mobile app', 'Prepare for a job interview', 'Understand the basics'"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {/* Timeline */}
                <div>
                  <label htmlFor="time_value" className="block text-sm font-medium text-text-primary mb-1">
                    How much time do you have?
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      id="time_value"
                      name="time_value"
                      value={formData.time_value}
                      onChange={handleInputChange}
                      min="1"
                      className="w-1/2 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <select
                      name="time_unit"
                      value={formData.time_unit}
                      onChange={handleInputChange}
                      className="w-1/2 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>

                {/* AI Model Selection */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-text-primary mb-1">
                    AI Engine
                  </label>
                  <select
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="openrouter:google/gemma-2b-it:free">Gemma 2B (Free)</option>
                  </select>
                </div>
                
                {/* Submit Button */}
                <div className="md:col-span-2 text-center mt-4">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 rounded-lg font-semibold text-lg bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <Spinner />
                        <span className="ml-3">Generating...</span>
                      </>
                    ) : (
                      'Generate Your Roadmap'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Roadmap Output */}
        {isGenerating && (
          <div className="text-center mt-16">
            <Loader className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-text-secondary">Building your roadmap...</p>
          </div>
        )}

        {roadmapData && (
          <section id="roadmap-output" className="mt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {roadmapData.error ? (
              <div className="bg-red-100 border-l-4 border-error text-error p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{roadmapData.error}</p>
              </div>
            ) : (
              <div className="prose prose-menttor max-w-none">
                <h2>{roadmapData.title}</h2>
                <p>{roadmapData.description}</p>
                {roadmapData.roadmap_plan?.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="mt-8">
                    <h3>{`Module ${moduleIndex + 1}: ${module.title}`}</h3>
                    <p className="text-sm text-text-secondary -mt-3">{`Timeline: ${module.timeline}`}</p>
                    {module.topics.map((topic) => (
                      <div key={topic.id} className="mt-4 pl-4 border-l-2 border-border">
                        <h4>{topic.title}</h4>
                        <ul className="list-none p-0">
                          {topic.subtopics.map((subtopic) => (
                            <li key={subtopic.id} className="mt-1 text-text-secondary">{subtopic.title}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default MenttorLabsMainPage;
