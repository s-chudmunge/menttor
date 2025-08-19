import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import SmartImage from './SmartImage';
import AIGeneratedDiagram from './AIGeneratedDiagram';
import ProgrammaticDiagram from './ProgrammaticDiagram';
import ConceptIllustration from './ConceptIllustration';

interface Props {
  data: { text: string; visual_url?: string; position: 'left' | 'right' };
  subject?: string;
  subtopic?: string;
  allowAIGeneration?: boolean;
}

const DualCodingLayout: React.FC<Props> = ({ data, subject, subtopic, allowAIGeneration = true }) => {
  const flexDirection = data.position === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row';
  
  // Extract main concept from text without subject-specific rules
  const extractMainConcept = (text: string) => {
    const words = text.toLowerCase().split(/\s+/);
    
    // Filter out common words
    const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'will', 'this', 'that', 'with'];
    const meaningfulWords = words.filter(word => word.length > 3 && !stopWords.includes(word));
    
    // Return the first 1-2 meaningful words
    if (meaningfulWords.length > 0) {
      return meaningfulWords.slice(0, 2).join(' ');
    }
    
    return 'concept';
  };

  const concept = extractMainConcept(data.text);
  const hasValidImage = data.visual_url && data.visual_url.trim() !== '';

  const renderVisualization = () => {
    // If there's a valid image URL, use it first
    if (hasValidImage) {
      return (
        <SmartImage
          src={data.visual_url!}
          alt="Visual explanation"
          className="max-w-full h-auto mx-auto"
          fallbackText="Visual aid not available"
          showUrl={true}
        />
      );
    }

    // Only generate AI images if allowed (to limit to one per page)
    if (!allowAIGeneration) {
      return (
        <div className="flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg p-8 w-full h-48">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📚</div>
            <p className="text-sm">Visual content</p>
            <p className="text-xs text-gray-400">Limited to preserve resources</p>
          </div>
        </div>
      );
    }

    // Generate AI diagram when allowed
    return (
      <AIGeneratedDiagram
        concept={concept}
        subject={subject || 'Learning'}
        content={data.text}
        width={400}
        height={300}
        className="w-full"
      />
    );
  };

  return (
    <div className={`flex flex-col ${flexDirection} gap-6 my-8 border-l-4 border-blue-500 pl-6 bg-gray-50 py-6 pr-6`}>
      <div className="flex-1 prose max-w-none text-gray-800">
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
        >
          {data.text}
        </ReactMarkdown>
      </div>
      <div className="flex-1 w-full lg:w-auto">
        {renderVisualization()}
      </div>
    </div>
  );
};

export default DualCodingLayout;
