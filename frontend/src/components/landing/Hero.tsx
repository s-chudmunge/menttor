// @ts-nocheck
'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  return (
    <div className="bg-white text-center py-20 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          Stop Wondering, Start Mastering.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
          Menttor is an AI-powered learning platform that generates personalized roadmaps to help you achieve your learning goals faster.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('#generate')}
            className="inline-flex items-center bg-black text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-gray-800"
          >
            Create Your Roadmap
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
