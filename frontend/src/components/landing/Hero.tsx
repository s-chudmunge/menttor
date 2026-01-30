// @ts-nocheck
'use client';

import React from 'react';
import { ArrowRight, Zap, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 pt-20 pb-16 md:pt-32 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center rounded-full px-4 py-1.5 mb-8 text-sm font-medium bg-primary/10 text-primary border border-primary/20">
          <span>AI-Powered Learning Paths</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
          Stop Wondering. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
            Start Mastering.
          </span>
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Menttor builds personalized, step-by-step learning roadmaps tailored to your goals. Whether it's coding, business, or science — get a clear path to success in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => {
              const element = document.getElementById('generate');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Create Your Roadmap
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          
          <button
            onClick={() => {
               const element = document.getElementById('features');
               element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"
          >
            How it works
          </button>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-gray-500 text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span>Instant Generation</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span>Expert Curated</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
               ))}
            </div>
            <span>10k+ Roadmaps Created</span>
          </div>
          <div className="flex items-center justify-center gap-2">
             <span className="text-green-600 font-bold">Free</span>
             <span>Forever</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;