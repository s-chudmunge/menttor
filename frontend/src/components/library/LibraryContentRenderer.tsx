import React, { useState } from 'react';
import { LearningContent, ContentBlock } from '../../../types/learning';
import ProgressiveDisclosure from '../../../components/learning/ProgressiveDisclosure';
import ActiveRecall from '../../../components/learning/ActiveRecall';
import DualCodingLayout from '../../../components/learning/DualCodingLayout';
import ComparisonTable from '../../../components/learning/ComparisonTable';
import Callout from '../../../components/learning/Callout';
import CodeBlock from '../../../components/learning/CodeBlock';
import SmartImage from '../../../components/learning/SmartImage';
import dynamic from 'next/dynamic';
import { RefreshCw, MoreHorizontal } from 'lucide-react';
import EditableContentBlock from './EditableContentBlock';

// Dynamic import for Mermaid to prevent SSR issues
const MermaidDiagram = dynamic(() => import('../../../components/MermaidDiagram'), {
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
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { BACKEND_URL } from '../../config/config';

interface Props {
  content: any[];
  subject?: string;
  subtopic?: string;
  editMode?: boolean;
}

const LibraryContentRenderer: React.FC<Props> = ({ content, subject, subtopic, editMode = false }) => {
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regeneratingPage, setRegeneratingPage] = useState(false);

  const handleRegenerateComponent = async (index: number, model: string) => {
    setRegeneratingIndex(index);
    try {
      const response = await fetch(
        `${BACKEND_URL}/library/neural-network-architectures/regenerate-component`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            component_index: index,
            model: model,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Component regenerated successfully:', result);
      
      // Reload the page to show updated content
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to regenerate component:', error);
      // Show user-friendly error message
      alert('Failed to regenerate component. Please try again.');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleRegeneratePage = async (model: string) => {
    setRegeneratingPage(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/library/neural-network-architectures/regenerate-page`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Page regenerated successfully:', result);
      
      // Reload the page to show updated content
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to regenerate page:', error);
      // Show user-friendly error message
      alert('Failed to regenerate page. Please try again.');
    } finally {
      setRegeneratingPage(false);
    }
  };

  const renderContentBlock = (block: any, index: number) => {
    const isRegenerating = regeneratingIndex === index;
    
    let blockContent: React.ReactNode;

    switch (block.type) {
      case 'heading':
        const Tag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
        const slug = block.data.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
        const id = `heading-${slug}`;
        const levelStyles: { [key: number]: string } = {
          1: 'text-3xl font-bold mt-12 mb-6 text-gray-900',
          2: 'text-2xl font-semibold mt-8 mb-4 text-gray-900',
          3: 'text-xl font-medium mt-6 mb-3 text-gray-800',
        };
        blockContent = (
          <Tag id={id} className={levelStyles[block.data.level] || levelStyles[3]}>
            {block.data.text}
          </Tag>
        );
        break;

      case 'paragraph':
        blockContent = (
          <div className="prose max-w-none text-gray-800 leading-relaxed my-4">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code: ({ node, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const inline = props.inline;
                  
                  if (!inline && children) {
                    return (
                      <CodeBlock language={language}>
                        {String(children).replace(/\n$/, '')}
                      </CodeBlock>
                    );
                  }
                  
                  return (
                    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <>{children}</>,
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
        break;

      case 'progressive_disclosure':
        blockContent = <ProgressiveDisclosure data={block.data} />;
        break;

      case 'active_recall':
        blockContent = <ActiveRecall data={block.data} />;
        break;

      case 'dual_coding':
        blockContent = (
          <DualCodingLayout 
            data={block.data} 
            subject={subject} 
            subtopic={subtopic} 
            allowAIGeneration={false} 
          />
        );
        break;

      case 'comparison_table':
        blockContent = <ComparisonTable data={block.data} />;
        break;

      case 'callout':
        blockContent = <Callout data={block.data} />;
        break;

      case 'mermaid_diagram':
        const chart = typeof block.data.chart === 'string' 
          ? block.data.chart 
          : (block.data.chart && typeof block.data.chart === 'object' && 'code' in block.data.chart) 
            ? (block.data.chart as any).code 
            : '';
        
        if (!chart || chart.trim() === '') {
          blockContent = (
            <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-center">
                <div className="text-yellow-600 text-2xl mb-2">📊</div>
                <p className="text-yellow-800 font-medium">Mermaid Diagram</p>
                <p className="text-yellow-700 text-sm">No diagram content provided</p>
              </div>
            </div>
          );
        } else {
          blockContent = (
            <div className="my-4">
              <MermaidDiagram chart={chart} id={`mermaid-${index}`} />
            </div>
          );
        }
        break;

      default:
        blockContent = null;
    }

    return (
      <EditableContentBlock
        key={index}
        index={index}
        isRegenerating={isRegenerating}
        editMode={editMode}
        onRegenerate={handleRegenerateComponent}
      >
        {blockContent}
      </EditableContentBlock>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page-level regeneration controls */}
      {editMode && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Page Controls</h3>
              <p className="text-sm text-blue-700 mt-1">Regenerate the entire page content</p>
            </div>
            <button
              onClick={() => handleRegeneratePage('vertexai:gemini-2.5-flash-lite')}
              disabled={regeneratingPage}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {regeneratingPage ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Regenerate Page</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Content blocks */}
      {content.map((block, index) => renderContentBlock(block, index))}
    </div>
  );
};

export default LibraryContentRenderer;