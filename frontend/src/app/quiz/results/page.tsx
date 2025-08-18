// @ts-nocheck
'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

const QuizResultsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const attemptId = searchParams.get('attempt_id');
    const { user } = useAuth();

    const { data: results, isLoading, error } = useQuery({
        queryKey: ['quizResult', attemptId],
        queryFn: async () => {
            if (!attemptId || !user) return null;
            const response = await api.get(`/quizzes/results/attempt/${attemptId}`);
            return response.data;
        },
        enabled: !!attemptId && !!user,
    });

    const { data: quiz } = useQuery({
        queryKey: ['quiz', results?.quiz_id],
        queryFn: async () => {
            if (!results?.quiz_id || !user) return null;
            const response = await api.get(`/quizzes/${results.quiz_id}`);
            return response.data;
        },
        enabled: !!results?.quiz_id && !!user,
    });

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center">Error: {error.message}</div>;
    }

    if (!results) {
        return <div className="min-h-screen flex items-center justify-center">No results found.</div>;
    }

    const getOptionText = (questionId: number, optionId: number) => {
        const question = quiz?.questions.find(q => q.id === questionId);
        if (!question) return 'N/A';
        const option = question.options.find(o => o.id === optionId);
        return option ? option.text : 'N/A';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
            <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200/50">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">Quiz Results</h1>
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-indigo-600">Score: {results.score.toFixed(2)}%</h2>
                </div>
                <div>
                    {results.question_results.map((qr, index) => (
                        <div key={index} className="mb-6 pb-6 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-800">{index + 1}. {quiz?.questions.find(q => q.id === qr.question_id)?.question_text}</h3>
                            <p className={`mt-2 text-gray-700 ${qr.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                                Your answer: <span className="font-medium">{getOptionText(qr.question_id, qr.selected_answer_id)}</span>
                                {qr.is_correct ? <CheckCircle className="inline-block ml-2" /> : <XCircle className="inline-block ml-2" />}
                            </p>
                            {!qr.is_correct && (
                                <p className="text-gray-700">Correct answer: <span className="font-medium text-green-600">{getOptionText(qr.question_id, qr.correct_answer_id)}</span></p>
                            )}
                            <p className="mt-2 text-sm text-gray-600">Explanation: {qr.explanation}</p>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => {
                        sessionStorage.setItem('returning-from-quiz', 'true');
                        router.push('/journey');
                    }}
                    className="mt-8 w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-xl hover:scale-105"
                >
                    Back to Journey
                </button>
            </div>
        </div>
    );
};

export default QuizResultsPage;