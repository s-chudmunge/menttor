// @ts-nocheck
'use client';

import React from 'react';
import { Target, Brain, Clock, Shield, Zap, Layers } from 'lucide-react';

const features = [
  {
    name: 'Personalized Roadmaps',
    description: 'Forget generic courses. Our AI analyzes your specific goals and background to build a curriculum that fits you perfectly.',
    icon: Target,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    name: 'Adaptive Intelligence',
    description: 'The learning path isn\'t static. As you progress, Menttor suggests the next best steps based on your pace.',
    icon: Brain,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    name: 'Time-Optimized',
    description: 'Set your schedule, and we\'ll calculate exactly what you need to cover each week to hit your deadline.',
    icon: Clock,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    name: 'Deep Subject Coverage',
    description: 'From niche programming languages to broad business strategies, our models cover a vast array of topics.',
    icon: Layers,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    name: 'Instant Access',
    description: 'No waiting for human mentors. Get a high-quality, structured learning plan in under 30 seconds.',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    name: 'Private & Secure',
    description: 'Your learning data is yours. We prioritize privacy and security in all our interactions.',
    icon: Shield,
    color: 'bg-red-100 text-red-600',
  },
];

const Features = () => {
  return (
    <div id="features" className="bg-surface py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">Why Menttor?</h2>
          <h3 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Everything you need to learn faster
          </h3>
          <p className="mt-4 text-lg text-gray-600">
            Traditional learning is linear and often outdated. Menttor is dynamic, personalized, and designed for the modern learner.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl mb-6 ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.name}</h4>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;