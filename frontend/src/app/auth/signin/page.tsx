'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../../../components/Logo';
import { ArrowRight, BookOpen, Target, TrendingUp } from 'lucide-react';
import { Github as GitHub } from 'lucide-react';
import { Chrome as Google } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { signUp, signIn, googleSignIn, githubSignIn } from '@/lib/auth/utils';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Email and password are required.');
      setIsLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signIn(email, password);
        // Redirect will be handled by the useEffect after sign in
      } else {
        await signUp(email, password);
        setSuccess('Registration successful! You can now sign in.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (user) {
    return null;
  }

  return (
    <div className="bg-white min-h-screen font-sans flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <Link href="/">
            <a>
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
            </a>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-gray-600">
            {isLogin 
              ? 'Sign in to continue your learning journey' 
              : 'Create your account to begin learning'
            }
          </p>
        </div>

        <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-md">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-xl">
              <p className="text-green-700 text-sm text-center">{success}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleAuthSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-6 py-4 rounded-lg font-semibold text-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <span className="flex items-center justify-center">
                {isLoading ? (
                  isLogin ? 'Signing In...' : 'Creating Account...'
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              {isLogin ? "New to Menttor?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccess(null);
                }}
                className="font-semibold text-black hover:underline focus:outline-none transition-colors"
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-black transition-colors">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-black transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}