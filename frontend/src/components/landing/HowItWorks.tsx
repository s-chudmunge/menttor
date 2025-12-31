// @ts-nocheck
'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    name: '1. Tell us your goal',
    description: 'Let us know what you want to learn and how much time you have.',
  },
  {
    name: '2. Generate your roadmap',
    description: 'Our AI will create a personalized, step-by-step roadmap for you.',
  },
  {
    name: '3. Start learning',
    description: 'Follow your roadmap, track your progress, and achieve your goals.',
  },
];

const HowItWorks = () => {
  return (
    <div id="how-it-works" className="bg-white py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Get your personalized learning plan in just a few clicks.
          </p>
        </div>
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-y-10 md:grid-cols-3 md:gap-x-10">
            {steps.map((step, index) => (
              <div key={step.name} className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-black text-white text-lg font-bold">
                  {index + 1}
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">{step.name}</h3>
                  <p className="mt-2 text-base text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
