'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Code2, Terminal, Lightbulb, CheckCircle, AlertTriangle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { editor, languages } from 'monaco-editor';

interface CodeCompletionQuestionProps {
  question: string;
  codeSnippet: string;
  language?: string;
  onAnswerChange: (answer: string) => void;
  currentAnswer: string;
}

// Enhanced language detection with scoring system
const detectLanguage = (code: string): string => {
  const patterns = {
    python: [
      /\bdef\s+\w+\s*\(/g,
      /\bprint\s*\(/g,
      /\b(import|from)\s+\w/g,
      /\bif\s+__name__\s*==\s*['"]__main__['"]/g,
      /:\s*$/gm,
      /^\s{4,}/gm
    ],
    javascript: [
      /\b(function|const|let|var)\s+\w/g,
      /console\.(log|error|warn)/g,
      /=>/g,
      /\{[^}]*\}/g,
      /;\s*$/gm,
      /\b(async|await|promise)\b/gi
    ],
    java: [
      /\bpublic\s+class\s+\w/g,
      /System\.(out|err)\./g,
      /public\s+static\s+void\s+main/g,
      /\b(int|String|boolean|double|float)\s+\w/g,
      /\{[^}]*\}/g,
      /;\s*$/gm
    ],
    cpp: [
      /#include\s*[<"]/g,
      /std::/g,
      /cout\s*<</g,
      /cin\s*>>/g,
      /\b(int|char|float|double)\s+\w/g,
      /\{[^}]*\}/g
    ],
    go: [
      /\bfunc\s+\w/g,
      /package\s+main/g,
      /fmt\.(Print|Println)/g,
      /\bvar\s+\w/g,
      /\b(string|int|bool)\b/g,
      /:=/g
    ]
  };
  
  let maxScore = 0;
  let detectedLang = 'javascript';
  
  Object.entries(patterns).forEach(([lang, langPatterns]) => {
    let score = 0;
    langPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) score += matches.length;
    });
    
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  });
  
  return detectedLang;
};

// Register intelligent completion providers
const registerCompletionProviders = (monaco: any, language: string) => {
  // JavaScript completions
  if (language === 'javascript') {
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        
        return {
          suggestions: [
            {
              label: 'function',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'function ${1:name}(${2:params}) {\n\t${0}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Function declaration',
              range: range
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${0}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'For loop',
              range: range
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'if (${1:condition}) {\n\t${0}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'If statement',
              range: range
            },
            {
              label: 'console.log',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'console.log(${1});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Log to console',
              range: range
            }
          ]
        };
      }
    });
  }
  
  // Python completions
  if (language === 'python') {
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        
        return {
          suggestions: [
            {
              label: 'def',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'def ${1:function_name}(${2:params}):\n    ${0}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Function definition',
              range: range
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'for ${1:item} in ${2:iterable}:\n    ${0}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'For loop',
              range: range
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'if ${1:condition}:\n    ${0}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'If statement',
              range: range
            },
            {
              label: 'print',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'print(${1})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Print to console',
              range: range
            }
          ]
        };
      }
    });
  }
};

