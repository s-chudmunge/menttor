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

const MenttorLabsMainPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    time_value: 1,
    time_unit: 'days',
    model: 'openrouter:google/gemma-2b-it:free',
  });
  const { isGenerating, startGeneration, endGeneration } = useAIState();
  const [roadmapHtml, setRoadmapHtml] = useState<React.ReactNode | null>(null);
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
      displayRoadmap(data.roadmap_plan);
      sessionStorage.setItem('currentRoadmap', JSON.stringify(data));
      endGeneration();
    },
    onError: (error) => {
      setRoadmapHtml(<p className="text-red-500">Error: {error.message}</p>);
      endGeneration();
    },
  });

  const generateRoadmap = async () => {
    if (!formData.subject || !formData.goal || !formData.time_value) {
      alert('Please fill in all fields');
      return;
    }

    startGeneration(formData.model);
    setRoadmapHtml(null);
    generateRoadmapMutation.mutate({
      subject: formData.subject,
      goal: formData.goal,
      time_value: formData.time_value,
      time_unit: formData.time_unit,
      model: formData.model,
    });
  };

  const displayRoadmap = (roadmapPlan: RoadmapItem[]) => {
    if (!roadmapPlan || roadmapPlan.length === 0) {
      setRoadmapHtml(<p>No roadmap generated.</p>);
      return;
    }
    const roadmapContent = (
      <div>
        <h3 className="text-2xl font-bold mb-6">Your Learning Roadmap: {formData.subject}</h3>
        <div>
          {roadmapPlan.map((item, index) => (
            <div key={index}>
              <h4>{item.title}</h4>
              <p>Timeline: {item.timeline}</p>
            </div>
          ))}
        </div>
      </div>
    );
    setRoadmapHtml(roadmapContent);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <nav className="bg-white/95 dark:bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Logo />
            <div className="flex items-center space-x-3">
              {!loading && user ? (
                <p>Welcome, {user.email}</p>
              ) : (
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden ml-2 p-2"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section id="generate" className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Create Your Learning Roadmap</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <label>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label>Goal</label>
                <textarea
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label>Timeline</label>
                <input
                  type="number"
                  name="time_value"
                  value={formData.time_value}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  />
                  <select
                    name="time_unit"
                    value={formData.time_unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg mt-2"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                <div>
                  <label>AI Engine</label>
                  <p>{formData.model}</p>
                </div>
              </div>
              <div className="text-center mt-12">
                <button
                  type="submit"
                  onClick={generateRoadmap}
                  disabled={isGenerating}
                  className="px-12 py-4 rounded-xl font-semibold text-lg bg-green-600 text-white"
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner"></span> Generating...
                    </>
                  ) : (
                    'Generate Your Roadmap'
                  )}
                </button>
              </div>

              {roadmapHtml && (
                <div className="mt-16 p-8">
                  {roadmapHtml}
                </div>
              )}
            </div>
          </section>
        </main>
    </div>
  );
};

export default MenttorLabsMainPage;
