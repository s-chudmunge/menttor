'use client';

import { useState, useEffect } from 'react';
import PerformanceAnalysisClientPage from './PerformanceAnalysisClientPage';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { api } from '@/lib/api';

const fetchUserPerformanceDetails = async () => {
    try {
        console.log('Attempting to fetch user performance details...');
        const response = await api.get('/ml-insights/user-performance-details');
        console.log('Performance details fetched successfully:', response.data);
        return { data: response.data, error: null };
    } catch (error: any) {
        console.error('Error fetching performance details:', error);
        console.error('Error response:', error.response);
        
        if (error.code === 'ERR_NETWORK') {
            return { data: null, error: 'Network error - please check if the backend is running' };
        }
        
        if (error.response?.status === 401) {
            return { data: null, error: 'Authentication failed - please try refreshing the page' };
        }
        
        return { 
            data: null, 
            error: error.response?.data?.detail || error.message || 'Failed to fetch performance details' 
        };
    }
};

const PerformanceAnalysisPage = () => {
    const { user } = useAuth();
    const [performanceDetails, setPerformanceDetails] = useState(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('Performance analysis page - user state:', user);
        
        // First test basic connectivity
        api.get('/health').then(response => {
            console.log('Health check successful:', response.data);
        }).catch(error => {
            console.error('Health check failed:', error);
        });
        
        if (user) {
            console.log('User authenticated, fetching performance details...');
            // Add a small delay to ensure user is fully loaded
            setTimeout(() => {
                fetchUserPerformanceDetails()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('Setting error:', error);
                            setError(error);
                        } else {
                            console.log('Setting performance data:', data);
                            setPerformanceDetails(data);
                        }
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            }, 1000);
        } else {
            console.log('No user found, setting loading to false');
            setIsLoading(false);
        }
    }, [user]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <PerformanceAnalysisClientPage
            performanceDetails={performanceDetails}
            error={error}
        />
    );
};

const ProtectedPerformanceAnalysisPage = () => (
    <ProtectedRoute>
        <PerformanceAnalysisPage />
    </ProtectedRoute>
);

export default ProtectedPerformanceAnalysisPage;