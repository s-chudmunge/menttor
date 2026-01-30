// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { api, RoadmapData } from '../../lib/api';
import { Loader, Calendar, BookOpen, Clock, Target } from 'lucide-react';

interface RoadmapGeneratorProps {
  onRoadmapGenerated: (data: RoadmapData, formData: any) => void;
}

const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const RoadmapGenerator: React.FC<RoadmapGeneratorProps> = ({ onRoadmapGenerated }) => {
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    prior_experience: '',
    time_value: 4,
    time_unit: 'weeks',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const loadingMessages = [
    "Building your roadmap, please be patient...",
    "Our AI is crafting your personalized learning journey...",
    "Almost there! Just optimizing your learning path...",
    "Generating insightful content just for you...",
    "Hang tight, great things are coming!",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, loadingMessages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'time_value' ? parseInt(value) : value,
    }));
  };

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.goal || !formData.time_value) {
      alert('Please fill in all fields');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.post('/roadmaps/generate', {
        ...formData,
        model: 'models/gemini-2.5-flash',
      });
      onRoadmapGenerated(response.data, formData);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the roadmap.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="generate" className="py-20 sm:py-32 bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <span className="text-primary font-medium text-sm">AI-Powered Learning</span>
          </div>
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl tracking-tight">
            Create Your Personalized Roadmap
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            Tell us what you want to learn, and our AI will build a step-by-step curriculum tailored just for you.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-primary via-purple-500 to-primary-dark"></div>
          <div className="p-8 sm:p-12">
            <form onSubmit={generateRoadmap} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Subject Input */}
                <div className="md:col-span-2 space-y-3">
                  <label htmlFor="subject" className="flex items-center text-sm font-semibold text-text-primary">
                    <BookOpen className="w-4 h-4 mr-2 text-primary" />
                    Subject or Skill
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="e.g., Advanced TypeScript, Quantum Computing, Digital Marketing"
                      className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm text-text-primary placeholder:text-text-secondary/50"
                      required
                    />
                  </div>
                  <p className="text-xs text-text-secondary">Be specific for better results (e.g., "Deep Learning with PyTorch" instead of "AI")</p>
                </div>

                {/* Goal Input */}
                <div className="md:col-span-2 space-y-3">
                  <label htmlFor="goal" className="flex items-center text-sm font-semibold text-text-primary">
                    <Target className="w-4 h-4 mr-2 text-primary" />
                    Learning Goal
                  </label>
                  <textarea
                    id="goal"
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="e.g., Build a full-stack e-commerce app, Pass the AWS Certified Developer exam"
                    className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm text-text-primary placeholder:text-text-secondary/50 resize-none"
                    required
                  />
                </div>

                {/* Experience Input */}
                <div className="md:col-span-2 space-y-3">
                  <label htmlFor="prior_experience" className="block text-sm font-semibold text-text-primary">
                    Prior Experience (Optional)
                  </label>
                  <textarea
                    id="prior_experience"
                    name="prior_experience"
                    value={formData.prior_experience}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="e.g., Basic knowledge of JavaScript and HTML/CSS"
                    className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm text-text-primary placeholder:text-text-secondary/50 resize-none"
                  />
                </div>

                {/* Time Commitment */}
                <div className="md:col-span-2 space-y-3">
                  <label htmlFor="time_value" className="flex items-center text-sm font-semibold text-text-primary">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    Time Commitment
                  </label>
                  <div className="flex space-x-4">
                    <input
                      type="number"
                      id="time_value"
                      name="time_value"
                      value={formData.time_value}
                      onChange={handleInputChange}
                      min="1"
                      className="w-1/3 px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm text-text-primary"
                      required
                    />
                    <div className="relative w-2/3">
                      <select
                        name="time_unit"
                        value={formData.time_unit}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm text-text-primary appearance-none cursor-pointer"
                      >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-secondary">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center px-8 py-4 rounded-xl font-bold text-lg text-white bg-primary hover:bg-primary-dark shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isGenerating ? (
                    <>
                      <Spinner />
                      <span className="ml-3">Generating Your Roadmap...</span>
                    </>
                  ) : (
                    <>
                      Generate Roadmap
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {isGenerating && (
          <div className="text-center mt-12 animate-fade-in">
            <div className="inline-block p-4 rounded-full bg-white shadow-md mb-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-lg font-medium text-text-primary">{loadingMessages[currentMessageIndex]}</p>
            <p className="text-sm text-text-secondary mt-1">This usually takes about 30 seconds</p>
          </div>
        )}

        {error && (
          <div className="mt-8 bg-red-50 border-l-4 border-error p-4 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">Error generating roadmap</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RoadmapGenerator;
