// @ts-nocheck
'use client';

import React from 'react';
import { Target, Brain, Clock } from 'lucide-react';

const features = [
  {
    name: 'Personalized Roadmaps',
    description: 'Our AI generates a step-by-step roadmap tailored to your specific learning goals and timeframe.',
    icon: Target,
  },
  {
    name: 'Adaptive Learning',
    description: 'Menttor adapts to your progress, suggesting what to learn next and providing personalized quizzes.',
    icon: Brain,
  },
  {
    name: 'Efficient Learning',
    description: 'Save time and effort with a clear path to mastery. No more guessing what to learn next.',
    icon: Clock,
  },
];

const Features = () => {
  return (
    <div id="features" className="bg-gray-50 py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            A better way to learn
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Menttor provides you with the tools you need to succeed.
          </p>
        </div>
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-y-10 md:grid-cols-3 md:gap-x-10">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-black text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
