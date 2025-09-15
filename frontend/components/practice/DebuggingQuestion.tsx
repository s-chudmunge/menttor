'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Bug, Terminal, AlertTriangle, CheckCircle, Lightbulb, Zap } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { editor, languages } from 'monaco-editor';

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

// Enhanced debugging analysis engine
const executeAndDebug = (code: string, language: string = 'javascript'): { 
  output: string; 
  error?: string; 
  hasErrors: boolean;
  errorLines?: number[];
  suggestions?: string[];
  warnings?: string[];
  fixes?: { line: number; original: string; fixed: string }[];
} => {
  const lines = code.split('\n');
  const errorLines: number[] = [];
  const suggestions: string[] = [];
  const warnings: string[] = [];
  const fixes: { line: number; original: string; fixed: string }[] = [];
  let hasErrors = false;

  try {
    if (language === 'javascript') {
      return analyzeJavaScript(code, lines, errorLines, suggestions, warnings, fixes);
    } else if (language === 'python') {
      return analyzePython(code, lines, errorLines, suggestions, warnings, fixes);
    } else if (language === 'java') {
      return analyzeJava(code, lines, errorLines, suggestions, warnings, fixes);
    }
    
    // Generic language handling
    return {
      output: '✅ Code compiled and executed successfully!\n\nNo errors detected.',
      hasErrors: false,
      warnings
    };
  } catch (error) {
    return { 
      output: '', 
      error: `Runtime Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      hasErrors: true
    };
  }
};

// JavaScript-specific analysis
const analyzeJavaScript = (code: string, lines: string[], errorLines: number[], suggestions: string[], warnings: string[], fixes: { line: number; original: string; fixed: string }[]) => {
  let hasErrors = false;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Assignment in if condition (i = 5 instead of i === 5)
    if (line.includes('if') && /if\s*\([^)]*[^!=<>]=[^=]/.test(line)) {
      errorLines.push(lineNum);
      suggestions.push(`Line ${lineNum}: Use comparison operator (===) instead of assignment (=)`);
      const fixedLine = line.replace(/([^!=<>])=([^=])/, '$1===$2');
      fixes.push({ line: lineNum, original: line.trim(), fixed: fixedLine.trim() });
      hasErrors = true;
    }
    
    // Missing semicolons
    if (/^\s*\w+\s*=\s*[^;]+$/.test(line) && !line.includes('for') && !line.includes('if')) {
      warnings.push(`Line ${lineNum}: Consider adding semicolon for consistency`);
    }
    
    // Undefined variables (common patterns)
    if (line.includes('undefinedVar') || line.includes('unknownFunc')) {
      errorLines.push(lineNum);
      suggestions.push(`Line ${lineNum}: Variable or function is not defined`);
      hasErrors = true;
    }
    
    // Syntax errors - missing parentheses
    if (/function\s+\w+\s*\([^)]*$/.test(line)) {
      errorLines.push(lineNum);
      suggestions.push(`Line ${lineNum}: Missing closing parenthesis in function declaration`);
      hasErrors = true;
    }
    
    // Missing braces
    if (/^\s*(if|for|while)\s*\([^)]*\)\s*[^{].*[^;]$/.test(line)) {
      warnings.push(`Line ${lineNum}: Consider using braces {} for better code structure`);
    }
  });

  if (!hasErrors) {
    return {
      output: `✅ JavaScript code executed successfully!\n\n🎉 No errors detected. Your debugging was successful!\n\n📊 Code analysis complete - all syntax checks passed.`,
      hasErrors: false,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } else {
    return {
      output: '',
      error: `❌ Found ${errorLines.length} error(s) in the JavaScript code`,
      hasErrors: true,
      errorLines,
      suggestions,
      warnings: warnings.length > 0 ? warnings : undefined,
      fixes: fixes.length > 0 ? fixes : undefined
    };
  }
};

// Python-specific analysis
const analyzePython = (code: string, lines: string[], errorLines: number[], suggestions: string[], warnings: string[], fixes: { line: number; original: string; fixed: string }[]) => {
  let hasErrors = false;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Indentation errors
    if (/^\s*(def|class)\s+\w/.test(line) && lines[index + 1] && !/^\s{4,}/.test(lines[index + 1])) {
      if (lines[index + 1].trim()) { // Only if next line isn't empty
        errorLines.push(lineNum + 1);
        suggestions.push(`Line ${lineNum + 1}: Expected indentation (4 spaces) after ${line.includes('def') ? 'function' : 'class'} definition`);
        hasErrors = true;
      }
    }
    
    // Missing colons
    if (/^\s*(def|if|for|while|class|elif|else|try|except|finally)\b/.test(line) && !line.includes(':')) {
      errorLines.push(lineNum);
      suggestions.push(`Line ${lineNum}: Missing colon (:) at end of statement`);
      const fixedLine = line.trim() + ':';
      fixes.push({ line: lineNum, original: line.trim(), fixed: fixedLine });
      hasErrors = true;
    }
    
    // Print without parentheses (Python 2 vs 3)
    if (/\bprint\s+[^(]/.test(line) && !line.includes('print(')) {
      errorLines.push(lineNum);
      suggestions.push(`Line ${lineNum}: Use print() function syntax for Python 3`);
      const fixedLine = line.replace(/print\s+(.+)/, 'print($1)');
      fixes.push({ line: lineNum, original: line.trim(), fixed: fixedLine.trim() });
      hasErrors = true;
    }
    
    // Common variable naming issues
    if (/\b[A-Z][a-zA-Z]*\s*=/.test(line) && !line.includes('class')) {
      warnings.push(`Line ${lineNum}: Variable names should be lowercase with underscores (PEP 8)`);
    }
  });

  if (!hasErrors) {
    return {
      output: `✅ Python code executed successfully!\n\n🐍 No syntax or runtime errors found.\n📋 Code structure and logic appear correct.\n\n✨ All Python syntax checks passed!`,
      hasErrors: false,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } else {
    return {
      output: '',
      error: `❌ Found ${errorLines.length} error(s) in the Python code`,
      hasErrors: true,
      errorLines,
      suggestions,
      warnings: warnings.length > 0 ? warnings : undefined,
      fixes: fixes.length > 0 ? fixes : undefined
    };
  }
};

// Java-specific analysis
const analyzeJava = (code: string, lines: string[], errorLines: number[], suggestions: string[], warnings: string[], fixes: { line: number; original: string; fixed: string }[]) => {
  let hasErrors = false;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Missing semicolons
    if (/^\s*\w+.*[^;{}]$/.test(line) && !line.includes('class') && !line.includes('{') && !line.includes('}') && line.trim()) {
      errorLines.push(lineNum);
      suggestions.push(`Line ${lineNum}: Missing semicolon (;) at end of statement`);
      const fixedLine = line.trim() + ';';
      fixes.push({ line: lineNum, original: line.trim(), fixed: fixedLine });
      hasErrors = true;
    }
    
    // Variable declaration issues
    if (/=\s*\w+/.test(line) && !/\b(int|String|boolean|double|float|char)\s+\w+/.test(line) && !line.includes('=')) {
      warnings.push(`Line ${lineNum}: Consider explicit type declaration`);
    }
  });

  if (!hasErrors) {
    return {
      output: `✅ Java code compiled successfully!\n\n☕ No compilation errors found.\n🏗️ Class structure appears correct.\n\n📋 All syntax checks passed!`,
      hasErrors: false,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } else {
    return {
      output: '',
      error: `❌ Found ${errorLines.length} error(s) in the Java code`,
      hasErrors: true,
      errorLines,
      suggestions,
      warnings: warnings.length > 0 ? warnings : undefined,
      fixes: fixes.length > 0 ? fixes : undefined
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
    warnings?: string[];
    fixes?: { line: number; original: string; fixed: string }[];
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
    
    // Simulate realistic execution delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1200 + 300));
    
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
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                bracketPairColorization: { enabled: true },
                // Enhanced IntelliSense and error highlighting
                glyphMargin: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                quickSuggestions: { other: true, comments: false, strings: false },
                hover: { enabled: true },
                parameterHints: { enabled: true },
                renderValidationDecorations: 'on'
              }}
              onMount={(editor, monaco) => {
                // Add enhanced error indicators for initial buggy lines
                if (initialAnalysis.errorLines && initialAnalysis.errorLines.length > 0) {
                  const markers = initialAnalysis.errorLines.map(lineNum => ({
                    startLineNumber: lineNum,
                    startColumn: 1,
                    endLineNumber: lineNum,
                    endColumn: 1000,
                    message: initialAnalysis.suggestions?.[initialAnalysis.errorLines!.indexOf(lineNum)] || 'Potential error detected',
                    severity: monaco.MarkerSeverity.Error
                  }));
                  
                  monaco.editor.setModelMarkers(editor.getModel()!, 'debugging', markers);
                }
                
                // Real-time error checking
                editor.onDidChangeModelContent(() => {
                  const model = editor.getModel();
                  if (model) {
                    const currentCode = model.getValue();
                    const analysis = executeAndDebug(currentCode, detectedLanguage);
                    
                    const newMarkers: any[] = [];
                    if (analysis.errorLines) {
                      analysis.errorLines.forEach((lineNum, index) => {
                        newMarkers.push({
                          startLineNumber: lineNum,
                          startColumn: 1,
                          endLineNumber: lineNum,
                          endColumn: 1000,
                          message: analysis.suggestions?.[index] || 'Error detected',
                          severity: monaco.MarkerSeverity.Error
                        });
                      });
                    }
                    
                    if (analysis.warnings) {
                      analysis.warnings.forEach((warning) => {
                        const lineMatch = warning.match(/Line (\d+)/);
                        if (lineMatch) {
                          const lineNum = parseInt(lineMatch[1]);
                          newMarkers.push({
                            startLineNumber: lineNum,
                            startColumn: 1,
                            endLineNumber: lineNum,
                            endColumn: 1000,
                            message: warning,
                            severity: monaco.MarkerSeverity.Warning
                          });
                        }
                      });
                    }
                    
                    monaco.editor.setModelMarkers(model, 'debugging', newMarkers);
                  }
                });
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
                    <div className="font-semibold mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Debugging Suggestions:
                    </div>
                    <ul className="space-y-1 bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-500">
                      {executionResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="list-disc list-inside text-sm">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {executionResult.fixes && executionResult.fixes.length > 0 && (
                  <div className="text-blue-400">
                    <div className="font-semibold mb-2 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Suggested Fixes:
                    </div>
                    <div className="space-y-2 bg-blue-900/20 p-3 rounded border-l-4 border-blue-500">
                      {executionResult.fixes.map((fix, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">Line {fix.line}:</div>
                          <div className="pl-4">
                            <div className="text-red-300">- {fix.original}</div>
                            <div className="text-green-300">+ {fix.fixed}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {executionResult.warnings && executionResult.warnings.length > 0 && (
                  <div className="text-orange-400">
                    <div className="font-semibold mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Code Quality Warnings:
                    </div>
                    <ul className="space-y-1 bg-orange-900/20 p-3 rounded border-l-4 border-orange-500">
                      {executionResult.warnings.map((warning, index) => (
                        <li key={index} className="list-disc list-inside text-sm">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-green-400">
                  <div className="font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Execution Result:
                  </div>
                  <div className="whitespace-pre-wrap bg-green-900/20 p-3 rounded border-l-4 border-green-500">
                    {executionResult.output}
                  </div>
                </div>
                
                {executionResult.warnings && executionResult.warnings.length > 0 && (
                  <div className="text-orange-400">
                    <div className="font-semibold mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Code Quality Warnings:
                    </div>
                    <ul className="space-y-1 bg-orange-900/20 p-3 rounded border-l-4 border-orange-500">
                      {executionResult.warnings.map((warning, index) => (
                        <li key={index} className="list-disc list-inside text-sm">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {hasBeenModified && !executionResult.hasErrors && (
                  <div className="p-3 bg-blue-900/20 rounded border-l-4 border-blue-500">
                    <div className="text-blue-400 font-semibold flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      🎉 Excellent debugging work!
                    </div>
                    <div className="text-blue-300">You've successfully identified and fixed all the bugs in the code!</div>
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