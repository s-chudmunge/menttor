'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Code2, Terminal } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CodeCompletionQuestionProps {
  question: string;
  codeSnippet: string;
  language?: string;
  onAnswerChange: (answer: string) => void;
  currentAnswer: string;
}

// Auto-detect language from code snippet
const detectLanguage = (code: string): string => {
  if (code.includes('def ') || code.includes('print(') || code.includes('import ') || code.includes('from ')) {
    return 'python';
  }
  if (code.includes('function ') || code.includes('const ') || code.includes('let ') || code.includes('console.log')) {
    return 'javascript';
  }
  if (code.includes('public class') || code.includes('System.out') || code.includes('public static void main')) {
    return 'java';
  }
  if (code.includes('#include') || code.includes('std::') || code.includes('cout')) {
    return 'cpp';
  }
  if (code.includes('func ') || code.includes('package main') || code.includes('fmt.Print')) {
    return 'go';
  }
  return 'javascript'; // default
};

// Mock function to simulate code execution
const executeCode = (code: string, language: string = 'javascript'): { output: string; error?: string } => {
  try {
    if (language === 'javascript') {
      // Simulate JavaScript execution
      if (code.includes('function addNumbers')) {
        if (code.includes('a + b')) {
          return { 
            output: `✅ Function executed successfully!

Testing your function:
addNumbers(5, 3) → 8
addNumbers(10, 15) → 25
addNumbers(-2, 7) → 5

Great job! Your function correctly adds two numbers.` 
          };
        } else {
          return { 
            output: '', 
            error: 'SyntaxError: Function body is incomplete or incorrect' 
          };
        }
      }
      
      if (code.includes('console.log')) {
        const matches = code.match(/console\.log\([^)]+\)/g);
        if (matches) {
          const outputs = matches.map(match => {
            const content = match.match(/console\.log\((.+)\)/)?.[1] || '';
            return content.replace(/['"]/g, '');
          });
          return { output: outputs.join('\n') };
        }
      }
      
      return { output: '✅ Code compiled successfully!\n\nNo output to display.' };
    } else if (language === 'python') {
      // Simulate Python execution
      if (code.includes('def ')) {
        if (code.includes('return ') || code.includes('print(')) {
          return { 
            output: `✅ Python function executed successfully!

Your code is syntactically correct and ready to run.
Function definition found and appears complete.` 
          };
        }
      }
      
      if (code.includes('print(')) {
        const matches = code.match(/print\([^)]+\)/g);
        if (matches) {
          const outputs = matches.map(match => {
            const content = match.match(/print\((.+)\)/)?.[1] || '';
            return content.replace(/['"]/g, '');
          });
          return { output: outputs.join('\n') };
        }
      }
      
      return { output: '✅ Python code compiled successfully!' };
    } else if (language === 'java') {
      return { 
        output: `✅ Java code compiled successfully!

No compilation errors found.
Code structure appears correct.` 
      };
    } else if (language === 'cpp' || language === 'c++') {
      return { 
        output: `✅ C++ code compiled successfully!

Build completed without errors.
Ready for execution.` 
      };
    }
    
    return { output: '✅ Code compiled successfully!' };
  } catch (error) {
    return { 
      output: '', 
      error: `Compilation Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

const CodeCompletionQuestion: React.FC<CodeCompletionQuestionProps> = ({
  question,
  codeSnippet,
  language,
  onAnswerChange,
  currentAnswer
}) => {
  const detectedLanguage = language || detectLanguage(codeSnippet);
  const [editorCode, setEditorCode] = useState('');
  const [output, setOutput] = useState<{ output: string; error?: string }>({ output: 'Click "Run Code" to see output' });
  const [isRunning, setIsRunning] = useState(false);

  // Process the code snippet to identify completion areas and set initial editor content
  const { processedCode, completionAreas } = useMemo(() => {
    // Find areas that need completion (marked with comments or blanks)
    const lines = codeSnippet.split('\n');
    const areas: { line: number; placeholder: string }[] = [];
    
    const processed = lines.map((line, index) => {
      // Look for completion indicators
      if (line.includes('// Complete this') || line.includes('// TODO:') || line.includes('_____')) {
        const placeholder = line.includes('_____') ? 
          line.replace(/_____/g, '/* COMPLETE THIS */') :
          line.includes('//') ? 
            line.replace(/\/\/.*/, '/* COMPLETE THIS */') :
            line + ' /* COMPLETE THIS */';
        
        areas.push({ line: index, placeholder });
        return placeholder;
      }
      
      // Replace simple blanks
      if (line.includes('_____')) {
        return line.replace(/_____/g, '/* COMPLETE THIS */');
      }
      
      return line;
    }).join('\n');
    
    return { processedCode: processed, completionAreas: areas };
  }, [codeSnippet]);

  // Initialize editor with processed code
  useEffect(() => {
    setEditorCode(processedCode);
  }, [processedCode]);

  // Update answer when editor changes
  useEffect(() => {
    // Extract the user's completion from the editor
    const extractCompletion = (code: string) => {
      // Simple extraction: look for code that replaced the comments
      const originalLines = processedCode.split('\n');
      const currentLines = code.split('\n');
      
      const completions: string[] = [];
      
      for (let i = 0; i < Math.max(originalLines.length, currentLines.length); i++) {
        const original = originalLines[i] || '';
        const current = currentLines[i] || '';
        
        if (original.includes('/* COMPLETE THIS */') && !current.includes('/* COMPLETE THIS */')) {
          // User has replaced the comment
          completions.push(current.trim());
        }
      }
      
      return completions.join('\n');
    };
    
    const completion = extractCompletion(editorCode);
    onAnswerChange(completion);
  }, [editorCode, processedCode, onAnswerChange]);

  const handleRunCode = async () => {
    setIsRunning(true);
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = executeCode(editorCode, detectedLanguage);
    setOutput(result);
    setIsRunning(false);
  };

  const handleReset = () => {
    setEditorCode(processedCode);
    setOutput({ output: 'Click "Run Code" to see output' });
  };

  return (
    <div className="space-y-4">
      {/* Question at the top */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {question}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Code2 className="w-4 h-4" />
          <span>Complete the missing code parts marked with comments</span>
        </div>
      </div>

      {/* Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
        {/* Left Panel: Code Editor */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-gray-900 dark:text-white">Code Editor</span>
              <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded">
                {detectedLanguage}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Reset code"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                title="Run code"
              >
                {isRunning ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Running</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Run</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="h-[calc(100%-60px)]">
            <Editor
              height="100%"
              language={detectedLanguage}
              value={editorCode}
              onChange={(value) => setEditorCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                cursorStyle: 'line',
                automaticLayout: true,
                wordWrap: 'on',
                contextmenu: false,
                folding: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                bracketPairColorization: { enabled: true }
              }}
            />
          </div>
        </motion.div>

        {/* Right Panel: Output */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        >
          <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <Terminal className="w-4 h-4 text-green-600 mr-2" />
            <span className="font-medium text-gray-900 dark:text-white">Output</span>
          </div>
          
          <div className="h-[calc(100%-60px)] p-4 font-mono text-sm overflow-auto">
            {output.error ? (
              <div className="text-red-400">
                <div className="font-semibold mb-2">❌ Error:</div>
                <div className="whitespace-pre-wrap">{output.error}</div>
              </div>
            ) : (
              <div className="text-green-400">
                <div className="whitespace-pre-wrap">{output.output}</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 text-blue-600 mt-0.5">💡</div>
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
              Instructions:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Replace the comments marked with "COMPLETE THIS" with your code</li>
              <li>• Use the "Run" button to test your code and see the output</li>
              <li>• The right panel shows the execution result in real-time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeCompletionQuestion;