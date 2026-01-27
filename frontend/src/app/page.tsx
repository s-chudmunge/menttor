// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { RoadmapData } from '../lib/api';

import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import RoadmapGenerator from '@/components/landing/RoadmapGenerator';
import RoadmapDisplay from '@/components/landing/RoadmapDisplay';

const MenttorLabsMainPage = () => {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [generatedFormData, setGeneratedFormData] = useState<{
    time_value: number;
    time_unit: string;
  } | null>(null);

  const handleRoadmapGenerated = (data: RoadmapData, formData: any) => {
    setRoadmapData(data);
    setGeneratedFormData({
      time_value: formData.time_value,
      time_unit: formData.time_unit,
    });
    // Smooth scroll to results
    setTimeout(() => {
      document.getElementById('roadmap-output')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        
        <RoadmapGenerator onRoadmapGenerated={handleRoadmapGenerated} />
        
        {roadmapData && generatedFormData && (
          <RoadmapDisplay 
            roadmapData={roadmapData} 
            initialFormData={generatedFormData} 
          />
        )}

        <Testimonials />
        <CTA />
      </main>
    </div>
  );
};

export default MenttorLabsMainPage;