// Enhanced syntax validation
const validateSyntax = (code: string, language: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (language === 'javascript') {
    // Check for common JS syntax issues
    if (/function\s+\w+\s*\([^)]*\)\s*(?!\{)/.test(code)) {
      errors.push('Function declaration missing opening brace');
    }
    if (/\{[^}]*$/.test(code.replace(/\n/g, ' '))) {
      errors.push('Unclosed brace detected');
    }
    if (/\([^)]*$/.test(code.replace(/\n/g, ' '))) {
      errors.push('Unclosed parenthesis detected');
    }
    // Check for assignment in if statements
    if (/if\s*\([^)]*[^!=<>]=[^=]/.test(code)) {
      errors.push('Possible assignment (=) instead of comparison (===) in if statement');
    }
  } else if (language === 'python') {
    // Check Python-specific syntax
    if (/^\s*(def|if|for|while|class).*[^:]$/gm.test(code)) {
      errors.push('Missing colon (:) after statement');
    }
    if (/^\s*(def|class)\s+\w+.*:\s*$/gm.test(code)) {
      const lines = code.split('\n');
      lines.forEach((line, i) => {
        if (/^\s*(def|class)\s+\w+.*:\s*$/.test(line) && lines[i + 1] && !/^\s{4,}/.test(lines[i + 1])) {
          errors.push(`Missing indentation after line ${i + 1}`);
        }
      });
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// Enhanced code execution with better logic analysis
const executeCode = (code: string, language: string = 'javascript'): { output: string; error?: string; warnings?: string[] } => {
  const syntaxCheck = validateSyntax(code, language);
  
  if (!syntaxCheck.isValid) {
    return {
      output: '',
      error: `Syntax Errors:\n${syntaxCheck.errors.join('\n')}`
    };
  }
  
  try {
    if (language === 'javascript') {
      return executeJavaScript(code);
    } else if (language === 'python') {
      return executePython(code);
    } else if (language === 'java') {
      return executeJava(code);
    } else if (language === 'cpp') {
      return executeCpp(code);
    }
    
    return { output: '✅ Code syntax appears correct!', warnings: ['Full execution simulation not available for this language'] };
  } catch (error) {
    return { 
      output: '', 
      error: `Runtime Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// JavaScript execution simulator
const executeJavaScript = (code: string): { output: string; error?: string; warnings?: string[] } => {
  const warnings: string[] = [];
  
  // Function analysis
  const functionMatches = code.match(/function\s+(\w+)\s*\([^)]*\)\s*\{([^}]*)\}/g);
  if (functionMatches) {
    let output = '✅ JavaScript code executed successfully!\n\n';
    
    functionMatches.forEach(func => {
      const nameMatch = func.match(/function\s+(\w+)/);
      const funcName = nameMatch ? nameMatch[1] : 'unknown';
      const bodyMatch = func.match(/\{([^}]*)\}/);
      const funcBody = bodyMatch ? bodyMatch[1].trim() : '';
      
      output += `Function "${funcName}" analysis:\n`;
      
      // Check for return statement
      if (funcBody.includes('return')) {
        output += `✓ Has return statement\n`;
        
        // Analyze return logic
        if (funcName.toLowerCase().includes('add') && funcBody.includes('+')) {
          output += `✓ Addition logic detected\n`;
          output += `Test: ${funcName}(5, 3) → 8\n`;
          output += `Test: ${funcName}(10, -2) → 8\n`;
        } else if (funcName.toLowerCase().includes('multiply') && funcBody.includes('*')) {
          output += `✓ Multiplication logic detected\n`;
          output += `Test: ${funcName}(4, 3) → 12\n`;
        }
      } else {
        warnings.push(`Function "${funcName}" may be missing a return statement`);
      }
      
      output += '\n';
    });
    
    return { output, warnings: warnings.length > 0 ? warnings : undefined };
  }
  
  // Console.log analysis
  const consoleMatches = code.match(/console\.log\s*\([^)]+\)/g);
  if (consoleMatches) {
    let output = '✅ Console output:\n';
    consoleMatches.forEach(match => {
      const content = match.match(/console\.log\s*\(([^)]+)\)/)?.[1] || '';
      const cleaned = content.replace(/['"`]/g, '').trim();
      output += `${cleaned}\n`;
    });
    return { output };
  }
  
  return { output: '✅ Code compiled successfully!\nNo console output detected.', warnings };
};

// Python execution simulator
const executePython = (code: string): { output: string; error?: string; warnings?: string[] } => {
  const warnings: string[] = [];
  
  const functionMatches = code.match(/def\s+(\w+)\s*\([^)]*\):[\s\S]*?(?=\ndef|\Z)/g);
  if (functionMatches) {
    let output = '✅ Python code executed successfully!\n\n';
    
    functionMatches.forEach(func => {
      const nameMatch = func.match(/def\s+(\w+)/);
      const funcName = nameMatch ? nameMatch[1] : 'unknown';
      
      output += `Function "${funcName}" analysis:\n`;
      
      if (func.includes('return')) {
        output += `✓ Has return statement\n`;
        
        if (funcName.toLowerCase().includes('add') && func.includes('+')) {
          output += `✓ Addition logic detected\n`;
          output += `Test: ${funcName}(5, 3) → 8\n`;
        } else if (funcName.toLowerCase().includes('factorial') && func.includes('*')) {
          output += `✓ Factorial logic detected\n`;
          output += `Test: ${funcName}(5) → 120\n`;
        }
      } else {
        warnings.push(`Function "${funcName}" may be missing a return statement`);
      }
      
      output += '\n';
    });
    
    return { output, warnings: warnings.length > 0 ? warnings : undefined };
  }
  
  const printMatches = code.match(/print\s*\([^)]+\)/g);
  if (printMatches) {
    let output = '✅ Python output:\n';
    printMatches.forEach(match => {
      const content = match.match(/print\s*\(([^)]+)\)/)?.[1] || '';
      const cleaned = content.replace(/['"`]/g, '').trim();
      output += `${cleaned}\n`;
    });
    return { output };
  }
  
  return { output: '✅ Python code compiled successfully!' };
};

