import React from 'react';
import { BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  data: { key_idea: string; summary: string; full_text: string; visual_url?: string };
}

const ProgressiveDisclosure: React.FC<Props> = ({ data }) => {
  return (
    <div className="my-6 bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg overflow-hidden">
        {/* Key Idea Header */}
        <div className="p-6 border-b border-gray-200/50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-indigo-600"/>
                </div>
                {data.key_idea}
            </h3>
        </div>

        {/* Summary Section */}
        <div className="p-6 prose max-w-none text-gray-700">
            {data.visual_url && <img src={data.visual_url} alt="Visual aid for summary" className="max-w-md h-auto rounded-lg shadow-md my-4 mx-auto" onError={(e) => { e.currentTarget.style.display = 'none'; console.error('Failed to load image:', data.visual_url); }} />}
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                div: ({ className, children, ...props }) => {
                  if (className === 'math math-display') {
                    return <div className="math-display my-4 text-center" {...props}>{children}</div>;
                  }
                  return <div className={className} {...props}>{children}</div>;
                },
                span: ({ className, children, ...props }) => {
                  if (className === 'math math-inline') {
                    return <span className="math-inline" {...props}>{children}</span>;
                  }
                  return <span className={className} {...props}>{children}</span>;
                },
              }}
            >{data.summary}</ReactMarkdown>
        </div>

        {/* Curved Arrow Indicator */}
        <div className="flex justify-center py-3">
          <svg 
            className="w-8 h-8 text-gray-400" 
            viewBox="0 0 32 32" 
            fill="none"
            aria-hidden="true"
          >
            <path 
              d="M8 8 Q16 20 24 12 L20 16 M24 12 L20 8" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Full Explanation Section */}
        <div className="px-6 pb-6">
          <div className="p-4 bg-gray-50/50 rounded-xl prose max-w-none text-gray-600">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                div: ({ className, children, ...props }) => {
                  if (className === 'math math-display') {
                    return <div className="math-display my-4 text-center" {...props}>{children}</div>;
                  }
                  return <div className={className} {...props}>{children}</div>;
                },
                span: ({ className, children, ...props }) => {
                  if (className === 'math math-inline') {
                    return <span className="math-inline" {...props}>{children}</span>;
                  }
                  return <span className={className} {...props}>{children}</span>;
                },
              }}
            >{data.full_text}</ReactMarkdown>
          </div>
        </div>
      </div>
  );
};

export default ProgressiveDisclosure;
