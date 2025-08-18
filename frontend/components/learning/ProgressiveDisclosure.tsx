import React from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUp, BookOpen } from 'lucide-react';
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
        <div className="p-6 border-b border-gray-200/50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-indigo-600"/>
                </div>
                {data.key_idea}
            </h3>
        </div>

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

        <div className="px-6 pb-6">
            <Disclosure as="div">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full items-center justify-between rounded-xl bg-gray-100/80 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-200/80 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/75 transition">
                    <span>Continue to Full Explanation</span>
                    <ChevronUp
                      className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-600 transition-transform`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="mt-4 p-4 bg-gray-50/50 rounded-xl prose max-w-none text-sm text-gray-600">
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
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
        </div>
      </div>
  );
};

export default ProgressiveDisclosure;
