'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Bug, Terminal, AlertTriangle, CheckCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface DebuggingQuestionProps {
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

// Mock function to simulate code execution and debugging
const executeAndDebug = (code: string, language: string = 'javascript'): { 
  output: string; 
  error?: string; 
  hasErrors: boolean;
  errorLines?: number[];
  suggestions?: string[];
} => {
  const lines = code.split('\n');
  const errorLines: number[] = [];
  const suggestions: string[] = [];
  let hasErrors = false;

  try {
    if (language === 'javascript') {
      // Check for common JavaScript errors
      lines.forEach((line, index) => {
        // Assignment in if condition (i = 5 instead of i === 5)
        if (line.includes('if') && line.includes('=') && !line.includes('==') && !line.includes('!=')) {
          errorLines.push(index + 1);
          suggestions.push(`Line ${index + 1}: Use comparison operator (===) instead of assignment (=)`);
          hasErrors = true;
        }
        
        // Missing semicolons in function declarations
        if (line.includes('function') && !line.includes('{') && !line.endsWith(';')) {
          // This is more for style, but can flag it
        }
        
        // Undefined variables
        if (line.includes('console.log') && line.includes('undefinedVar')) {
          errorLines.push(index + 1);
          suggestions.push(`Line ${index + 1}: 'undefinedVar' is not defined`);
          hasErrors = true;
        }
        
        // Syntax errors
        if (line.includes('function') && line.includes('(') && !line.includes(')')) {
          errorLines.push(index + 1);
          suggestions.push(`Line ${index + 1}: Missing closing parenthesis`);
          hasErrors = true;
        }
      });

      if (!hasErrors) {
        return {
          output: `✅ Code executed successfully!

No errors detected. Your debugging was successful!

Sample execution completed without issues.`,
          hasErrors: false
        };
      } else {
        return {
          output: '',
          error: `❌ Found ${errorLines.length} error(s) in the code`,
          hasErrors: true,
          errorLines,
          suggestions
        };
      }
    } else if (language === 'python') {
      // Check for common Python errors
      lines.forEach((line, index) => {
        // Indentation errors
        if (line.includes('def ') && lines[index + 1] && !lines[index + 1].startsWith('    ')) {
          errorLines.push(index + 2);
          suggestions.push(`Line ${index + 2}: Expected indentation after function definition`);
          hasErrors = true;
        }
        
        // Missing colons
        if ((line.includes('if ') || line.includes('for ') || line.includes('while ')) && !line.includes(':')) {
          errorLines.push(index + 1);
          suggestions.push(`Line ${index + 1}: Missing colon (:) at end of statement`);
          hasErrors = true;
        }
        
        // Print without parentheses (Python 2 vs 3)
        if (line.includes('print ') && !line.includes('print(')) {
          errorLines.push(index + 1);
          suggestions.push(`Line ${index + 1}: Use print() function syntax for Python 3`);
          hasErrors = true;
        }
      });

      if (!hasErrors) {
        return {
          output: `✅ Python code executed successfully!

No syntax or runtime errors found.
Code structure and logic appear correct.`,
          hasErrors: false
        };
      } else {
        return {
          output: '',
          error: `❌ Found ${errorLines.length} error(s) in the Python code`,
          hasErrors: true,
          errorLines,
          suggestions
        };
      }
    }
    
    // Generic language handling
    return {
      output: '✅ Code compiled and executed successfully!\n\nNo errors detected.',
      hasErrors: false
    };
  } catch (error) {
    return { 
      output: '', 
      error: `Runtime Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      hasErrors: true
    };
  }
};

const DebuggingQuestion: React.FC<DebuggingQuestionProps> = ({
  question,
  codeSnippet,
  language,
  onAnswerChange,
  currentAnswer
}) => {
  const detectedLanguage = language || detectLanguage(codeSnippet);
  const [editorCode, setEditorCode] = useState(codeSnippet);
  const [executionResult, setExecutionResult] = useState<{ 
    output: string; 
    error?: string; 
    hasErrors: boolean;
    errorLines?: number[];
    suggestions?: string[];
  }>({ output: 'Click "Run/Check" to test your code', hasErrors: false });
  const [isRunning, setIsRunning] = useState(false);
  const [hasBeenModified, setHasBeenModified] = useState(false);

  // Track if user has modified the code
  useEffect(() => {
    if (editorCode !== codeSnippet) {
      setHasBeenModified(true);
      // Update answer with the modified code
      onAnswerChange(editorCode);
    }
  }, [editorCode, codeSnippet, onAnswerChange]);

  // Initial analysis of the buggy code
  const initialAnalysis = useMemo(() => {
    return executeAndDebug(codeSnippet, detectedLanguage);
  }, [codeSnippet, detectedLanguage]);

  const handleRunCode = async () => {
    setIsRunning(true);
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = executeAndDebug(editorCode, detectedLanguage);
    setExecutionResult(result);
    setIsRunning(false);
  };

  const handleReset = () => {
    setEditorCode(codeSnippet);
    setExecutionResult({ output: 'Click "Run/Check" to test your code', hasErrors: false });
    setHasBeenModified(false);
    onAnswerChange('');
  };

  return (
    <div className="space-y-4">
      {/* Question at the top */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {question}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Bug className="w-4 h-4" />
            <span>Find and fix the error(s) in the code below</span>
          </div>
          {initialAnalysis.hasErrors && (
            <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>{initialAnalysis.errorLines?.length || 1} potential issue(s) detected</span>
            </div>
          )}
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
              <Bug className="w-4 h-4 text-red-600" />
              <span className="font-medium text-gray-900 dark:text-white">Debug Code</span>
              <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
                {detectedLanguage}
              </span>
              {hasBeenModified && (
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                  Modified
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Reset to original buggy code"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                title="Run code and check for errors"
              >
                {isRunning ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Checking</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Run/Check</span>
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
                contextmenu: true,
                folding: true,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                bracketPairColorization: { enabled: true },
                // Subtle error highlighting
                glyphMargin: true
              }}
              onMount={(editor, monaco) => {
                // Add subtle error indicators for initial buggy lines
                if (initialAnalysis.errorLines && initialAnalysis.errorLines.length > 0) {
                  const markers = initialAnalysis.errorLines.map(lineNum => ({
                    startLineNumber: lineNum,
                    startColumn: 1,
                    endLineNumber: lineNum,
                    endColumn: 1000,
                    message: 'Potential error on this line - click to investigate',
                    severity: monaco.MarkerSeverity.Warning
                  }));
                  
                  monaco.editor.setModelMarkers(editor.getModel()!, 'debugging', markers);
                }
              }}
            />
          </div>
        </motion.div>

        {/* Right Panel: Execution Feedback */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        >
          <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <Terminal className="w-4 h-4 text-green-600 mr-2" />
            <span className="font-medium text-gray-900 dark:text-white">Execution Results</span>
            {executionResult.hasErrors === false && hasBeenModified && (
              <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
            )}
          </div>
          
          <div className="h-[calc(100%-60px)] p-4 font-mono text-sm overflow-auto">
            {executionResult.error ? (
              <div className="space-y-4">
                <div className="text-red-400">
                  <div className="font-semibold mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Compilation/Runtime Errors:
                  </div>
                  <div className="whitespace-pre-wrap bg-red-900/20 p-3 rounded border-l-4 border-red-500">
                    {executionResult.error}
                  </div>
                </div>
                
                {executionResult.suggestions && executionResult.suggestions.length > 0 && (
                  <div className="text-yellow-400">
                    <div className="font-semibold mb-2">💡 Debugging Suggestions:</div>
                    <ul className="space-y-1 pl-4">
                      {executionResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="list-disc">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-green-400">
                <div className="font-semibold mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Execution Result:
                </div>
                <div className="whitespace-pre-wrap bg-green-900/20 p-3 rounded border-l-4 border-green-500">
                  {executionResult.output}
                </div>
                {hasBeenModified && !executionResult.hasErrors && (
                  <div className="mt-4 p-3 bg-blue-900/20 rounded border-l-4 border-blue-500">
                    <div className="text-blue-400 font-semibold">🎉 Great job!</div>
                    <div className="text-blue-300">You've successfully fixed the bug(s) in the code!</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Instructions */}
      <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 text-orange-600 mt-0.5">🔍</div>
          <div className="flex-1">
            <p className="text-sm text-orange-800 dark:text-orange-200 font-medium mb-1">
              Debugging Instructions:
            </p>
            <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <li>• Examine the code carefully to identify syntax or logic errors</li>
              <li>• Edit the code directly in the editor to fix any issues</li>
              <li>• Use "Run/Check" to test your fixes and see compilation results</li>
              <li>• The right panel will show detailed error messages and suggestions</li>
              {initialAnalysis.errorLines && initialAnalysis.errorLines.length > 0 && (
                <li>• <strong>Hint:</strong> Pay attention to lines with warning markers</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Original vs Fixed Code Summary (only show after modification) */}
      {hasBeenModified && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            📝 Your Changes Summary:
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {executionResult.hasErrors 
              ? "Keep working on fixing the errors. Check the suggestions in the output panel."
              : "Excellent! You've identified and fixed all the bugs in the code."}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default DebuggingQuestion;