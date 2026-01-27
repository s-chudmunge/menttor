// @ts-nocheck
'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const CTA = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 py-16 px-8 md:px-16 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                Ready to master <br className="hidden sm:block" /> 
                <span className="text-primary">your next skill?</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
                Join thousands of learners who are already using Menttor to achieve their goals faster and more efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => {
                    const element = document.getElementById('generate');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-gray-900 bg-white rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <div className="flex items-center justify-center text-gray-400 text-sm">
                  <Sparkles className="w-4 h-4 mr-2 text-primary" />
                  No credit card required
                </div>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0 flex-shrink-0">
               <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-white/5 flex items-center justify-center relative">
                  <div className="w-48 h-48 md:w-60 md:h-60 rounded-full border-4 border-white/10 flex items-center justify-center">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-inner">
                        <Sparkles className="w-16 h-16 md:w-20 md:h-20 text-white animate-pulse" />
                    </div>
                  </div>
                  {/* Floating icons/elements could go here */}
                  <div className="absolute top-0 right-0 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 animate-bounce delay-100">
                    <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-10 left-0 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 animate-bounce delay-300">
                    <div className="w-4 h-4 bg-primary rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTA;