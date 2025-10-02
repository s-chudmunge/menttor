import React from 'react';
import { Lightbulb, AlertTriangle, Beaker, GitCompareArrows } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  data: { text: string; style: 'metaphor' | 'analogy' | 'example' | 'warning' };
}

const styleConfig = {
  metaphor: {
    icon: Lightbulb,
    className: "bg-green-50 border-green-400 text-green-800",
    iconBg: "bg-green-100",
    iconColor: "text-green-600"
  },
  analogy: {
    icon: GitCompareArrows,
    className: "bg-blue-50 border-blue-400 text-blue-800",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600"
  },
  example: {
    icon: Beaker,
    className: "bg-green-50 border-green-400 text-green-800",
    iconBg: "bg-green-100",
    iconColor: "text-green-600"
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-yellow-50 border-yellow-400 text-yellow-800",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600"
  },
};

const Callout: React.FC<Props> = ({ data }) => {
  const config = styleConfig[data.style] || styleConfig.example;
  const Icon = config.icon;

  return (
    <div className={`my-6 p-6 rounded-2xl border-l-4 shadow-lg ${config.className}`}>
        <div className="flex items-start">
            <div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center mr-4 flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="prose max-w-none text-current">
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
                >{data.text}</ReactMarkdown>
            </div>
        </div>
    </div>
  );
};

export default Callout;
