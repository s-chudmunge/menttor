// @ts-nocheck
'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      'Menttor has been a game-changer for me. The personalized roadmap helped me stay focused and motivated. I achieved my learning goals in half the time I expected.',
    name: 'Arjun Mehta',
    role: 'Full Stack Developer',
    avatar: 'AM'
  },
  {
    quote:
      'I used to feel overwhelmed by all the things I needed to learn. Menttor gave me a clear path to follow, and now I feel more confident than ever.',
    name: 'Sarah Chen',
    role: 'Product Designer',
    avatar: 'SC'
  },
  {
    quote:
      'The ability to set a timeframe and get a realistic schedule is incredible. It turned my vague interest in AI into a structured daily habit.',
    name: 'Michael Ross',
    role: 'Data Analyst',
    avatar: 'MR'
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="bg-background py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">Community</h2>
          <h3 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Trusted by learners worldwide
          </h3>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands of students and professionals who have accelerated their learning journey with our AI-powered paths.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full relative">
              <div className="absolute top-6 right-8 text-primary/10">
                <Quote size={40} fill="currentColor" />
              </div>
              
              <p className="text-gray-600 italic mb-8 flex-grow leading-relaxed">
                “{testimonial.quote}”
              </p>
              
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 mr-3">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-xs text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;