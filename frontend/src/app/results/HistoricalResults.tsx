'use client';

import React from 'react';

interface QuestionResult {
    question_id: number;
    selected_answer_id: number | null;
    correct_answer_id: number | null;
    is_correct: boolean;
    explanation: string | null;
}

interface QuizResult {
    id: number;
    user_id: number;
    quiz_id: number;
    sub_topic_id: string;
    score: number;
    total_questions: number;
    completed_at: string;
    question_results: QuestionResult[];
}

interface HistoricalResultsProps {
    historicalResults: QuizResult[] | null;
    error: string | null;
}

const HistoricalResults: React.FC<HistoricalResultsProps> = ({ historicalResults, error }) => {
    if (error) {
        return <p className="text-red-500 text-center">Error: {error}</p>;
    }

    if (!historicalResults) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100px]">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading historical results...</p>
            </div>
        );
    }

    return (
        <div>
            {historicalResults.length > 0 ? (
                historicalResults.map(quizResult => (
                    <div key={quizResult.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                        <h3 className="text-xl font-semibold text-blue-700 mb-2">Quiz on {quizResult.sub_topic_id.replace(/-/g, ' ')}</h3>
                        <p className="text-lg mb-1">Score: <span className="font-bold text-green-600">{quizResult.score}/{quizResult.total_questions}</span></p>
                        <p className="text-sm text-gray-500 mb-4">Completed: {new Date(quizResult.completed_at).toLocaleString()}</p>
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3">Question Breakdown:</h4>
                            <div className="space-y-3">
                                {quizResult.question_results.map((qResult, qIdx) => {
                                    let statusClass = '';
                                    let statusText = '';

                                    if (qResult.is_correct) {
                                        statusClass = 'bg-green-100 border-green-400 text-green-700';
                                        statusText = 'Correct';
                                    } else if (qResult.selected_answer_id === null || qResult.selected_answer_id === undefined) {
                                        statusClass = 'bg-yellow-100 border-yellow-400 text-yellow-700';
                                        statusText = 'Skipped';
                                    } else {
                                        statusClass = 'bg-red-100 border-red-400 text-red-700';
                                        statusText = 'Incorrect';
                                    }
                                    return (
                                        <div key={qIdx} className={`p-3 rounded-md border ${statusClass}`}>
                                            <p className="font-medium"><strong>Question ID: {qResult.question_id}</strong> - Status: {statusText}</p>
                                            {qResult.explanation && <p className="text-sm italic mt-1">Explanation: {qResult.explanation}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-gray-600">No historical quiz results found yet.</p>
            )}
        </div>
    );
};

export default HistoricalResults;
