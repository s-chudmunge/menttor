import React from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUp, BrainCircuit } from 'lucide-react';
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
        <Disclosure as="div">
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 text-left font-medium text-indigo-900 hover:bg-indigo-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/75 transition">
                <div className="flex items-center">
                  <BrainCircuit className="h-6 w-6 mr-3 text-indigo-600" />
                  <div className="text-lg prose prose-lg max-w-none">
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
                <ChevronUp
                  className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-indigo-500 transition-transform`}
                />
              </Disclosure.Button>
              <Disclosure.Panel className="mt-4 px-4 pt-4 pb-2 text-gray-700 prose max-w-none bg-gray-50/50 rounded-xl">
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
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>
  );
};

export default ActiveRecall;
