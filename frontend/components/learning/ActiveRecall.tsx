import React from 'react';
import { BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  data: { question: string; answer: string };
}

const ActiveRecall: React.FC<Props> = ({ data }) => {
  return (
    <div className="my-6 bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg p-6">
      {/* Question Section */}
      <div className="flex items-start bg-indigo-50 px-4 py-3 rounded-xl mb-4">
        <BrainCircuit className="h-6 w-6 mr-3 text-indigo-600 mt-1 flex-shrink-0" />
        <div className="text-xl font-medium text-indigo-900 prose prose-xl max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              div: ({ className, children, ...props }) => {
                if (className === 'math math-display') {
                  return <div className="math-display my-2 text-center" {...props}>{children}</div>;
                }
                return <div className={className} {...props}>{children}</div>;
              },
              span: ({ className, children, ...props }) => {
                if (className === 'math math-inline') {
                  return <span className="math-inline" {...props}>{children}</span>;
                }
                return <span className={className} {...props}>{children}</span>;
              },
              p: ({ children }) => <span>{children}</span>,
            }}
          >
            {data.question}
          </ReactMarkdown>
        </div>
      </div>
      
      {/* Answer Section */}
      <div className="px-4 pt-4 pb-2 text-gray-700 prose max-w-none bg-gray-50/50 rounded-xl">
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
          {data.answer}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ActiveRecall;
