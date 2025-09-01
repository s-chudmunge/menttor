'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../lib/firebase/client';
import HistoricalResults from './HistoricalResults';

interface ResultsClientPageProps {
    summary: any;
    historicalResults: any;
    errorSummary: string | null;
    errorHistorical: string | null;
}

export default function ResultsClientPage({
    summary,
    historicalResults,
    errorSummary,
    errorHistorical,
}: ResultsClientPageProps) {

    const { user, loading } = useAuth();

    return (
        <>
            <header className="bg-white shadow-md py-4 sticky top-0 z-10">
                <nav className="flex justify-between items-center max-w-6xl mx-auto px-5">
                    <div className="text-2xl font-bold text-blue-600">MenttorLabs</div>
                    <ul className="flex space-x-6">
                        <li><Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link></li>
                        {!loading && user ? (
                            <>
                                <li><Link 
                                    href="/journey" 
                                    className="text-gray-700 hover:text-blue-600 font-medium"
                                    onClick={() => sessionStorage.setItem('returning-from-quiz', 'true')}
                                >Journey</Link></li>
                                <li><Link href="/learn" className="text-gray-700 hover:text-blue-600 font-medium">Learn</Link></li>
                                <li><Link href="/performance-analysis" className="text-gray-700 hover:text-blue-600 font-medium">Performance</Link></li>
                                <li>
                                    <button
                                        onClick={() => auth.signOut()}
                                        className="text-gray-700 hover:text-blue-600 font-medium focus:outline-none"
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : !loading && !user ? (
                            <>
                                <li><Link href="/auth/signin" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link></li>
                                <li><Link href="/auth/register" className="text-gray-700 hover:text-blue-600 font-medium">Register</Link></li>
                            </>
                        ) : (
                            <li><span className="text-gray-700 font-medium">Loading...</span></li>
                        )}
                    </ul>
                </nav>
            </header>

            <main className="flex flex-col max-w-6xl mx-auto my-10 px-5 gap-8">
                <section className="bg-white shadow-lg rounded-xl p-10">
                    <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">Quiz Results Dashboard</h1>
                </section>

                <section className="bg-white shadow-lg rounded-xl p-10">
                    <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Historical Quiz Results</h2>
                    <HistoricalResults historicalResults={historicalResults} error={errorHistorical} />
                </section>
            </main>

            <footer className="bg-white shadow-md py-6 text-center text-gray-600 text-sm mt-12">
                <p>&copy; 2024 MenttorLabs. All rights reserved.</p>
                <p className="mt-2">Built with ❤️ for learners</p>
            </footer>
        </>
    );
}
