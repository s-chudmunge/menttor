import React from 'react';
import { LearningContent, ContentBlock } from '../../types/learning';
import ProgressiveDisclosure from './ProgressiveDisclosure';
import ActiveRecall from './ActiveRecall';
import DualCodingLayout from './DualCodingLayout';
import ComparisonTable from './ComparisonTable';
import Callout from './Callout';
import CodeBlock from './CodeBlock';
import SmartImage from './SmartImage';
import MermaidDiagram from '../MermaidDiagram'; // Assuming this is the correct path
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  content: LearningContent;
  subject?: string;
  subtopic?: string;
}

const LearningContentRenderer: React.FC<Props> = ({ content, subject, subtopic }) => {
  // Track AI image generation to limit to one per page
  let aiImageGenerated = false;
  
  return (
    <div className="space-y-6">
      {content.map((block, index) => {
        switch (block.type) {
          case 'heading':
            const Tag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
            const slug = block.data.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
            const id = `heading-${slug}`;
            const levelStyles = {
                1: 'text-3xl font-bold mt-12 mb-6 text-gray-900',
                2: 'text-2xl font-semibold mt-8 mb-4 text-gray-900',
                3: 'text-xl font-medium mt-6 mb-3 text-gray-800',
            }
            return <Tag key={index} id={id} className={levelStyles[block.data.level] || levelStyles[3]}>{block.data.text}</Tag>;
          case 'paragraph':
            return (
              <div key={index} className="prose max-w-none text-gray-800 leading-relaxed my-4">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      
                      if (!inline && children) {
                        return (
                          <CodeBlock language={language}>
                            {String(children).replace(/\n$/, '')}
                          </CodeBlock>
                        );
                      }
                      
                      // Inline code
                      return (
                        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <>{children}</>, // Remove default pre wrapper
                    // Handle math blocks
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
                    img: ({ src, alt, ...props }) => {
                      if (!src) return null;
                      return (
                        <div className="my-6 text-center">
                          <SmartImage
                            src={src}
                            alt={alt || 'Learning content image'}
                            className="max-w-full h-auto mx-auto rounded-lg shadow-sm border border-gray-200"
                            fallbackText={alt || 'Learning content visualization'}
                            showUrl={true}
                          />
                        </div>
                      );
                    },
                  }}
                >
                  {block.data.text}
                </ReactMarkdown>
              </div>
            );
          case 'progressive_disclosure':
            return <ProgressiveDisclosure key={index} data={block.data} />;
          case 'active_recall':
            return <ActiveRecall key={index} data={block.data} />;
          case 'dual_coding':
            const shouldGenerateImage = !aiImageGenerated;
            if (shouldGenerateImage) {
              aiImageGenerated = true;
            }
            return <DualCodingLayout key={index} data={block.data} subject={subject} subtopic={subtopic} allowAIGeneration={shouldGenerateImage} />;
          case 'comparison_table':
            return <ComparisonTable key={index} data={block.data} />;
          case 'callout':
            return <Callout key={index} data={block.data} />;
          case 'mermaid_diagram':
            const chart = typeof block.data.chart === 'string' ? block.data.chart : (block.data.chart && typeof block.data.chart === 'object' && 'code' in block.data.chart) ? block.data.chart.code : '';
            return <MermaidDiagram key={index} chart={chart} id={`mermaid-${index}`} />
          case '3d_visualization':
            return (
              <div key={index} className="my-4">
                <a 
                  href={`/visualize?description=${encodeURIComponent(block.data.description)}&model=gemini-2.5-flash-lite`} 
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Interactive 3D Model
                </a>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

export default LearningContentRenderer;