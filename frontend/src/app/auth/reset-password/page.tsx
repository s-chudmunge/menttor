'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import ErrorBanner from '@/components/ErrorBanner';
import Logo from '../../../../components/Logo';
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { confirmPasswordResetWithCode, getCurrentUser } from '@/lib/auth/utils';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [resetComplete, setResetComplete] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Supabase automatically handles the session from the reset link
        // Just check if we have a valid user session
        const user = await getCurrentUser();

        if (user && user.email) {
          setUserEmail(user.email);
          setVerifying(false);
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.');
          setVerifying(false);
        }
      } catch (error: any) {
        console.error('Error checking session:', error);
        setError('Invalid or expired reset link. Please request a new password reset.');
        setVerifying(false);
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordResetWithCode(password);
      setResetComplete(true);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      let errorMessage = 'Failed to reset password. Please try again.';

      if (error.message?.includes('expired')) {
        errorMessage = 'This reset link has expired. Please request a new password reset.';
      } else if (error.message?.includes('invalid')) {
        errorMessage = 'This reset link is invalid. Please request a new password reset.';
      } else if (error.message?.includes('weak')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verifying Reset Link</h2>
          <p className="text-blue-200">Please wait while we verify your password reset link...</p>
        </div>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful</h2>
          <p className="text-blue-200 mb-6">Your password has been successfully reset. You can now sign in with your new password.</p>
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full group"
          >
            <span className="flex items-center justify-center">
              Continue to Sign In
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <p className="text-blue-200">Set your new password</p>
          </div>

          {/* Form Container */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
            {error ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Reset Link Invalid</h2>
                <ErrorBanner message={error} />
                <div className="mt-6">
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 112-4 2 2 0 012 2v2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Set New Password</h2>
                  <p className="text-blue-200">
                    Choose a new password for <span className="text-white font-semibold">{userEmail}</span>
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleResetPassword}>
                  <InputField
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    label="New Password"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputField
                    id="confirm-new-password"
                    name="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    label="Confirm New Password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    className="w-full group"
                  >
                    <span className="flex items-center justify-center">
                      {loading ? (
                        'Updating Password...'
                      ) : (
                        <>
                          Update Password
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </Button>
                </form>

                <div className="text-center mt-6 pt-6 border-t border-white/20">
                  <Link
                    href="/auth/signin"
                    className="text-sm text-blue-300 hover:text-white focus:outline-none focus:underline transition-colors"
                  >
                    Back to Sign In
                  </Link>
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
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="animate-spin w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
        <p className="text-blue-200">Please wait...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}