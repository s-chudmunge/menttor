import React, { useState, useEffect } from 'react';
import { LearningContent } from '../../types/learning';
import { BookOpen, CheckCircle, FileText, ArrowRight, Download } from 'lucide-react';

interface Props {
  content: LearningContent;
  onMarkAsLearned?: () => void;
  onTakeQuiz?: () => void;
  onContinueLearning?: () => void;
  onDownloadPDF?: () => void;
  isCompleted?: boolean;
  isMarkingAsLearned?: boolean;
}

const FloatingTOC: React.FC<Props> = ({ content, onMarkAsLearned, onTakeQuiz, onContinueLearning, onDownloadPDF, isCompleted, isMarkingAsLearned }) => {
  const [activeId, setActiveId] = useState('');

  const headings = content.filter(block => block.type === 'heading');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    headings.forEach((heading, index) => {
      const slug = heading.data.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
      const id = `heading-${slug}`;
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [content]);

  return (
    <aside className="hidden lg:block w-64 sticky top-24 self-start flex-shrink-0">
        <div className="bg-gray-50 border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-300">
                <BookOpen className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-800">Contents</h3>
            </div>
            <nav>
                <ul className="space-y-1">
                {headings.map((heading, index) => {
                    const slug = heading.data.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
                    const id = `heading-${slug}`;

                    const isActive = activeId === id;
                    return (
                    <li key={id}>
                        <a
                        href={`#${id}`}
                        className={`block py-2 px-3 text-sm transition-colors border-l-2 ${isActive ? 'bg-blue-50 text-blue-700 border-blue-500 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        >
                        {heading.data.text}
                        </a>
                    </li>
                    );
                })}
                </ul>
            </nav>
            
            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-gray-300 space-y-2">
                {/* Mark as Complete Button */}
                {onMarkAsLearned && !isCompleted && (
                    <button
                        onClick={onMarkAsLearned}
                        disabled={isMarkingAsLearned}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isMarkingAsLearned ? (
                            <>
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                Marking...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-3 h-3" />
                                Mark as Learned
                            </>
                        )}
                    </button>
                )}

                {/* Quiz Button */}
                {onTakeQuiz && (
                    <button
                        onClick={onTakeQuiz}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                    >
                        <FileText className="w-3 h-3" />
                        Take Quiz
                    </button>
                )}

                {/* Download PDF Button */}
                {onDownloadPDF && (
                    <button
                        onClick={onDownloadPDF}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        Download PDF
                    </button>
                )}

                {/* Continue Learning Button */}
                {onContinueLearning && (
                    <button
                        onClick={onContinueLearning}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                    >
                        <ArrowRight className="w-3 h-3" />
                        Continue Learning
                    </button>
                )}

                {/* Completion Message */}
                {isCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center text-green-800 text-xs mb-2">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            <span className="font-medium">Completed! 🎉</span>
                        </div>
                        <button
                            onClick={() => window.location.href = '/journey'}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                        >
                            <ArrowRight className="w-3 h-3 rotate-180" />
                            Back to Journey
                        </button>
                    </div>
                )}
            </div>
        </div>
    </aside>
  );
};

export default FloatingTOC;