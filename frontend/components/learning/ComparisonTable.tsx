import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  data: { headers: string[]; rows: string[][] };
}

const ComparisonTable: React.FC<Props> = ({ data }) => {
  return (
    <div className="overflow-x-auto my-8 border border-gray-200">
        <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-gray-800 bg-gray-50 border-b border-gray-200">
                <tr>
                    {data.headers.map((header, index) => (
                        <th key={index} scope="col" className="px-6 py-4 font-semibold">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                div: ({ className, children, ...props }) => {
                                  if (className === 'math math-display') {
                                    return <div className="math-display my-1 text-center" {...props}>{children}</div>;
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
                              {header}
                            </ReactMarkdown>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="bg-white border-b border-gray-100 last:border-b-0">
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-6 py-4">
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                  components={{
                                    div: ({ className, children, ...props }) => {
                                      if (className === 'math math-display') {
                                        return <div className="math-display my-1 text-center" {...props}>{children}</div>;
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
                                  {cell}
                                </ReactMarkdown>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default ComparisonTable;