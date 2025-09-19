'use client';

import React, { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  data: { key_idea: string; summary: string; full_text: string; visual_url?: string };
}

const ProgressiveDisclosure: React.FC<Props> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="my-4 bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
      {/* Header with Key Idea - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center">
          <Lightbulb className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
          <span className="font-semibold text-blue-900">{data.key_idea}</span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-blue-200 bg-white p-4">
          {/* Summary */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
            <div className="prose max-w-none text-gray-700 text-sm">
              {data.visual_url && (
                <img 
                  src={data.visual_url} 
                  alt="Visual aid" 
                  className="max-w-full h-auto rounded-lg my-3" 
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
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

          {/* Full Explanation */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Detailed Explanation</h4>
            <div className="prose max-w-none text-gray-600 text-sm">
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
      )}
    </div>
  );
};

export default ProgressiveDisclosure;
