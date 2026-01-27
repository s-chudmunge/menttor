// @ts-nocheck
'use client';

import React from 'react';
import { ArrowRight, MessageSquare, Cpu, Rocket } from 'lucide-react';

const steps = [
  {
    title: 'Define Your Goal',
    description: 'Tell us exactly what you want to master. Be specific—like "React Native for iOS" or "Financial Accounting Basics".',
    icon: MessageSquare,
  },
  {
    title: 'AI Analysis',
    description: 'Our advanced AI models break down the subject into key concepts, structuring them logically for optimal retention.',
    icon: Cpu,
  },
  {
    title: 'Launch Your Path',
    description: 'Receive a tailored roadmap with modules, timelines, and topics. Start learning immediately with a clear direction.',
    icon: Rocket,
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-32 relative overflow-hidden">
       {/* Background line for connection effect (desktop only) */}
       <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            From Idea to Roadmap in Seconds
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Complex subjects broken down into simple, manageable steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-100 shadow-lg flex items-center justify-center mb-6 group-hover:border-primary group-hover:scale-110 transition-all duration-300 z-10">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              
              <div className="absolute top-10 left-1/2 w-full h-0.5 bg-gray-200 -z-10 hidden md:block" 
                   style={{ display: index === steps.length - 1 ? 'none' : '' }}></div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed max-w-sm">
                {step.description}
              </p>
              
              <div className="mt-6 md:hidden">
                {index < steps.length - 1 && <ArrowRight className="w-6 h-6 text-gray-300 mx-auto rotate-90" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;