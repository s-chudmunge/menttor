// @ts-nocheck
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const CTA = () => {
  const router = useRouter();

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-black rounded-lg shadow-xl overflow-hidden lg:grid lg:grid-cols-2 lg:gap-4">
          <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
            <div className="lg:self-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">Ready to dive in?</span>
                <span className="block">Start learning today.</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-gray-300">
                Create your personalized learning roadmap and start your journey to mastery.
              </p>
              <button
                onClick={() => router.push('#generate')}
                className="mt-8 bg-white border border-transparent rounded-md shadow px-5 py-3 inline-flex items-center text-base font-medium text-black hover:bg-gray-200"
              >
                Create Your Roadmap
              </button>
            </div>
          </div>
          <div className="-mt-6 aspect-w-5 aspect-h-3 md:aspect-w-2 md:aspect-h-1">
            {/* You can add an image or illustration here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTA;
