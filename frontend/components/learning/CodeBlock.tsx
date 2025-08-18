'use client';

import React, { useState } from 'react';
import { Copy, Edit, Check } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  language?: string;
  filename?: string;
}

// Simple syntax highlighter as JSX
const highlightCode = (code: string, language: string) => {
  const lines = code.split('\n');
  
  return lines.map((line, lineIndex) => {
    let highlightedLine = line;
    
    if (language === 'python') {
      // Keywords
      highlightedLine = highlightedLine.replace(
        /\b(def|return|if|else|elif|import|from|class|for|while|try|except|finally|with|as|in|not|and|or|True|False|None|__name__|__main__)\b/g,
        '<span class="text-blue-400 font-medium">$1</span>'
      );
      
      // Strings
      highlightedLine = highlightedLine.replace(
        /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="text-green-400">$&</span>'
      );
      
      // Comments
      highlightedLine = highlightedLine.replace(
        /#.*/g,
        '<span class="text-gray-500 italic">$&</span>'
      );
      
      // Function calls
      highlightedLine = highlightedLine.replace(
        /\b(\w+)(?=\s*\()/g,
        '<span class="text-yellow-400">$1</span>'
      );
      
      // Numbers
      highlightedLine = highlightedLine.replace(
        /\b\d+\.?\d*\b/g,
        '<span class="text-purple-400">$&</span>'
      );
    }
    
    return (
      <div key={lineIndex} dangerouslySetInnerHTML={{ __html: highlightedLine }} />
    );
  });
};

const CodeBlock: React.FC<CodeBlockProps> = ({ children, language = '', filename }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleEdit = () => {
    // This could open an editor modal or navigate to an editor page
    console.log('Edit code:', children);
  };

  return (
    <div className="my-6 bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Traffic light dots */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          {/* Language/filename */}
          <span className="text-sm text-gray-300 font-mono">
            {filename || language || 'code'}
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            title="Copy code"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            title="Edit code"
          >
            <Edit className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>
      </div>
      
      {/* Code content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed text-gray-100">
          {highlightCode(children, language)}
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;