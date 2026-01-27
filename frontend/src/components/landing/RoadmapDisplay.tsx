// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { RoadmapData } from '../../lib/api';
import { Download, Calendar, CheckCircle, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';

interface RoadmapDisplayProps {
  roadmapData: RoadmapData;
  initialFormData: {
    time_value: number;
    time_unit: string;
  };
}

const RoadmapDisplay: React.FC<RoadmapDisplayProps> = ({ roadmapData, initialFormData }) => {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  const toggleModule = (index: number) => {
    setExpandedModules(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') setStartDate(value);
    else if (name === 'endDate') setEndDate(value);
  };

  const calculateModuleDates = (modules: any[]) => {
    if (!startDate) return modules;

    const start = new Date(startDate);
    let end;
    
    if (endDate) {
      end = new Date(endDate);
    } else {
      end = new Date(start);
      if (initialFormData.time_unit === 'days') {
        end.setDate(end.getDate() + initialFormData.time_value);
      } else if (initialFormData.time_unit === 'weeks') {
        end.setDate(end.getDate() + initialFormData.time_value * 7);
      } else if (initialFormData.time_unit === 'months') {
        end.setMonth(end.getMonth() + initialFormData.time_value);
      }
    }

    const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    const daysPerModule = totalDays / modules.length;

    let currentStartDate = start;
    return modules.map(module => {
      const moduleEndDate = new Date(currentStartDate.getTime() + (daysPerModule * 1000 * 3600 * 24));
      const dates = {
        startDate: currentStartDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        endDate: moduleEndDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };
      currentStartDate = moduleEndDate;
      return { ...module, ...dates };
    });
  };

  const modulesToRender = calculateModuleDates(roadmapData.roadmap_plan?.modules || []);

  const handleDownload = () => {
    let markdownContent = `# ${roadmapData.title}\n\n`;
    markdownContent += `${roadmapData.description}\n\n`;

    roadmapData.roadmap_plan?.modules.forEach((module, moduleIndex) => {
      markdownContent += `## Module ${moduleIndex + 1}: ${module.title} (${module.timeline})\n\n`;
      module.topics.forEach((topic) => {
        markdownContent += `### ${topic.title}\n\n`;
        topic.subtopics.forEach((subtopic) => {
          markdownContent += `- ${subtopic.title}\n`;
        });
        markdownContent += '\n';
      });
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roadmapData.title.replace(/\s+/g, '_').toLowerCase()}_roadmap.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section id="roadmap-output" className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-border shadow-lg p-8 md:p-12 mb-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-primary-dark"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">{roadmapData.title}</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            {roadmapData.description}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Plan
            </button>
            
            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
               <Calendar className="h-5 w-5 text-gray-500" />
               <input
                 type="date"
                 name="startDate"
                 value={startDate || ''}
                 onChange={handleDateChange}
                 className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-0"
                 placeholder="Start Date"
               />
               {startDate && (
                 <button onClick={() => { setStartDate(null); setEndDate(null); }} className="text-gray-400 hover:text-red-500">
                   <X className="h-4 w-4" />
                 </button>
               )}
            </div>
            
            {startDate && (
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-500 font-medium">End:</span>
                <input
                  type="date"
                  name="endDate"
                  value={endDate || ''}
                  onChange={handleDateChange}
                  className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-0"
                />
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {modulesToRender.map((module, index) => {
             const isExpanded = expandedModules.includes(index);
             return (
              <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-slate-200 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-300">
                  <span className="font-bold text-sm">{index + 1}</span>
                </div>
                
                {/* Content Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-primary tracking-wider uppercase">
                      {module.startDate ? `${module.startDate} - ${module.endDate}` : module.timeline}
                    </span>
                    <button 
                      onClick={() => toggleModule(index)}
                      className="text-slate-400 hover:text-primary transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{module.title}</h3>
                  
                  <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                    {module.topics.map((topic: any, tIndex: number) => (
                      <div key={tIndex} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <h4 className="font-semibold text-slate-800 mb-2 flex items-start">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0"></span>
                          {topic.title}
                        </h4>
                        <ul className="pl-4 space-y-1">
                          {topic.subtopics.map((subtopic: any, stIndex: number) => (
                            <li key={stIndex} className="text-sm text-slate-600 flex items-start">
                              <span className="text-slate-400 mr-2">•</span>
                              {subtopic.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  
                  {!isExpanded && (
                    <button 
                      onClick={() => toggleModule(index)}
                      className="md:hidden w-full mt-4 text-center text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                    >
                      Show Details
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RoadmapDisplay;
