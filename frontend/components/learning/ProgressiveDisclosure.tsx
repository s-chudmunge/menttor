'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  data: { key_idea: string; summary: string; full_text: string; visual_url?: string };
}

const ProgressiveDisclosure: React.FC<Props> = ({ data }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const markdownComponents = {
    div: ({ className, children, ...props }: any) => {
      if (className === 'math math-display') {
        return <div className="math-display my-4 text-center" {...props}>{children}</div>;
      }
      return <div className={className} {...props}>{children}</div>;
    },
    span: ({ className, children, ...props }: any) => {
      if (className === 'math math-inline') {
        return <span className="math-inline" {...props}>{children}</span>;
      }
      return <span className={className} {...props}>{children}</span>;
    },
  };

  return (
    <div className="my-6 bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Key Idea Header - Always Visible */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
            <BookOpen className="w-6 h-6 text-indigo-600"/>
          </div>
          {data.key_idea}
        </h3>
      </div>

      {/* Summary Toggle Button */}
      <div className="px-6">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200/50 transition-all duration-200 group"
        >
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-blue-600 mr-3" />
            <span className="font-medium text-blue-800">Quick Summary</span>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${showSummary ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Summary Section - Collapsible */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSummary ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pt-4 pb-2">
          <div className="p-4 bg-blue-50/50 rounded-xl prose max-w-none text-gray-700">
            {data.visual_url && (
              <img 
                src={data.visual_url} 
                alt="Visual aid for summary" 
                className="max-w-md h-auto rounded-lg shadow-md my-4 mx-auto" 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  console.error('Failed to load image:', data.visual_url); 
                }} 
              />
            )}
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {data.summary}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Full Explanation Toggle Button */}
      <div className="px-6 pb-6">
        <button
          onClick={() => setShowFullText(!showFullText)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl border border-purple-200/50 transition-all duration-200 group mt-4"
        >
          <div className="flex items-center">
            <EyeOff className="w-5 h-5 text-purple-600 mr-3" />
            <span className="font-medium text-purple-800">Detailed Explanation</span>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-purple-600 transition-transform duration-200 ${showFullText ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Full Text Section - Collapsible */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFullText ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="mt-4">
            <div className="p-4 bg-purple-50/50 rounded-xl prose max-w-none text-gray-600">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {data.full_text}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressiveDisclosure;
