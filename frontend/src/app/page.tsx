// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { RoadmapData, api } from '../lib/api';

import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import { Loader } from 'lucide-react';

const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const MenttorLabsMainPage = () => {
  const [formData, setFormData] = useState({
    subject: '',
    goal: '',
    prior_experience: '',
    time_value: 4,
    time_unit: 'weeks',
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

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.goal || !formData.time_value) {
      alert('Please fill in all fields');
      return;
    }

    setIsGenerating(true);
    setRoadmapData(null);

    try {
      const response = await api.post('/roadmaps/generate', {
        ...formData,
        model: 'models/gemini-2.5-flash',
      });
      setRoadmapData(response.data);
      document.getElementById('roadmap-output')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      setRoadmapData({ error: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!roadmapData) return;

    let markdownContent = `# ${roadmapData.title}\n\n`;
    markdownContent += `${roadmapData.description}\n\n`;

    roadmapData.roadmap_plan?.modules.forEach((module, moduleIndex) => {
      markdownContent += `## Module ${moduleIndex + 1}: ${module.title} (${module.timeline})\n\n`;
      module.topics.forEach((topic) => {
        markdownContent += `### ${topic.title}\n\n`;
        topic.subtopics.forEach((subtopic) => {
          markdownContent += `- ${subtopic.title}\n`;
        });
        markdownContent += '\n';
      });
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roadmap.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      }, 3000); // Change message every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isGenerating, loadingMessages.length]);

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
                  <p className="text-sm text-gray-500 mb-4">
                    To generate the best possible roadmap, please provide as much detail as you can for each field.
                    The more specific your input, the more tailored and effective your learning plan will be.
                  </p>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    What specific subject or skill do you want to learn?
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Be precise. E.g., "Advanced TypeScript" instead of "Programming", or "Deep Learning with PyTorch" instead of "AI".
                  </p>
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
                    What is your specific, measurable goal for learning this?
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Define what success looks like. E.g., "Build a full-stack e-commerce application" or "Pass the AWS Certified Developer exam".
                  </p>
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
                <div className="md:col-span-2">
                  <label htmlFor="prior_experience" className="block text-sm font-medium text-gray-700 mb-1">
                    Do you have any prior experience in this subject or related fields? (Optional, but helpful)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Mention relevant skills, projects, or concepts you already know. This helps tailor the roadmap to your level.
                  </p>
                  <textarea
                    id="prior_experience"
                    name="prior_experience"
                    value={formData.prior_experience}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="e.g., 'I know basic Python and understand object-oriented programming concepts', or 'I've built simple web pages with HTML/CSS'."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label htmlFor="time_value" className="block text-sm font-medium text-gray-700 mb-1">
                    How much dedicated time can you realistically commit?
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Be realistic about your availability. This affects the scope and pace of your roadmap.
                  </p>
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
            <p className="mt-2 text-gray-600">{loadingMessages[currentMessageIndex]}</p>
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
              <div className="space-y-12">
                <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{roadmapData.title}</h2>
                  <p className="mt-4 text-lg leading-8 text-gray-600">{roadmapData.description}</p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Download Roadmap
                  </button>
                </div>
                <div>
                  {roadmapData.roadmap_plan?.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="relative pl-8 sm:pl-32 py-6 group">
                      <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-slate-200 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-indigo-600 after:border-4 after:box-content after:border-slate-50 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
                        <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">{module.timeline}</time>
                        <div className="text-xl font-bold text-slate-900">{`Module ${moduleIndex + 1}: ${module.title}`}</div>
                      </div>
                      <div className="ml-8 sm:ml-32 space-y-4">
                        {module.topics.map((topic) => (
                          <div key={topic.id} className="p-4 border rounded-lg bg-slate-50">
                            <h4 className="font-semibold text-slate-800">{topic.title}</h4>
                            <ul className="list-disc pl-5 mt-2">
                              {topic.subtopics.map((subtopic) => (
                                <li key={subtopic.id} className="text-slate-600">{subtopic.title}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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