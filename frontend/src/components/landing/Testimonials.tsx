// @ts-nocheck
'use client';

import React from 'react';

const testimonials = [
  {
    quote:
      'Menttor has been a game-changer for me. The personalized roadmap helped me stay focused and motivated. I achieved my learning goals in half the time I expected.',
    name: 'John Doe',
    role: 'Software Engineer',
  },

  {
    quote:
      'I used to feel overwhelmed by all the things I needed to learn. Menttor gave me a clear path to follow, and now I feel more confident than ever.',
    name: 'Samuel Lee',
    role: 'UX Designer',
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="bg-gray-50 py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            What our users are saying
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Thousands of learners have already achieved their goals with Menttor.
          </p>
        </div>
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-y-10 md:grid-cols-3 md:gap-x-10">
            {testimonials.map((testimonial) => (
              <blockquote key={testimonial.name} className="flex flex-col items-center text-center">
                <div className="relative">
                  <p className="text-lg text-gray-600">
                    “{testimonial.quote}”
                  </p>
                </div>
                <footer className="mt-8">
                  <div className="flex flex-col items-center">
                    <div className="text-base font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-base text-gray-600">{testimonial.role}</div>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
