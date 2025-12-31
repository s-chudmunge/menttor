// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { RoadmapData, api } from '../lib/api';

import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import { Loader } from 'lucide-react';

interface GenerateRoadmapRequest {
  subject: string;
  goal: string;
  time_value: number;
  time_unit: string;
  model: string;
}

const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const MenttorLabsMainPage = () => {
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    time_value: 4,
    time_unit: 'weeks',
    model: 'gemini-2.5-flash',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);

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
      // sessionStorage.setItem('currentRoadmap', JSON.stringify(data)); // Removed as journey page is removed
      setIsGenerating(false);
      document.getElementById('roadmap-output')?.scrollIntoView({ behavior: 'smooth' });
    },
    onError: (error) => {
      setRoadmapData({ error: error.message });
      setIsGenerating(false);
    },
  });

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.goal || !formData.time_value) {
      alert('Please fill in all fields');
      return;
    }

    setIsGenerating(true);
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
    <div className="bg-white min-h-screen font-sans">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />

        {/* Roadmap Generation Form */}
        <section id="generate" className="bg-gray-50 py-20 sm:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Create Your Roadmap
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Fill in the details below to generate your personalized learning plan.
              </p>
            </div>
            <div className="mt-16 bg-white p-8 rounded-xl border border-gray-200 shadow-md">
              <form onSubmit={generateRoadmap} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    What do you want to learn?
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g., Quantum Computing, React Native, or Product Management"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
                    What is your goal?
                  </label>
                  <textarea
                    id="goal"
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="e.g., 'Build a mobile app', 'Prepare for a job interview', 'Understand the basics'"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="time_value" className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    <select
                      name="time_unit"
                      value={formData.time_unit}
                      onChange={handleInputChange}
                      className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                    AI Engine
                  </label>
                  <select
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="openrouter:google/gemma-2b-it:free">Gemma 2B (Free)</option>
                  </select>
                </div>
                <div className="md:col-span-2 text-center mt-4">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 rounded-lg font-semibold text-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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

        {isGenerating && (
          <div className="text-center my-16">
            <Loader className="h-8 w-8 animate-spin mx-auto text-black" />
            <p className="mt-2 text-gray-600">Building your roadmap...</p>
          </div>
        )}

        {roadmapData && (
          <section id="roadmap-output" className="my-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {roadmapData.error ? (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{roadmapData.error}</p>
              </div>
            ) : (
              <div className="prose max-w-none">
                <h2>{roadmapData.title}</h2>
                <p>{roadmapData.description}</p>
                {roadmapData.roadmap_plan?.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="mt-8">
                    <h3>{`Module ${moduleIndex + 1}: ${module.title}`}</h3>
                    <p className="text-sm text-gray-500 -mt-3">{`Timeline: ${module.timeline}`}</p>
                    {module.topics.map((topic) => (
                      <div key={topic.id} className="mt-4 pl-4 border-l-2 border-gray-200">
                        <h4>{topic.title}</h4>
                        <ul className="list-none p-0">
                          {topic.subtopics.map((subtopic) => (
                            <li key={subtopic.id} className="mt-1 text-gray-600">{subtopic.title}</li>
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

        <Testimonials />
        <CTA />
      </main>
    </div>
  );
};

export default MenttorLabsMainPage;