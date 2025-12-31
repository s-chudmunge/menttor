'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import SocialButton from '@/components/SocialButton';
import ErrorBanner from '@/components/ErrorBanner';
import Logo from '../../../../components/Logo';
import { ArrowRight, BookOpen, Target, TrendingUp } from 'lucide-react';
import { Github as GitHub } from 'lucide-react';
import { Chrome as Google } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { signUp, signIn, googleSignIn, githubSignIn } from '@/lib/auth/utils';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Check if user has completed onboarding and roadmaps to redirect appropriately
      const checkUserStatusAndRedirect = async () => {
        try {
          // Use the existing API instance to check onboarding status and roadmaps
          const { api } = await import('@/lib/api');
          
          // Check onboarding status
          const onboardingData = await api.get('/auth/onboarding-status');
          
          // If user doesn't need onboarding, check if they have a current roadmap from onboarding
          if (!onboardingData.data.needs_onboarding) {
            try {
              // First check if there's a roadmap from onboarding process
              const currentRoadmap = sessionStorage.getItem('currentRoadmap');
              if (currentRoadmap) {
                // User just completed onboarding and has a roadmap, redirect to journey
                sessionStorage.setItem('showWelcomeMessage', 'true');
                router.push('/journey');
                return;
              }
              
              // Otherwise check if they have any existing roadmaps
              const roadmaps = await api.get('/roadmaps/user');
              
              // If user has roadmaps, redirect to journey page  
              if (roadmaps.data && roadmaps.data.length > 0) {
                // Load the most recent roadmap
                const latestRoadmap = roadmaps.data[0];
                sessionStorage.setItem('currentRoadmap', JSON.stringify(latestRoadmap));
                sessionStorage.setItem('showWelcomeMessage', 'true');
                router.push('/journey');
                return;
              }
            } catch (error) {
              console.error('Error checking roadmaps:', error);
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
        
        // Default redirect to home page
        router.push('/');
      };
      
      checkUserStatusAndRedirect();
    }
  }, [user, loading, router]);

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

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);
    try {
      if (provider === 'google') {
        await googleSignIn();
      } else {
        await githubSignIn();
      }
      // Redirect will be handled by the useEffect after sign in
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  };



  const handleBackToMain = () => {
    setShowForgotPassword(false);
    setError(null);
  };

  const handleForgotPasswordError = (error: string) => {
    setError(error);
  };

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="flex">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            {/* Logo */}
            <div className="mb-12">
              <div className="flex items-center">
                <Logo />
              </div>
              <p className="mt-4 text-xl text-blue-100 font-light">
                Your personalized learning companion
              </p>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Adaptive Learning</h3>
                  <p className="text-blue-100 text-sm mt-1">Smart learning content that adapts to your learning style and progress</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Personalized Roadmaps</h3>
                  <p className="text-blue-100 text-sm mt-1">Custom learning paths designed for your goals and timeline</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Progress Tracking</h3>
                  <p className="text-blue-100 text-sm mt-1">Detailed analytics and insights to optimize your learning journey</p>
                </div>
              </div>
            </div>

            {/* Bottom Quote */}
            <div className="mt-16 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <p className="text-white/90 italic text-sm">
                "Transform your learning experience with smart learning technology tailored just for you."
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <p className="text-blue-200">Your personalized learning companion</p>
            </div>

            {/* Form Container */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
              {showForgotPassword ? (
                <ForgotPasswordModal
                  onError={handleForgotPasswordError}
                  onBack={handleBackToMain}
                />
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {isLogin ? 'Welcome Back' : 'Get Started'}
                    </h2>
                    <p className="text-blue-200">
                      {isLogin 
                        ? 'Sign in to continue your learning journey' 
                        : 'Create your account to begin learning'
                      }
                    </p>
                  </div>

                  {error && <ErrorBanner message={error} />}
                  {success && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-400/50 rounded-xl">
                      <p className="text-green-300 text-sm text-center">{success}</p>
                    </div>
                  )}

                  {/* Social Login */}
                  <div className="space-y-3 mb-6">
                    <SocialButton
                      provider="google"
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={isLoading}
                    >
                      Continue with Google
                    </SocialButton>
                    <SocialButton
                      provider="github"
                      onClick={() => handleOAuthSignIn('github')}
                      disabled={isLoading}
                    >
                      Continue with GitHub
                    </SocialButton>
                  </div>

                  {/* Divider */}
                  <div className="mb-6">
                    <div className="text-center">
                      <span className="text-sm text-blue-200">or continue with email</span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full border-t border-white/30" />
                    </div>
                  </div>

                  {/* Email Form */}
                  <form className="space-y-5" onSubmit={handleAuthSubmit}>
                    <InputField
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      label="Email address"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div>
                      <InputField
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      {isLogin && (
                        <div className="text-right mt-2">
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-blue-300 hover:text-white focus:outline-none focus:underline transition-colors"
                          >
                            Forgot your password?
                          </button>
                        </div>
                      )}
                    </div>
                    {!isLogin && (
                      <InputField
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    )}
                    <Button
                      type="submit"
                      loading={isLoading}
                      disabled={isLoading}
                      className="w-full group"
                    >
                      <span className="flex items-center justify-center">
                        {isLoading ? (
                          isLogin ? 'Signing In...' : 'Creating Account...'
                        ) : (
                          <>
                            {isLogin ? 'Sign In' : 'Create Account'}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                    </Button>
                  </form>

                  {/* Toggle Auth Mode */}
                  <div className="text-center mt-6 pt-6 border-t border-white/20">
                    <p className="text-blue-200 text-sm">
                      {isLogin ? "New to Menttor?" : "Already have an account?"}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(!isLogin);
                          setError(null);
                          setSuccess(null);
                        }}
                        className="font-semibold text-blue-300 hover:text-white focus:outline-none focus:underline transition-colors"
                      >
                        {isLogin ? 'Create an account' : 'Sign in'}
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-blue-300 mt-4">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-white transition-colors">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}