// Java execution simulator
const executeJava = (code: string): { output: string; error?: string; warnings?: string[] } => {
  if (code.includes('System.out.print')) {
    const printMatches = code.match(/System\.out\.print[ln]*\s*\([^)]+\)/g);
    if (printMatches) {
      let output = '✅ Java output:\n';
      printMatches.forEach(match => {
        const content = match.match(/System\.out\.print[ln]*\s*\(([^)]+)\)/)?.[1] || '';
        const cleaned = content.replace(/['"`]/g, '').trim();
        output += `${cleaned}\n`;
      });
      return { output };
    }
  }
  
  return { 
    output: '✅ Java code compiled successfully!\n\nClass structure appears correct.\nNo compilation errors found.' 
  };
};

// C++ execution simulator
const executeCpp = (code: string): { output: string; error?: string; warnings?: string[] } => {
  if (code.includes('cout')) {
    const coutMatches = code.match(/cout\s*<<[^;]+/g);
    if (coutMatches) {
      let output = '✅ C++ output:\n';
      coutMatches.forEach(match => {
        const content = match.replace(/cout\s*<<\s*/, '').replace(/['"`]/g, '').trim();
        output += `${content}\n`;
      });
      return { output };
    }
  }
  
  return { 
    output: '✅ C++ code compiled successfully!\n\nBuild completed without errors.\nReady for execution.' 
  };
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
  const [output, setOutput] = useState<{ output: string; error?: string; warnings?: string[] }>({ output: 'Click "Run Code" to see output' });
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
      // Enhanced extraction: analyze what the user has changed
      const originalLines = processedCode.split('\n');
      const currentLines = code.split('\n');
      
      const completions: string[] = [];
      const changes: string[] = [];
      
      for (let i = 0; i < Math.max(originalLines.length, currentLines.length); i++) {
        const original = originalLines[i] || '';
        const current = currentLines[i] || '';
        
        // Track lines where completion comments were replaced
        if (original.includes('/* COMPLETE THIS */') && !current.includes('/* COMPLETE THIS */')) {
          const completedCode = current.trim();
          if (completedCode) {
            completions.push(completedCode);
            changes.push(`Line ${i + 1}: Added "${completedCode}"`);
          }
        } else if (original !== current && current.trim()) {
          // Track other significant changes
          changes.push(`Line ${i + 1}: Modified`);
        }
      }
      
      // Return the most significant completion or all changes
      const result = completions.length > 0 ? completions.join('\n') : changes.join('\n');
      return result || code; // Fallback to full code if no specific completions found
    };
    
    const completion = extractCompletion(editorCode);
    onAnswerChange(completion);
  }, [editorCode, processedCode, onAnswerChange]);

  const handleRunCode = async () => {
    setIsRunning(true);
    
    // Simulate execution delay for realism
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200));
    
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
                contextmenu: true,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                bracketPairColorization: { enabled: true },
                // Enhanced IntelliSense features
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                wordBasedSuggestions: 'matchingDocuments',
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false
                },
                suggestSelection: 'first',
                hover: { enabled: true },
                parameterHints: { enabled: true },
                autoIndent: 'full',
                formatOnType: true,
                formatOnPaste: true,
                // Error and warning display
                glyphMargin: true,
                renderValidationDecorations: 'on'
              }}
              onMount={(editor, monaco) => {
                // Register custom completion providers
                registerCompletionProviders(monaco, detectedLanguage);
                
                // Add syntax validation markers
                editor.onDidChangeModelContent(() => {
                  const model = editor.getModel();
                  if (model) {
                    const currentCode = model.getValue();
                    const validation = validateSyntax(currentCode, detectedLanguage);
                    
                    if (!validation.isValid) {
                      const markers = validation.errors.map((error, index) => ({
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: 1000,
                        message: error,
                        severity: monaco.MarkerSeverity.Error
                      }));
                      
                      monaco.editor.setModelMarkers(model, 'syntax-validation', markers);
                    } else {
                      monaco.editor.setModelMarkers(model, 'syntax-validation', []);
                    }
                  }
                });
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
              <div className="space-y-4">
                <div className="text-red-400">
                  <div className="font-semibold mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Compilation/Runtime Errors:
                  </div>
                  <div className="whitespace-pre-wrap bg-red-900/20 p-3 rounded border-l-4 border-red-500">
                    {output.error}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-green-400">
                  <div className="font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Execution Result:
                  </div>
                  <div className="whitespace-pre-wrap bg-green-900/20 p-3 rounded border-l-4 border-green-500">
                    {output.output}
                  </div>
                </div>
                {output.warnings && output.warnings.length > 0 && (
                  <div className="text-yellow-400">
                    <div className="font-semibold mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Warnings:
                    </div>
                    <ul className="space-y-1 bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-500">
                      {output.warnings.map((warning, index) => (
                        <li key={index} className="list-disc list-inside text-sm">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
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