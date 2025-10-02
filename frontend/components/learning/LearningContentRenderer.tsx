import React from 'react';
import { LearningContent, ContentBlock } from '../../types/learning';
import ProgressiveDisclosure from './ProgressiveDisclosure';
import ActiveRecall from './ActiveRecall';
import DualCodingLayout from './DualCodingLayout';
import ComparisonTable from './ComparisonTable';
import Callout from './Callout';
import CodeBlock from './CodeBlock';
import SmartImage from './SmartImage';
import dynamic from 'next/dynamic';

// Dynamic import for Mermaid to prevent SSR issues
const MermaidDiagram = dynamic(() => import('../MermaidDiagram'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading diagram...</p>
      </div>
    </div>
  )
});
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
    <div className="space-y-4 sm:space-y-6">
      {content.map((block, index) => {
        switch (block.type) {
          case 'heading':
            const Tag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
            const slug = block.data.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
            const id = `heading-${slug}`;
            const levelStyles = {
                1: 'text-2xl sm:text-3xl font-bold mt-8 sm:mt-12 mb-4 sm:mb-6 text-gray-900',
                2: 'text-xl sm:text-2xl font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4 text-gray-900',
                3: 'text-lg sm:text-xl font-medium mt-4 sm:mt-6 mb-2 sm:mb-3 text-gray-800',
            }
            return <Tag key={index} id={id} className={levelStyles[block.data.level] || levelStyles[3]}>{block.data.text}</Tag>;
          case 'paragraph':
            return (
              <div key={index} className="prose max-w-none text-gray-800 leading-relaxed my-3 sm:my-4 text-sm sm:text-base">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code: ({ node, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      const inline = props.inline;
                      const codeContent = String(children).replace(/\n$/, '');
                      
                      if (!inline && children) {
                        // Always render as CodeBlock - it will decide how to display based on content length
                        return (
                          <CodeBlock language={language}>
                            {codeContent}
                          </CodeBlock>
                        );
                      }
                      
                      // Inline code - use CodeBlock component for consistency
                      return (
                        <CodeBlock language={language}>
                          {codeContent}
                        </CodeBlock>
                      );
                    },
                    pre: ({ children }) => <>{children}</>, // Remove default pre wrapper
                    // Handle math blocks
                    div: ({ className, children, ...props }) => {
                      if (className === 'math math-display') {
                        return <div className="math-display my-3 sm:my-4 text-center overflow-x-auto" {...props}>{children}</div>;
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
                        <div className="my-4 sm:my-6 text-center">
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
            // Hidden - dual coding component disabled
            return null;
          case 'comparison_table':
            return <ComparisonTable key={index} data={block.data} />;
          case 'callout':
            return <Callout key={index} data={block.data} />;
          case 'mermaid_diagram':
            const chart = typeof block.data.chart === 'string' ? block.data.chart : (block.data.chart && typeof block.data.chart === 'object' && 'code' in block.data.chart) ? (block.data.chart as any).code : '';
            console.log('Rendering Mermaid diagram:', { chart, blockData: block.data }); // Debug log
            
            if (!chart || chart.trim() === '') {
              return (
                <div key={index} className="my-3 sm:my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-yellow-600 text-2xl mb-2">📊</div>
                    <p className="text-yellow-800 font-medium">Mermaid Diagram</p>
                    <p className="text-yellow-700 text-sm">No diagram content provided</p>
                  </div>
                </div>
              );
            }
            
            return (
              <div key={index} className="my-3 sm:my-4">
                <MermaidDiagram chart={chart} id={`mermaid-${index}`} />
              </div>
            );
          case '3d_visualization':
            return (
              <div key={index} className="my-3 sm:my-4">
                <a 
                  href={`/visualize?d=${encodeURIComponent(block.data.description)}&m=gemini-2.5-flash`} 
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white font-medium py-2 sm:py-2 px-3 sm:px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="hidden sm:inline">Interactive 3D Model</span>
                  <span className="sm:hidden">3D Model</span>
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